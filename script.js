import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function gaussianRandom(mean, stdDev) {
    let u1 = Math.random();
    let u2 = Math.random();
    let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
}

document.addEventListener('DOMContentLoaded', (event) => {

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    document.body.appendChild(renderer.domElement);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x404040, 10); // soft white light
    scene.add(ambientLight);

    // Sun (Point Light)
    const sunLight = new THREE.PointLight(0xffffff, 5, 100, 0);
    sunLight.position.set(-30, 0, -10); // Position to the left of the camera
    scene.add(sunLight);

    // Visual representation of Sun as a yellow unlit sphere
    const sunGeometry = new THREE.SphereGeometry(1, 32, 32);  // 1 is the radius of the sphere
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });  // yellow and unlit
    const sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
    sunSphere.position.copy(sunLight.position);  // Set the position to be the same as sunLight
    scene.add(sunSphere);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(5, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x2255ff,
        specular: 0x222222,  // Adding some specular highlights
        shininess: 100.0  // Adding shininess
    });    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

// Vertex Shader
// language=GLSL
    const vertexShader = `
precision highp float;
varying vec4 vWorldPosition;
varying float fov;

const float PI = 3.14159265359;

varying vec3 viewRay; // View space ray direction

void main() {
    vWorldPosition = modelMatrix * vec4(position, 1.0);

    // Compute clip-space position
    vec4 clipSpacePos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    // Compute normalized device coordinates (NDC)
    vec3 ndc = clipSpacePos.xyz / clipSpacePos.w;

    // Compute the view-space ray direction
    vec4 clipRay = vec4(ndc.x, ndc.y, -1.0, 1.0);
    vec4 tempViewRay = inverse(projectionMatrix) * clipRay;
    viewRay = vec3(tempViewRay.x, tempViewRay.y, -1.0);
    
    gl_Position = clipSpacePos;
    
    
    fov = 2.0 * atan(1.0 / projectionMatrix[1][1]) * (180.0 / PI);
}
`;


// Fragment Shader
// language=GLSL
    const fragmentShader = `
precision highp float;
uniform vec3 lightPosition;
uniform float lightIntensity;
uniform vec2 iResolution;
varying float fov;

uniform float surfaceRadius;
uniform float atmoRadius;


varying vec4 vWorldPosition;
varying vec3 viewRay; // View space ray direction

// Written by GLtracy

// math const
    const float PI = 3.14159265359;
    const float MAX = 10000.0;


// ray intersects sphere
// e = -b +/- sqrt( b^2 - c )
    vec2 ray_vs_sphere( vec3 p, vec3 dir, float r ) {
        float b = dot( p, dir );
        float c = dot( p, p ) - r * r;

        float d = b * b - c;
        if ( d < 0.0 ) {
            return vec2( MAX, -MAX );
        }
        d = sqrt( d );

        return vec2( -b - d, -b + d );
    }

// Mie
// g : ( -0.75, -0.999 )
//      3 * ( 1 - g^2 )               1 + c^2
// F = ----------------- * -------------------------------
//      8pi * ( 2 + g^2 )     ( 1 + g^2 - 2 * g * c )^(3/2)
    float phase_mie( float g, float c, float cc ) {
        float gg = g * g;

        float a = ( 1.0 - gg ) * ( 1.0 + cc );

        float b = 1.0 + gg - 2.0 * g * c;
        b *= sqrt( b );
        b *= 2.0 + gg;

        return ( 3.0 / 8.0 / PI ) * a / b;
    }

// Rayleigh
// g : 0
// F = 3/16PI * ( 1 + c^2 )
    float phase_ray( float cc ) {
        return ( 3.0 / 16.0 / PI ) * ( 1.0 + cc );
    }

// scatter const
//    float R_INNER = surfaceRadius;
//    float R = atmoRadius;

    const int NUM_OUT_SCATTER = 8;
    const int NUM_IN_SCATTER = 80;

    float density(vec3 p, float ph) {
        float altitude = length(p) - surfaceRadius;
        float atmoThickness = 1.0 * (atmoRadius - surfaceRadius);
        return exp(-max(altitude, 0.0) / (ph * atmoThickness));
    }


    float optic( vec3 p, vec3 q, float ph ) {
        vec3 s = ( q - p ) / float( NUM_OUT_SCATTER );
        vec3 v = p + s * 0.5;

        float sum = 0.0;
        for ( int i = 0; i < NUM_OUT_SCATTER; i++ ) {
            sum += density( v, ph );
            v += s;
        }
        sum *= length( s );

        return sum;
    }

    vec4 in_scatter( vec3 o, vec3 dir, vec2 e, vec3 l ) {
        const float ph_ray = 0.05; //0.05 orig
        const float ph_mie = 0.02;

        const vec3 k_ray = vec3( 3.8, 13.5, 33.1 );
        const vec3 k_mie = vec3( 21.0 );
//        const vec3 k_ray = vec3( 2.5, 4.5, 5.7 );
//        const vec3 k_mie = vec3( 4.0 );
        const float k_mie_ex = 1.1;

        vec3 sum_ray = vec3( 0.0 );
        vec3 sum_mie = vec3( 0.0 );

        float alpha_accum = 1.0; // Initialize alpha value
        
        float n_ray0 = 0.0;
        float n_mie0 = 0.0;

        float len = ( e.y - e.x ) / float( NUM_IN_SCATTER );
        vec3 s = dir * len;
        vec3 v = o + dir * ( e.x + len * 0.5 );

        for ( int i = 0; i < NUM_IN_SCATTER; i++, v += s ) {
            float d_ray = density( v, ph_ray ) * len;
            float d_mie = density( v, ph_mie ) * len;

            n_ray0 += d_ray;
            n_mie0 += d_mie;

            #if 0
            vec2 e = ray_vs_sphere( v, l, surfaceRadius );
            e.x = max( e.x, 0.0 );
            if ( e.x < e.y ) {
                continue;
            }
            #endif

            vec2 f = ray_vs_sphere( v, l, atmoRadius );
            vec3 u = v + l * f.y;

            float n_ray1 = optic( v, u, ph_ray );
            float n_mie1 = optic( v, u, ph_mie );

            vec3 att = exp( - ( n_ray0 + n_ray1 ) * k_ray - ( n_mie0 + n_mie1 ) * k_mie * k_mie_ex );

            sum_ray += d_ray * att;
            sum_mie += d_mie * att;

            float transmittance = 1.0 / float(NUM_IN_SCATTER);//length(att);  // or another measure
            alpha_accum += d_ray;//pow(transmittance, 1.0 / float(NUM_IN_SCATTER));  // Exponentiate to scale impact
//            alpha_accum += (1.0 - length(att)) * (1.0 / float(NUM_IN_SCATTER)); // Change this factor to control alpha accumulation
        }

        float c  = dot( dir, -l );
        float cc = c * c;
        vec3 scatter =
            sum_ray * k_ray * phase_ray( cc ) +
            sum_mie * k_mie * phase_mie( -0.78, c, cc );

        alpha_accum = 1.0 - alpha_accum;  // Convert transmittance to opacity
        alpha_accum = clamp(alpha_accum, 0.0, 1.0); // Clamping alpha between 0 and 1

        return vec4(10.0 * scatter, 10.0 * length(scatter));
    }

// ray direction
    vec3 ray_dir( float fov, vec2 size, vec2 pos ) {
        vec2 xy = pos - size * 0.5;

        float cot_half_fov = tan( radians( 90.0 - fov * 0.5 ) );
        float z = size.y * 0.5 * cot_half_fov;

        return normalize( vec3( xy, -z ) );
    }

void main() {
  vec2 fragCoord = gl_FragCoord.xy / iResolution.xy;
  vec4 fragColor;

    // Step 3: World Space Ray
    vec4 worldRay = inverse(viewMatrix) * vec4(viewRay, 0.0);
    
    // default ray dir
//        vec3 dir = ray_dir( 45.0, iResolution.xy, fragCoord.xy );
//        vec3 dir = normalize(vWorldPosition.xyz - cameraDirection);
//        vec3 dir = getRayDirInCameraSpace(gl_FragCoord.xy, iResolution, inverse(projectionMatrix));

    // Normalize the ray direction
    vec3 dir = normalize(worldRay.xyz);
    //vec3 dir = ray_dir( fov, iResolution.xy, gl_FragCoord.xy);



        // default ray origin
//        vec3 eye = vec3( 0.0, 0.0, 3.0 );
        vec3 eye = vWorldPosition.xyz;
//        vec3 eye = cameraPosition;
//        vec3 eye = dir;

        // rotate camera
        // mat3 rot = rot3xy( vec2( 0.0, iTime * 0.5 ) );
        // dir = rot * dir;
        // eye = rot * eye;

        // sun light dir
//        vec3 l = normalize(vec3( 30.0, 0.0, 10.0));//0.0, 0.0, 1.0 ));
        vec3 l = normalize(lightPosition - vWorldPosition.xyz);
//        vec3 l = normalize(lightPosition - cameraPosition);

        vec2 e = ray_vs_sphere( eye, dir, atmoRadius );
//        vec2 e = ray_vs_sphere( eye, dir, surfaceRadius );
        if ( e.x > e.y ) {
            fragColor = vec4( 1.0, 0.0, 0.0, 0.0 );
            gl_FragColor = fragColor;
            return;
        }

        vec2 f = ray_vs_sphere( eye, dir, surfaceRadius );
        e.y = min( e.y, f.x );

        vec4 I = in_scatter( eye, dir, e, l );

        vec4 I_gamma = pow( I, vec4(1.0 / 5.0) ) * lightIntensity;
    fragColor = I_gamma;
    gl_FragColor = fragColor;
//  gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); // Blue
  
//    // Normalize fragment coordinates to [0, 1] range
//  vec2 normalizedCoords = gl_FragCoord.xy /  iResolution.xy;
//  
//  // Use the fragment coordinates for some computation, e.g., a gradient
//  gl_FragColor = vec4(normalizedCoords.x, normalizedCoords.y, 0.0, 1.0);
}
`;




    // Atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(6, 32, 32);

    // Shader Material
    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        uniforms: {
            // modelViewMatrix: { value: new THREE.Matrix4() },
            // projectionMatrix: { value: new THREE.Matrix4() },
            lightPosition: { value: sunLight.position.clone() },
            lightIntensity: { value: 0.75 /*sunLight.intensity*/ },
            // cameraPosition2: { value: new THREE.Vector3() },
            // cameraDirection: { value: new THREE.Vector3() },
            iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            surfaceRadius: { value: earthGeometry.parameters.radius },
            atmoRadius: { value: atmosphereGeometry.parameters.radius }
        },
        shadowSide: THREE.BackSide
        // blending: THREE.AdditiveBlending,
        //side: THREE.BackSide
    });
    // console.log(atmosphereMaterial.uniforms);

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Meteor sprite
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('https://cdn.glitch.global/1baa4277-c64f-4d73-9c1a-c63d612886ca/meteorImage.png?v=1695688511115', function(texture) {
        texture.encoding = THREE.LinearEncoding;  // Or THREE.sRGBEncoding, etc.
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, color: 0xffffff });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(30, 30, 1); // Increased scale to fill view
        sprite.position.set(0, 0, -30);
        scene.add(sprite);

        // Lines
        const lines = [];
        for (let i = 0; i < 200; i++) {
            const points = [];
            const x = gaussianRandom(0, 2);
            const y = gaussianRandom(0, 2);
            const z = gaussianRandom(0, 2);
            points.push(new THREE.Vector3(x, y, z));
            points.push(new THREE.Vector3(x, y, z - 20)); // Extend lines 10 units
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            line.visible = false; // Hide initially
            lines.push(line);
            scene.add(line);
        }

        const controls = new OrbitControls( camera, renderer.domElement );

        // Camera and Controls
        let phase = 3;
        camera.position.set(10, 0, -10);
        let lookAt = new THREE.Vector3(0, -1.75, -10)
        camera.lookAt(lookAt); // Aim the camera at the sprite
        camera.updateProjectionMatrix()


        let fadeSpeed = 0.01;  // Speed at which the elements will fade
        let isFading = false;
        let orbiting = false;

        document.addEventListener('keydown', function(event) {
            if (event.code === 'Space') {
                phase++;
                if (phase === 1) {
                    // Begin fading process
                    isFading = true;
                }
                if (phase === 2) {
                    // Trigger camera movement
                }
            }
        });

        const animate = function () {
            requestAnimationFrame(animate);

            if(!orbiting) {
                controls.autoRotate = true;
                orbiting = true;
            } else {
                // required if controls.enableDamping or controls.autoRotate are set to true
                controls.update();
            }

            // console.log(2.0 * Math.atan(1.0 / camera.projectionMatrix.elements[5]) * (180.0 / Math.PI));

            let cameraPosition = new THREE.Vector3();
            camera.getWorldPosition(cameraPosition);  // Get the world position of the camera

            let cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);  // Get the world direction of the camera

            // // Get Light Direction in world space
            // let sunDirectionWorld = new THREE.Vector3();
            // sunDirectionWorld.copy(sunLight.position);
            //
            // // Transform to camera space
            // let sunDirectionCameraSpace = sunDirectionWorld.applyMatrix4(camera.matrixWorldInverse);

            // atmosphereMaterial.uniforms.modelViewMatrix.value.copy(atmosphere.modelViewMatrix);
            // atmosphereMaterial.uniforms.projectionMatrix.value.copy(camera.projectionMatrix);
            // atmosphereMaterial.uniforms.cameraPosition2.value.copy(cameraPosition);
            // atmosphereMaterial.uniforms.cameraDirection.value.copy(cameraDirection);
            atmosphereMaterial.uniforms.lightPosition.value = sunLight.position.clone();
            atmosphereMaterial.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
            // atmosphereMaterial.uniforms.cameraDirection.value = cameraDirection;
            // atmosphereMaterial.uniforms.lightDirection.value = sunLight.position;


            let canvasSize = new THREE.Vector2();
            renderer.getSize(canvasSize);

            renderer.render(scene, camera);
        };

        animate();
    });
});

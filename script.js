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
    const sunGeometry = new THREE.SphereGeometry(0.5, 32, 32);  // 1 is the radius of the sphere
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });  // yellow and unlit
    const sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
    sunSphere.position.copy(sunLight.position);  // Set the position to be the same as sunLight
    scene.add(sunSphere);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(5.5, 32, 32);
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
    // Credit: https://www.shadertoy.com/view/lslXDr

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

    const int NUM_OUT_SCATTER = 8;
    const int NUM_IN_SCATTER = 80;

    float density(vec3 p, float ph) {
        // works for 2.5 surf, 6.0 atmo
        //float atmoThickness = 3.0 * (atmoRadius - surfaceRadius);
        //float altitude = length(p) - surfaceRadius*0.7;
        float atmoThickness = 3.0 * (atmoRadius - surfaceRadius);
        float altitude = length(p) - surfaceRadius*0.98;

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
        const float k_mie_ex = 1.1;

        vec3 sum_ray = vec3( 0.0 );
        vec3 sum_mie = vec3( 0.0 );


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

            vec2 f = ray_vs_sphere( v, l, atmoRadius );
            vec3 u = v + l * f.y;

            float n_ray1 = optic( v, u, ph_ray );
            float n_mie1 = optic( v, u, ph_mie );

            vec3 att = exp( - ( n_ray0 + n_ray1 ) * k_ray - ( n_mie0 + n_mie1 ) * k_mie * k_mie_ex );

            sum_ray += d_ray * att;
            sum_mie += d_mie * att;

        }

        float c  = dot( dir, -l );
        float cc = c * c;
        vec3 scatter =
            sum_ray * k_ray * phase_ray( cc ) +
            sum_mie * k_mie * phase_mie( -0.78, c, cc );

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

        // Step 3: World Space Ray
        vec4 worldRay = inverse(viewMatrix) * vec4(viewRay, 0.0);

        // Normalize the ray direction
        vec3 dir = normalize(worldRay.xyz);

        // default ray origin
        vec3 eye = vWorldPosition.xyz;

        // sun light dir
        vec3 l = normalize(lightPosition - vWorldPosition.xyz);

        // find if the pixel is part of the atmosphere
        vec2 e = ray_vs_sphere( eye, dir, atmoRadius );

        // something went horribly wrong so set the pixel debug red
        if ( e.x > e.y ) {
            gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
            return;
        }

        // find if the pixel is part of the surface
        vec2 f = ray_vs_sphere( eye, dir, surfaceRadius );
        e.y = min( e.y, f.x );

        vec4 I = in_scatter( eye, dir, e, l );

        vec4 I_gamma = pow( I, vec4(1.0 / 2.2) ) * lightIntensity;
        gl_FragColor = I_gamma;
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
            lightPosition: { value: sunLight.position.clone() },
            lightIntensity: { value: 0.75 /*sunLight.intensity*/ },
            iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            surfaceRadius: { value: earthGeometry.parameters.radius },
            atmoRadius: { value: atmosphereGeometry.parameters.radius }
        }
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);


    // Meteor Lines
    const lines = [];
    for (let i = 0; i < 200; i++) {
        const points = [];
        const x = gaussianRandom(0, 2);
        const y = gaussianRandom(0, 2);
        const z = gaussianRandom(0, 2);
        points.push(new THREE.Vector3(x, y, z));
        points.push(new THREE.Vector3(x, y, z - 20)); // Extend lines 10 units
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xbbbb99, transparent: true, opacity: 0.5 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.visible = false; // Hide initially
        lines.push(line);
        scene.add(line);
    }

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.autoRotate = true;

    // Camera and Controls
    camera.position.set(10, 0, -10);
    camera.updateProjectionMatrix()


    const animate = function () {
        requestAnimationFrame(animate);

        // required if controls.enableDamping or controls.autoRotate are set to true
        controls.update();

        // console.log(2.0 * Math.atan(1.0 / camera.projectionMatrix.elements[5]) * (180.0 / Math.PI));
        let canvasSize = new THREE.Vector2();
        renderer.getSize(canvasSize);

        atmosphereMaterial.uniforms.lightPosition.value = sunLight.position.clone();
        atmosphereMaterial.uniforms.iResolution.value.copy(canvasSize);



        renderer.render(scene, camera);
    };

    animate();
});

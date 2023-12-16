import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';



// globals shared between the two main event listeners
let camera;
let renderer;
let plane;
let shaderMaterial;
let textureAtlas;

document.addEventListener('DOMContentLoaded', (event) => {

// Setup the scene, camera, and renderer
const scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the texture atlas
const textureLoader = new THREE.TextureLoader();
textureAtlas = textureLoader.load('https://cdn.glitch.global/98b2b4e8-ce2c-4c4f-8e0c-3e762cb48276/christmas_tree_2023_qs8x12a0.75.jpg?v=1702708834115');

// Define vertex shader
const vertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv; // Assign the UV coordinates from the vertex attributes
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Define fragment shader
const fragmentShader = `
    uniform sampler2D uTexture;
    uniform vec2 uTextureSize;
    uniform float uRelativeAngle; // Relative angle between camera and object
    uniform float rows;
    uniform float cols;
    uniform float viewCone;
    varying vec2 vUv;

    void main() {
        // Define the viewing angle range (in radians)
        float maxAngle = radians(viewCone * .5); // 90 degrees range (45 degrees on either side)

            // Normalize the angle to be within [0, 1]
            float normalizedAngle = (maxAngle - uRelativeAngle) / (2.0 * maxAngle);

            // Calculate the index
            float totalImages = float(rows * cols); // Total number of images in the atlas
            float index = floor(normalizedAngle * totalImages);

            // Ensure index is within bounds
            index = clamp(index, 0.0, totalImages - 1.0);

            float row = floor(index / cols);
            float col = mod(index, cols);

            // Calculate cell size in UV space
            vec2 cellSize = vec2(1. / cols, 1. / rows);
            vec2 cellOffset = vec2(col / cols, row / rows);

            // Calculate UV coordinates
            vec2 cellUv = vUv * cellSize + cellOffset;

            gl_FragColor = texture2D(uTexture, cellUv);
    }


`;

// Create a ShaderMaterial
shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: textureAtlas },
        uTextureSize: { value: new THREE.Vector2(6400.0, 7462.0) }, 
        uRelativeAngle: { value: 0.0 },
        rows: { value: 12 },
        cols: { value: 8 },
        viewCone: {value: 58.} // viewing cone on the Looking Glass Portrait is 58º 
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide // Make the material double-sided
});

// Add a mesh using the shader material
const geometry = new THREE.PlaneGeometry(3,4);
plane = new THREE.Mesh(geometry, shaderMaterial);
scene.add(plane);
  
plane.rotation.y = Math.PI;

// Assume you have a THREE.Mesh named 'plane'
const planeNormal = new THREE.Vector3(0, 0, 1); // Normal of the plane in local space
planeNormal.applyQuaternion(plane.quaternion).normalize(); // Apply the plane's rotation to get the world space normal

const origin = new THREE.Vector3(); // Origin point of the arrow (can be the plane's position)
const length = 1; // Length of the arrow
const hex = 0x00ff00; // Color of the arrow, green for example

const arrowHelper = new THREE.ArrowHelper(planeNormal, origin, length, hex);
scene.add(arrowHelper);  
  
  
camera.position.z = -5;

function calculateRelativeAngle(camera, object) {
    // Camera direction in world space
    let cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Get the normal of the plane in world space
    let objectNormal = new THREE.Vector3(0, 0, -1); // Default normal in local space
    objectNormal.applyQuaternion(plane.quaternion).normalize();

    // Calculate the dot product
    let dot = cameraDirection.dot(objectNormal);

     // Calculate the angle
    let angle = Math.acos(THREE.MathUtils.clamp(dot, -1.0, 1.0));

    //Determine the sign of the angle based on the cross product
    let cross = new THREE.Vector3().crossVectors(cameraDirection, objectNormal);
    if (cross.dot(object.up) < 0) {
        angle = -angle;
    }
  
    // The angle is now between 0 (facing each other) and PI (facing away)
    return angle;
}



  
// Function for oscillating rotation
function oscillateRotation(time, amplitude, period) {
    // Oscillate between -amplitude and +amplitude over a given period
    return amplitude * Math.sin(time / period);
}
  
const controls = 
      new OrbitControls( camera, renderer.domElement );
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;  
// Lock rotation around the X axis
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;

// Lock rotation around the Z axis
controls.minAzimuthAngle = Math.PI / 2 + Math.PI / 4; // or any fixed value
controls.maxAzimuthAngle = Math.PI + Math.PI / 4;  // or any fixed value
  
// Animation loop
function animate(time) {
    requestAnimationFrame(animate);

    // auto-rotate the camera
    controls.update();  
  
    // Rotate the plane back and forth by 45 degrees
    // let angle = oscillateRotation(time, Math.PI / 4, 2000); // 45 degrees, 2000 ms period
    // plane.rotation.y = angle;

    // Update relative angle uniform
    shaderMaterial.uniforms.uRelativeAngle.value = calculateRelativeAngle(camera, plane);

    renderer.render(scene, camera);
}

animate(0);

});

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

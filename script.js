import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';



// globals shared between the two main event listeners
let camera;
let renderer;
let plane;
let shaderMaterial;

document.addEventListener('DOMContentLoaded', (event) => {

// Setup the scene, camera, and renderer
const scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the texture atlas
const textureLoader = new THREE.TextureLoader();
const textureAtlas = textureLoader.load('https://cdn.glitch.global/98b2b4e8-ce2c-4c4f-8e0c-3e762cb48276/christmas_tree_2023_qs8x12a0.75.jpg?v=1702708834115');

// Define vertex shader
const vertexShader = `
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Define fragment shader
const fragmentShader = `
    uniform sampler2D uTexture;
    uniform vec2 uTextureSize;
    uniform float uRelativeAngle; // Relative angle between camera and object

    void main() {
        // Define the viewing angle range (in radians)
        float maxAngle = radians(45.0); // 90 degrees range (45 degrees on either side)

        // Check if the relative angle is within the range
        if (abs(uRelativeAngle) > maxAngle) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Fade to black
        } else {
            // Rest of your shader logic for selecting the correct image
            float angleStep = 360.0 / 96.0;
            float index = floor((uRelativeAngle + maxAngle) / angleStep * (96.0 / (2.0 * maxAngle)));
            float row = floor(index / 12.0);
            float col = mod(index, 12.0);
            vec2 cellSize = vec2(1.0 / 12.0, (0.75 / 12.0));
            vec2 cellOffset = vec2(col / 8.0, row / 12.0);
            vec2 uv = (gl_FragCoord.xy / uTextureSize) * cellSize + cellOffset;

            gl_FragColor = texture2D(uTexture, uv);
        }
    }


`;

// Create a ShaderMaterial
shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: textureAtlas },
        uTextureSize: { value: new THREE.Vector2(window.innerWidth, window.innerHeight * 0.75) }, // Adjusted for 0.75 aspect ratio
        uRelativeAngle: { value: 0.0 }
    },
    vertexShader,
    fragmentShader
});

// Add a mesh using the shader material
const geometry = new THREE.PlaneGeometry(5, 5);
plane = new THREE.Mesh(geometry, shaderMaterial);
scene.add(plane);

camera.position.z = 5;

// Function to calculate the relative angle between camera and object
function calculateRelativeAngle(camera, object) {
    let cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    let objectDirection = new THREE.Vector3(0, 0, -1); // Assuming the object's front is along negative Z-axis
    objectDirection.applyQuaternion(object.quaternion);

    return cameraDirection.angleTo(objectDirection) - Math.PI / 2;
}
  
// Function for oscillating rotation
function oscillateRotation(time, amplitude, period) {
    // Oscillate between -amplitude and +amplitude over a given period
    return amplitude * Math.sin(time / period);
}

// Animation loop
function animate(time) {
    requestAnimationFrame(animate);

    // Rotate the plane back and forth by 45 degrees
    let angle = oscillateRotation(time, Math.PI / 4, 2000); // 45 degrees, 2000 ms period
    plane.rotation.y = angle;

    // Update relative angle uniform
    //shaderMaterial.uniforms.uRelativeAngle.value = calculateRelativeAngle(camera, plane);

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

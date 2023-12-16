import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';



// globals shared between the two main event listeners
let camera;
let renderer;
let atmosphereMaterial;

document.addEventListener('DOMContentLoaded', (event) => {

// Setup the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
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
    uniform float uViewAngle;

    void main() {
        // Adjust for an 8x12 grid and 0.75 aspect ratio
        float angleStep = 360.0 / 96.0; // Assuming you have 96 images (8x12)
        float index = floor(uViewAngle / angleStep);
        float row = floor(index / 12.0); // 12 columns
        float col = mod(index, 12.0); // 8 rows
        vec2 cellSize = vec2(1.0 / 12.0, (0.75 / 12.0));
        vec2 cellOffset = vec2(col / 12.0, row / 8.0);
        vec2 uv = (gl_FragCoord.xy / uTextureSize) * cellSize + cellOffset;

        gl_FragColor = texture2D(uTexture, uv);
    }

`;

// Create a ShaderMaterial
const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: textureAtlas },
        uTextureSize: { value: new THREE.Vector2(window.innerWidth, window.innerHeight * 0.75) }, // Adjusted for 0.75 aspect ratio
        uViewAngle: { value: 0.0 }
    },
    vertexShader,
    fragmentShader
});

// Add a mesh using the shader material
const geometry = new THREE.PlaneGeometry(5, 5);
const plane = new THREE.Mesh(geometry, shaderMaterial);
scene.add(plane);

camera.position.z = 5;

// Update view angle based on camera rotation
function updateViewAngle() {
    // Simplified example; adjust this to calculate the actual angle
    shaderMaterial.uniforms.uViewAngle.value = camera.rotation.y * (180 / Math.PI);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    updateViewAngle();

    renderer.render(scene, camera);
}

animate();

});

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

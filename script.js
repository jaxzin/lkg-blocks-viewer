import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";
import { BoxLineGeometry } from "three/addons/geometries/BoxLineGeometry.js";

import { BlockCard } from "./BlockCard.js";
import { XRScene } from "./XRScene.js";

// globals shared between the two main event listeners
let camera;
let renderer;

document.addEventListener("DOMContentLoaded", (event) => {
  // Setup the scene, camera, and renderer
  const scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // This is a collection of all the cards in the scene
  const cardGroup = new THREE.Group();
  scene.add(cardGroup);
  
  // Setup the VR/XR specific parts of the scene
  const xrScene = new XRScene(
    renderer,
    document,
    scene,
    camera,
    cardGroup
  );
  
  scene.add(new THREE.HemisphereLight(0x808080, 0x606060));

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 200, 0); // MODIFIED SIZE OF SCENE AND SHADOW
  light.castShadow = true;
  light.shadow.camera.top = 200; // MODIFIED FOR LARGER SCENE
  light.shadow.camera.bottom = -200; // MODIFIED FOR LARGER SCENE
  light.shadow.camera.right = 200; // MODIFIED FOR LARGER SCENE
  light.shadow.camera.left = -200; // MODIFIED FOR LARGER SCENE
  light.shadow.mapSize.set(4096, 4096);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  
  // Setup some shared properties of all cards
  const maxViewingAngle = 58; // max viewing angle image (degrees)

  const cardWidth = .15,
    cardHeight = .2,
    cardCornerRadius = 0.01;
  const borderWidth = 0.0125;
  const borderColor = "#AAAAFF";
  
  
  function createBlockCard(textureUrl, quiltDims) {
    // Load the texture quilt
    const textureLoader = new THREE.TextureLoader();
    let quiltTexture = textureLoader.load(textureUrl);
    
    let blockCard = new BlockCard(
      quiltTexture,
      cardWidth,
      cardHeight,
      cardCornerRadius,
      borderWidth,
      borderColor,
      quiltDims,
      maxViewingAngle
    );

    blockCard.castShadow = true;
    blockCard.receiveShadow = true;
    return blockCard;
  }
  
  // Our Christmas Tree 2023
  let blockCard1 = createBlockCard(
    "https://cdn.glitch.global/98b2b4e8-ce2c-4c4f-8e0c-3e762cb48276/christmas_tree_2023_qs8x12a0.75.jpg?v=1702708834115",
    new THREE.Vector2(8, 12) // quilt col & row count
  );
  blockCard1.position.x = -0.2;
  cardGroup.add(blockCard1);
  
  // Our Christmas Tree 2023 Close-up
  let blockCard2 = createBlockCard(
    "https://cdn.glitch.global/98b2b4e8-ce2c-4c4f-8e0c-3e762cb48276/closeup_qs8x12a0.75.png?v=1702865989253",
    new THREE.Vector2(8, 7) // quilt col & row count
  );
  cardGroup.add(blockCard2);

  // Jupiter
  let blockCard3 = createBlockCard(
    "https://lkg-blocks.imgix.net/u/052ce5cfe2ad4595/julpiterLGS_v002__qs8x6a0.75.png?ixlib=js-3.7.0&fm=webp&auto=format&fit=max&w=3360",
    new THREE.Vector2(8, 6) // quilt col & row count
  );
  blockCard3.position.x = 0.2;
  cardGroup.add(blockCard3);
  
  // Oscar's Painting
  let blockCard4 = createBlockCard(
    "https://lkg-blocks.imgix.net/u/889caacae4ab4376/output-qs8x6a0.75.jpeg?ixlib=js-3.7.0&fm=webp&auto=format&fit=max&w=3840",
    new THREE.Vector2(8, 6) // quilt col & row count
  );
  blockCard4.position.x = 0.4;
  cardGroup.add(blockCard4);
  
    
  // Set the cards up as visible in the 2D view
  cardGroup.position.z = -2.5;
  camera.fov = 5;
  camera.updateProjectionMatrix();
  
  // Setup camera controls for the 2D view
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.025;
  controls.target.copy(cardGroup.position);
  controls.update();

  // Lock rotation around the X axis
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;

  // Lock rotation around the Z axis
  const angleLimit = (maxViewingAngle * Math.PI) / 180;
  const halfAngleLimit = angleLimit / 2;
  controls.minAzimuthAngle = -halfAngleLimit;
  controls.maxAzimuthAngle = halfAngleLimit;

  
  // The main animation and render loop
  function animate(timestamp, frame) {
    if (renderer.xr.isPresenting) {
      // In VR mode, highlight any card(s) being pointed at
      xrScene.highlightIntersects();
    } else {
      // In 2D mode, the orbit controls need this for damping to work
      controls.update();
    }
    
    // Render the scene on each frame!!
    renderer.render(scene, camera);
  }
  
  // Start the loop!!
  renderer.setAnimationLoop(animate);
  
});



window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

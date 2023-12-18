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
let quiltTexture;
let planeGrabbed = false;
let grabbedController = null;
let hand1, hand2;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let xrEnvironment, room, marker, floor, baseReferenceSpace;
let cardGroup;

let raycaster;

const intersected = [];
const tempMatrix = new THREE.Matrix4();


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
  cardGroup = new THREE.Group();
  scene.add(cardGroup);
  
  const xrScene = new XRScene(
    renderer,
    document,
    scene,
    camera,
    cardGroup
  );
  
//   // Turn on WebXR support
//   let referenceSpaceType = "local-floor"; // or 'local', 'unbounded', etc.
//   let xrSession;

//   renderer.xr.enabled = true;
//   renderer.xr.addEventListener("sessionstart", (event) => {
//     xrSession = renderer.xr.getSession();
//     xrSession.requestReferenceSpace(referenceSpaceType).then((refSpace) => {
//       baseReferenceSpace = refSpace;
//     });
//   });
//   document.body.appendChild(VRButton.createButton(renderer));

//   function onSelectStart( event ) {

//     const controller = event.target;

//     const intersections = getIntersections( controller );

//     if ( intersections.length > 0 ) {

//       const intersection = intersections[ 0 ];

//       const card = intersection.object;
//       card.border.material.emissive.b = 1;
//       controller.attach( card );

//       controller.userData.selected = card;

//     }

//     controller.userData.targetRayMode = event.data.targetRayMode;

//   }  
  
//   function onSelectEnd( event ) {

//     const controller = event.target;

//     if ( controller.userData.selected !== undefined ) {

//       const card = controller.userData.selected;
//       card.border.material.emissive.b = 0;
//       cardGroup.attach( card );

//       controller.userData.selected = undefined;

//     }

//   }
  
//   function getIntersections( controller ) {

//     controller.updateMatrixWorld();

//     tempMatrix.identity().extractRotation( controller.matrixWorld );

//     raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
//     raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

//     return raycaster.intersectObjects( cardGroup.children, false );

//   }

//   function intersectObjects( controller ) {

//     // Do not highlight in mobile-ar

//     if ( controller.userData.targetRayMode === 'screen' ) return;

//     // Do not highlight when already selected

//     if ( controller.userData.selected !== undefined ) return;

//     const line = controller.getObjectByName( 'line' );
//     const intersections = getIntersections( controller );

//     if ( intersections.length > 0 ) {

//       const intersection = intersections[ 0 ];

//       const object = intersection.object;
//       object.border.material.emissive.r = 1;
//       intersected.push( object );

//       line.scale.z = intersection.distance;

//     } else {

//       line.scale.z = 5;

//     }

//   }

//   function cleanIntersected() {

//     while ( intersected.length ) {

//       const object = intersected.pop();
//       object.border.material.emissive.r = 0;

//     }

//   }  

//   function onSessionStart() {
//     // Put the group of cards near the player
//     cardGroup.position.set(0, 1, -0.5);
//     xrEnvironment.visible = true;

//     // Add event listeners for controllers and other session start related setup
//     const controllerModelFactory = new XRControllerModelFactory();
//     const handModelFactory = new XRHandModelFactory();

//     controller1 = renderer.xr.getController(0);
//     controllerGrip1 = renderer.xr.getControllerGrip(0);
//     controllerGrip1.add(
//       controllerModelFactory.createControllerModel(controllerGrip1)
//     );
//     scene.add(controller1);
//     scene.add(controllerGrip1);

//     controller2 = renderer.xr.getController(1);
//     controllerGrip2 = renderer.xr.getControllerGrip(1);
//     controllerGrip2.add(
//       controllerModelFactory.createControllerModel(controllerGrip2)
//     );
//     scene.add(controller2);
//     scene.add(controllerGrip2);

//     hand1 = renderer.xr.getHand(0);
//     hand1.add(handModelFactory.createHandModel(hand1));

//     scene.add(hand1);

//     hand2 = renderer.xr.getHand(1);
//     hand2.add(handModelFactory.createHandModel(hand2));

//     scene.add(hand2);

//     controller1.addEventListener("selectstart", onSelectStart);
//     controller1.addEventListener("selectend", onSelectEnd);

//     controller2.addEventListener("selectstart", onSelectStart);
//     controller2.addEventListener("selectend", onSelectEnd);

//     // Attach laser pointers to both controllers
//     const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

//     const line = new THREE.Line( geometry );
//     line.name = 'line';
//     line.scale.z = 5;

//     controller1.add( line.clone() );
//     controller2.add( line.clone() );

//     raycaster = new THREE.Raycaster();

//   }

//   function onSessionEnd() {
//     // Reset the cards back to an order set for the 2D view
//     cardGroup.children[0].position.set(-0.2, 0, 0);
//     cardGroup.children[1].position.set(0, 0, 0);
//     cardGroup.children[2].position.set(0.2, 0, 0);

//     cardGroup.children[0].rotation.set(0,0,0);
//     cardGroup.children[1].rotation.set(0,0,0);
//     cardGroup.children[2].rotation.set(0,0,0);


//     // Clean up when the VR session ends
//     cardGroup.position.set(0, 0, -2.5);
//     camera.position.set(0, 0, 0);
//     camera.fov = 5;
//     camera.updateProjectionMatrix();
//     controls.target.copy(cardGroup.position);
//     xrEnvironment.visible = false;
//   }

//   renderer.xr.addEventListener("sessionstart", onSessionStart);
//   renderer.xr.addEventListener("sessionend", onSessionEnd);

//   // In VR mode, show a basic floor and walls
//   //   since a black void can be a little disorienting
//   xrEnvironment = new THREE.Group();
//   xrEnvironment.visible = false;
//   scene.add( xrEnvironment );
  
//   room = new THREE.LineSegments(
//     new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
//     new THREE.LineBasicMaterial({ color: 0xbcbcbc })
//   );
//   xrEnvironment.add(room);
  
//   floor = new THREE.Mesh(
//     new THREE.PlaneGeometry(4.8, 4.8, 2, 2).rotateX(-Math.PI / 2),
//     new THREE.MeshBasicMaterial({
//       color: 0xbcbcbc,
//       transparent: true,
//       opacity: 0.25,
//     })
//   );
//   floor.receiveShadow = true;
//   xrEnvironment.add(floor);

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
    'https://cdn.glitch.global/98b2b4e8-ce2c-4c4f-8e0c-3e762cb48276/christmas_tree_2023_qs8x12a0.75.jpg?v=1702708834115',
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
      cleanIntersected();

      intersectObjects( controller1 );
      intersectObjects( controller2 );
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

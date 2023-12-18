import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';

import { BlockCard } from './BlockCard.js';

// globals shared between the two main event listeners
let camera;
let renderer;
let quiltTexture;
let planeGrabbed = false;
let grabbedController = null;
let hand1, hand2;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let room, marker, floor, baseReferenceSpace, raycaster; 
let cardGroup;

document.addEventListener('DOMContentLoaded', (event) => {

// Setup the scene, camera, and renderer
const scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
  
// Turn on WebXR support
let referenceSpaceType = 'local-floor'; // or 'local', 'unbounded', etc.
let xrSession;

renderer.xr.enabled = true;
renderer.xr.addEventListener('sessionstart', (event) => {
    xrSession = renderer.xr.getSession();
    xrSession.requestReferenceSpace(referenceSpaceType).then((refSpace) => {
        baseReferenceSpace = refSpace;
    });
});  
document.body.appendChild(VRButton.createButton(renderer));

renderer.shadowMap.enabled = true;

// In VR mode, show a basic floor and walls 
//   since a black void can be a little disorienting
room = new THREE.LineSegments(
  new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ).translate( 0, 3, 0 ),
  new THREE.LineBasicMaterial( { color: 0xbcbcbc } )
);
room.visible = false;
scene.add( room );

raycaster = new THREE.Raycaster();
  

// This is a collection of all the cards in the scene
cardGroup = new THREE.Group();
scene.add( cardGroup );
  
function onSelectStart(event) {

  this.userData.isSelecting = true;
  
  const controller = event.target;
  const object = cardGroup.children[0];
  controller.attach( object );
  controller.userData.selected = object;
  object.children[0].material.emissive.b = 1;
  controller.userData.targetRayMode = event.data.targetRayMode;
}

function onSelectEnd(event) {

  this.userData.isSelecting = false;

  const controller = event.target;
  
  if( controller.userData.selected !== undefined ) {
    const object = controller.userData.selected;
    object.children[0].material.emissive.b = 0;
    cardGroup.attach( object );
    
    controller.userData.selected = undefined;
  }
}  
  
 
  
function onSessionStart() {
    let card = cardGroup.children[0];
    card.position.set( 0, 1, -.5 );
    card.scale.set(.05,.05,.05);
    floor.visible = true;
    room.visible = true;

    // Add event listeners for controllers and other session start related setup
    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    controller1 = renderer.xr.getController(0);
    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controller1);
    scene.add(controllerGrip1);
  
    controller1.addEventListener( 'connected', function ( event ) {

      this.add( buildController( event.data ) );

    } );
    controller1.addEventListener( 'disconnected', function () {

      this.remove( this.children[ 0 ] );

    } );

    controller2 = renderer.xr.getController(1);
    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controller2);
    scene.add(controllerGrip2);
  
    controller2.addEventListener( 'connected', function ( event ) {

      this.add( buildController( event.data ) );

    } );
    controller2.addEventListener( 'disconnected', function () {

      this.remove( this.children[ 0 ] );

    } );
  
    hand1 = renderer.xr.getHand( 0 );
    hand1.add( handModelFactory.createHandModel( hand1 ) );

    scene.add( hand1 );

    hand2 = renderer.xr.getHand( 1 );
    hand2.add( handModelFactory.createHandModel( hand2 ) );

    scene.add( hand2 );
  
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);

    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);

}

function onSessionEnd() {
  let card = cardGroup.children[0];
  
  // Clean up when the VR session ends
  card.position.set(0,0,-5);
  card.scale.set(3,4,1);
  camera.position.set(0,0,0);
  controls.target.copy(card.position);
  floor.visible = false;
  room.visible = false;
}

renderer.xr.addEventListener('sessionstart', onSessionStart);
renderer.xr.addEventListener('sessionend', onSessionEnd);


floor = new THREE.Mesh(
  new THREE.PlaneGeometry( 4.8, 4.8, 2, 2 ).rotateX( - Math.PI / 2 ),
  new THREE.MeshBasicMaterial( { color: 0xbcbcbc, transparent: true, opacity: 0.25 } )
);
floor.visible = false;
scene.add( floor );

scene.add(new THREE.HemisphereLight(0x808080, 0x606060));

const light = new THREE.DirectionalLight(0xffffff);
light.position.set(0, 200, 0);           // MODIFIED SIZE OF SCENE AND SHADOW
light.castShadow = true;
light.shadow.camera.top = 200;           // MODIFIED FOR LARGER SCENE
light.shadow.camera.bottom = -200;       // MODIFIED FOR LARGER SCENE
light.shadow.camera.right = 200;         // MODIFIED FOR LARGER SCENE
light.shadow.camera.left = -200;         // MODIFIED FOR LARGER SCENE
light.shadow.mapSize.set(4096, 4096);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);


// Load the texture atlas
const textureLoader = new THREE.TextureLoader();
quiltTexture = textureLoader.load('https://cdn.glitch.global/98b2b4e8-ce2c-4c4f-8e0c-3e762cb48276/christmas_tree_2023_qs8x12a0.75.jpg?v=1702708834115');
const quiltDims = new THREE.Vector2(8, 12); // quilt col & row count
const quiltRes = new THREE.Vector2(6400.0, 7462.0);

const maxViewingAngle = 58.; // max viewing angle image (degrees)

const cardWidth = 3, cardHeight = 4, cardCornerRadius = 0.2;
const borderWidth = 0.25
  
const blockCard = new BlockCard(
  quiltTexture, 
  cardWidth, 
  cardHeight, 
  cardCornerRadius, 
  borderWidth, 
  quiltDims, 
  quiltRes, 
  maxViewingAngle
);
cardGroup.add( blockCard );
blockCard.position.set(0,0,-5);
  
const controls = 
      new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.025;
controls.target.copy(cardGroup.children[0].position);
controls.update();

// Lock rotation around the X axis
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;

// Lock rotation around the Z axis
const angleLimit = maxViewingAngle * Math.PI / 180;
const halfAngleLimit = angleLimit / 2;
controls.minAzimuthAngle = - halfAngleLimit;
controls.maxAzimuthAngle = halfAngleLimit;

  
function animate(timestamp, frame) {
    if (renderer.xr.isPresenting) {
      //intersectController();
    } else {
      controls.update();
    }
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
  
});


window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

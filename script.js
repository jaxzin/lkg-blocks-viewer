import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';


// globals shared between the two main event listeners
let camera;
let renderer;
let quiltViewer;
let quiltViewerMaterial;
let quiltTexture;
let planeGrabbed = false;
let grabbedController = null;
let hand1, hand2;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let room, marker, floor, baseReferenceSpace, raycaster, group;

let INTERSECTION;
const tempMatrix = new THREE.Matrix4();


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

room = new THREE.LineSegments(
  new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ).translate( 0, 3, 0 ),
  new THREE.LineBasicMaterial( { color: 0xbcbcbc } )
);
room.visible = false;
scene.add( room );

marker = new THREE.Mesh(
  new THREE.CircleGeometry( 0.25, 32 ).rotateX( - Math.PI / 2 ),
  new THREE.MeshBasicMaterial( { color: 0xbcbcbc } )
);
marker.visible = false;
scene.add( marker );
  
raycaster = new THREE.Raycaster();
  
  
group = new THREE.Group();
scene.add( group );
  
function onSelectStart(event) {
  const controller = event.target;
  controller.attach( quiltViewer );
  controller.userData.selected = quiltViewer;
  //quiltViewer.material.emissive.b = 1;
  controller.userData.targetRayMode = event.data.targetRayMode;
}

function onSelectEnd(event) {
  const controller = event.target;
  
  if( controller.userData.selected !== undefined ) {
    const object = controller.userData.selected;
    //object.material.emissive.b = 0;
    group.attach( object );
    
    controller.userData.selected = undefined;
  }
}  
  
  
function onSelectStart2() {

  this.userData.isSelecting = true;

}

function onSelectEnd2() {

  this.userData.isSelecting = false;

  if ( INTERSECTION ) {

    const offsetPosition = { x: - INTERSECTION.x, y: - INTERSECTION.y, z: - INTERSECTION.z, w: 1 };
    const offsetRotation = new THREE.Quaternion();
    const transform = new XRRigidTransform( offsetPosition, offsetRotation );
    const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace( transform );

    renderer.xr.setReferenceSpace( teleportSpaceOffset );

  }

}  
  
function onSessionStart() {
    quiltViewer.position.set( 0, 1, -.5 );
    quiltViewer.scale.set(.05,.05,.05);
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
  
    controller1.addEventListener('squeezestart', onSelectStart);
    controller1.addEventListener('squeezeend', onSelectEnd);

    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);

}

function onSessionEnd() {
  // Clean up when the VR session ends
  quiltViewer.position.set(0,0,-5);
  quiltViewer.scale.set(3,4,1);
  camera.position.set(0,0,0);
  controls.target.copy(quiltViewer.position);
  floor.visible = false;
  room.visible = false;
}

renderer.xr.addEventListener('sessionstart', onSessionStart);
renderer.xr.addEventListener('sessionend', onSessionEnd);


function buildController( data ) {

  let geometry, material;

  switch ( data.targetRayMode ) {

    case 'tracked-pointer':

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
      geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

      material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

      return new THREE.Line( geometry, material );

    case 'gaze':

      geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
      material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
      return new THREE.Mesh( geometry, material );

  }

}  
  
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
    uniform vec2 quiltDims;
    uniform float viewCone;
    varying vec2 vUv;

    void main() {
        // Define the viewing angle range (in radians)
        float maxAngle = radians(viewCone * .5);
        
        // Normalize the angle to be within [0, 1]
        float normalizedAngle = (maxAngle - uRelativeAngle) / (2.0 * maxAngle);

        // Calculate the index
        float cols = quiltDims.x;
        float rows = quiltDims.y;
        float totalImages = float(rows * cols); // Total number of images in the quilt
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
quiltViewerMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: quiltTexture },
        uTextureSize: { value: quiltRes }, 
        uRelativeAngle: { value: 0.0 },
        quiltDims: { value: quiltDims }, 
        viewCone: {value: maxViewingAngle} // viewing cone on the Looking Glass Portrait is 58º 
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide // Make the material double-sided
});

// Function to create a rounded rectangle shape
function createRoundedRectShape(width, height, radius) {
    var shape = new THREE.Shape();
    
    // Calculate the offsets
    var offsetX = -width / 2;
    var offsetY = -height / 2;

    // Starting point
    shape.moveTo(offsetX, offsetY + radius);

    // Top line and top-right corner
    shape.lineTo(offsetX, offsetY + height - radius);
    shape.quadraticCurveTo(offsetX, offsetY + height, offsetX + radius, offsetY + height);

    // Right line and bottom-right corner
    shape.lineTo(offsetX + width - radius, offsetY + height);
    shape.quadraticCurveTo(offsetX + width, offsetY + height, offsetX + width, offsetY + height - radius);

    // Bottom line and bottom-left corner
    shape.lineTo(offsetX + width, offsetY + radius);
    shape.quadraticCurveTo(offsetX + width, offsetY, offsetX + width - radius, offsetY);

    // Left line and top-left corner
    shape.lineTo(offsetX + radius, offsetY);
    shape.quadraticCurveTo(offsetX, offsetY, offsetX, offsetY + radius);

    return shape;
}  

const width = 3, height = 4, radius = 0.25;
const roundedRectShape = createRoundedRectShape(width, height, radius);

const quiltViewerGeometry = new THREE.ShapeGeometry(roundedRectShape);  
  
// Add a mesh using the shader material
//const quiltViewerGeometry = new THREE.PlaneGeometry(3,4);
quiltViewer = new THREE.Mesh(quiltViewerGeometry, quiltViewerMaterial);
quiltViewer.castShadow = true;
quiltViewer.onBeforeRender = function( renderer, scene, camera, geometry, material, group ) {
  quiltViewer.updateMatrix();
  quiltViewer.updateMatrixWorld(true);
  quiltViewer.updateWorldMatrix(true,true);
  quiltViewerMaterial.uniforms.uRelativeAngle.value = calculateRelativeAngle(camera, quiltViewer);
};
group.add( quiltViewer );
  
quiltViewer.position.set(0,0,-5);

  
function calculateRelativeAngle(camera, object) {
  // Get the world space position of the object
  let objectWorldPosition = new THREE.Vector3();
  object.getWorldPosition(objectWorldPosition);
  
  // Calculate the direction from the object to the camera in world space
  let toCameraDirection = new THREE.Vector3().subVectors(camera.position, objectWorldPosition);
  toCameraDirection.y = 0; // Project onto the XZ plane by zeroing the Y component
  toCameraDirection.normalize(); // Re-normalize the vector

  // Get the forward normal of the object in world space
  let objectNormal = new THREE.Vector3(0, 0, 1); // Default forward in local space
  let objectWorldQuaternion = new THREE.Quaternion();
  object.getWorldQuaternion(objectWorldQuaternion);
  objectNormal.applyQuaternion(objectWorldQuaternion);
  objectNormal.y = 0; // Project onto the XZ plane
  objectNormal.normalize(); // Re-normalize the vector

  // Calculate the dot product
  let dot = toCameraDirection.dot(objectNormal);

  // Calculate the angle
  let angle = Math.acos(THREE.MathUtils.clamp(dot, -1.0, 1.0));

  // Determine the sign of the angle based on the cross product
  let cross = new THREE.Vector3().crossVectors(toCameraDirection, objectNormal);
  if (cross.y < 0) {
      angle = -angle;
  }

  // The angle is now between -PI (facing away) and PI (facing towards)
  return angle;
}

  
const controls = 
      new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.025;
controls.target.copy(quiltViewer.position);
controls.update();

// Lock rotation around the X axis
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;

// Lock rotation around the Z axis
const angleLimit = maxViewingAngle * Math.PI / 180;
const halfAngleLimit = angleLimit / 2;
controls.minAzimuthAngle = - halfAngleLimit;
controls.maxAzimuthAngle = halfAngleLimit;

  
function intersectController() {
  INTERSECTION = undefined;

  if ( controller1 && controller1.userData.isSelecting === true ) {

    tempMatrix.identity().extractRotation( controller1.matrixWorld );

    raycaster.ray.origin.setFromMatrixPosition( controller1.matrixWorld );
    raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

    const intersects = raycaster.intersectObjects( [ floor ] );

    if ( intersects.length > 0 ) {

      INTERSECTION = intersects[ 0 ].point;

    }

  } else if ( controller2 && controller2.userData.isSelecting === true ) {

    tempMatrix.identity().extractRotation( controller2.matrixWorld );

    raycaster.ray.origin.setFromMatrixPosition( controller2.matrixWorld );
    raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

    const intersects = raycaster.intersectObjects( [ floor ] );

    if ( intersects.length > 0 ) {

      INTERSECTION = intersects[ 0 ].point;

    }

  }

  if ( INTERSECTION ) marker.position.copy( INTERSECTION );

  marker.visible = INTERSECTION !== undefined;
}
  
function animate(timestamp, frame) {
    if (renderer.xr.isPresenting) {
      intersectController();
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

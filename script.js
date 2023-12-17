import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';


// globals shared between the two main event listeners
let camera;
let renderer;
let plane;
let shaderMaterial;
let textureQuilt;
let planeGrabbed = false;
let grabbedController = null;
let hand1, hand2;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let room, marker, floor, baseReferenceSpace, raycaster;

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
renderer.xr.addEventListener( 'sessionstart', () => baseReferenceSpace = renderer.xr.getReferenceSpace() );
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

renderer.shadowMap.enabled = true;

room = new THREE.LineSegments(
  new BoxLineGeometry( 6, 6, 6, 10, 10, 10 ).translate( 0, 3, 0 ),
  new THREE.LineBasicMaterial( { color: 0xbcbcbc } )
);
scene.add( room );

marker = new THREE.Mesh(
  new THREE.CircleGeometry( 0.25, 32 ).rotateX( - Math.PI / 2 ),
  new THREE.MeshBasicMaterial( { color: 0xbcbcbc } )
);
scene.add( marker );
  
raycaster = new THREE.Raycaster();
  
// function onSelectStart(event) {
//     const controller = event.target;
//     const distanceToPlane = controller.position.distanceTo(plane.position);

//     // Define a threshold distance within which the plane can be grabbed
//     const grabThreshold = 0.5; // Adjust based on your scale

//     //if (distanceToPlane < grabThreshold) {
//         planeGrabbed = true;
//         grabbedController = controller;
//     //}
// }

// function onSelectEnd(event) {
//     if (planeGrabbed && grabbedController === event.target) {
//         planeGrabbed = false;
//         grabbedController = null;
//     }
// }  
function onSelectStart() {

  this.userData.isSelecting = true;

}

function onSelectEnd() {

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

    plane.position.z = 5;
    camera.rotation.y = Math.PI;
  
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
    // Clean up when the VR session ends
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
textureQuilt = textureLoader.load('https://cdn.glitch.global/98b2b4e8-ce2c-4c4f-8e0c-3e762cb48276/christmas_tree_2023_qs8x12a0.75.jpg?v=1702708834115');
const quiltDims = new THREE.Vector2(8, 12); // quilt col & row count
const quiltRes = new THREE.Vector2(6400.0, 7462.0);

const maxViewingAngle = 25.; // max viewing angle image (degrees)
  
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
shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: textureQuilt },
        uTextureSize: { value: quiltRes }, 
        uRelativeAngle: { value: 0.0 },
        quiltDims: { value: quiltDims }, 
        viewCone: {value: maxViewingAngle} // viewing cone on the Looking Glass Portrait is 58º 
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide // Make the material double-sided
});

// Add a mesh using the shader material
const geometry = new THREE.PlaneGeometry(3,4);
plane = new THREE.Mesh(geometry, shaderMaterial);
plane.castShadow = true;
scene.add(plane);
  
//plane.rotation.y = Math.PI;
plane.position.z = -4;
camera.position.z = 1;

function calculateRelativeAngle(camera, object) {
    // Camera direction in world space
    let cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Project onto the XZ plane by zeroing the Z component
    cameraDirection.normalize(); // Re-normalize the vector

    // Get the normal of the plane in world space
    let objectNormal = new THREE.Vector3(0, 0, -1); // Default normal in local space
    objectNormal.applyQuaternion(plane.quaternion).normalize();
    objectNormal.y = 0; // Project onto the XZ plane
    objectNormal.normalize(); // Re-normalize the vector
  
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

  
const controls = 
      new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.025;  

// Lock rotation around the X axis
// controls.minPolarAngle = Math.PI / 2;
// controls.maxPolarAngle = Math.PI / 2;

// Lock rotation around the Z axis
const angleLimit = maxViewingAngle * Math.PI / 180;
const halfAngleLimit = angleLimit / 2;
// controls.minAzimuthAngle = Math.PI - halfAngleLimit;
// controls.maxAzimuthAngle = Math.PI + halfAngleLimit;

// // Animation loop
// function animate(time) {
//     requestAnimationFrame(animate);
  
//     //controls.update();

//     //if (planeGrabbed && grabbedController) {
//     if(controller1) {
//         // Assuming you want the plane to follow the controller's position and rotation
//         plane.position.copy(controller1.position);
//         plane.quaternion.copy(controller1.quaternion);
//     }
  
//     // Update relative angle uniform
//     shaderMaterial.uniforms.uRelativeAngle.value = calculateRelativeAngle(camera, plane);

//     renderer.setAnimationLoop(() => {
//         renderer.render(scene, camera);
//     });
// }

// animate(0);
  
function animate() {

  renderer.setAnimationLoop( render );

}

function render() {

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

  renderer.render( scene, camera );

}
  
animate();

});

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

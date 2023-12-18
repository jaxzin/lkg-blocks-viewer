import * as THREE from 'three';
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";
import { BoxLineGeometry } from "three/addons/geometries/BoxLineGeometry.js";

// Responsible for setting up the VR/XR specific bits
export class XRScene {
  
  setBaseReferenceSpace(ref) {
    this.baseReferenceSpace = ref;
  }
  
  constructor(renderer, document, scene, cardGroup) {
    this.renderer = renderer;
    this.scene = scene;
    this.cardGroup = cardGroup;
    
    this.raycaster = new THREE.Raycaster();

    this.intersected = [];
    this.tempMatrix = new THREE.Matrix4();
    
    // Turn on WebXR support
    let referenceSpaceType = "local-floor"; // or 'local', 'unbounded', etc.
    let xrSession;

    renderer.xr.enabled = true;
    renderer.xr.addEventListener("sessionstart", (event) => {
      xrSession = renderer.xr.getSession();
      xrSession.
        requestReferenceSpace(referenceSpaceType).
        then(this.setBaseReferenceSpace.bind(this)); // TODO, I don't think this is going to bind to the right 'this'
    });
    document.body.appendChild(VRButton.createButton(renderer));
  }

  onSelectStart( event ) {

    const controller = event.target;

    const intersections = getIntersections( controller );

    if ( intersections.length > 0 ) {

      const intersection = intersections[ 0 ];

      const card = intersection.object;
      card.border.material.emissive.b = 1;
      controller.attach( card );

      controller.userData.selected = card;

    }

    controller.userData.targetRayMode = event.data.targetRayMode;

  }  
  
  onSelectEnd( event ) {

    const controller = event.target;

    if ( controller.userData.selected !== undefined ) {

      const card = controller.userData.selected;
      card.border.material.emissive.b = 0;
      this.cardGroup.attach( card );

      controller.userData.selected = undefined;

    }

  }
  
  getIntersections( controller ) {

    controller.updateMatrixWorld();

    this.tempMatrix.identity().extractRotation( controller.matrixWorld );

    this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
    this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

    return this.raycaster.intersectObjects( this.cardGroup.children, false );

  }

  intersectObjects( controller ) {

    // Do not highlight in mobile-ar

    if ( controller.userData.targetRayMode === 'screen' ) return;

    // Do not highlight when already selected

    if ( controller.userData.selected !== undefined ) return;

    const line = controller.getObjectByName( 'line' );
    const intersections = getIntersections( controller );

    if ( intersections.length > 0 ) {

      const intersection = intersections[ 0 ];

      const object = intersection.object;
      object.border.material.emissive.r = 1;
      intersected.push( object );

      line.scale.z = intersection.distance;

    } else {

      line.scale.z = 5;

    }

  }

  cleanIntersected() {

    while ( intersected.length ) {

      const object = intersected.pop();
      object.border.material.emissive.r = 0;

    }

  }  
  
  createXRScene() {
    // In VR mode, show a basic floor and walls
    //   since a black void can be a little disorienting
    this.xrEnvironment = new THREE.Group();
    this.xrEnvironment.visible = false;
    scene.add( xrEnvironment );

    room = new THREE.LineSegments(
      new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
      new THREE.LineBasicMaterial({ color: 0xbcbcbc })
    );
    this.xrEnvironment.add(room);

    floor = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 4.8, 2, 2).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xbcbcbc,
        transparent: true,
        opacity: 0.25,
      })
    );
    floor.receiveShadow = true;
    this.xrEnvironment.add(floor);
  }
  
  createControllers

  onSessionStart() {
    createXRScene();
    
    // Put the group of cards near the player
    this.cardGroup.position.set(0, 1, -0.5);
    xrEnvironment.visible = true;

  }

  function onSessionEnd() {
    // Reset the cards back to an order set for the 2D view
    cardGroup.children[0].position.set(-0.2, 0, 0);
    cardGroup.children[1].position.set(0, 0, 0);
    cardGroup.children[2].position.set(0.2, 0, 0);

    cardGroup.children[0].rotation.set(0,0,0);
    cardGroup.children[1].rotation.set(0,0,0);
    cardGroup.children[2].rotation.set(0,0,0);


    // Clean up when the VR session ends
    cardGroup.position.set(0, 0, -2.5);
    camera.position.set(0, 0, 0);
    camera.fov = 5;
    camera.updateProjectionMatrix();
    controls.target.copy(cardGroup.position);
    xrEnvironment.visible = false;
  }

  renderer.xr.addEventListener("sessionstart", onSessionStart);
  renderer.xr.addEventListener("sessionend", onSessionEnd);

    
  }
}
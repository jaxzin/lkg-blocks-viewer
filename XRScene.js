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
  
  constructor(renderer, document, scene, camera, cardGroup) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.cardGroup = cardGroup;
    
    this.raycaster = new THREE.Raycaster();

    this.intersected = [];
    this.tempMatrix = new THREE.Matrix4();
    
    // Turn on WebXR support
    // let referenceSpaceType = "local-floor"; // or 'local', 'unbounded', etc.
    // let xrSession;

    this.renderer.xr.enabled = true;
    // renderer.xr.addEventListener("sessionstart", (event) => {
      // xrSession = renderer.xr.getSession();
      // xrSession.
        // requestReferenceSpace(referenceSpaceType).
        // then(this.setBaseReferenceSpace.bind(this)); // TODO, I don't think this is going to bind to the right 'this'
    // });
    this.renderer.xr.addEventListener("sessionstart", this.onSessionStart.bind(this));
    this.renderer.xr.addEventListener("sessionend", this.onSessionEnd.bind(this));

    document.body.appendChild(VRButton.createButton(renderer));
  }

  onSelectStart( event ) {

    const controller = event.target;

    const intersections = this.getIntersections( controller );

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
    this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.tempMatrix );

    return this.raycaster.intersectObjects( this.cardGroup.children, false );

  }
  
  highlightIntersects() {
    this.cleanIntersected();
    this.intersectObjects( this.renderer.xr.getController(0) );
    this.intersectObjects( this.renderer.xr.getController(1) );
  }

  intersectObjects( controller ) {

    // Do not highlight in mobile-ar

    if ( controller.userData.targetRayMode === 'screen' ) return;

    // Do not highlight when already selected

    if ( controller.userData.selected !== undefined ) return;

    const line = controller.getObjectByName( 'line' );
    const intersections = this.getIntersections( controller );

    if ( intersections.length > 0 ) {

      const intersection = intersections[ 0 ];

      const object = intersection.object;
      object.border.material.emissive.r = 1;
      this.intersected.push( object );

      line.scale.z = intersection.distance;

    } else {

      line.scale.z = 5;

    }

  }

  cleanIntersected() {

    while ( this.intersected.length ) {

      const object = this.intersected.pop();
      object.border.material.emissive.r = 0;

    }

  }  
  
  createXRScene() {
    // In VR mode, show a basic floor and walls
    //   since a black void can be a little disorienting
    this.xrEnvironment = new THREE.Group();
    this.scene.add( this.xrEnvironment );

    let room = new THREE.LineSegments(
      new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
      new THREE.LineBasicMaterial({ color: 0xbcbcbc })
    );
    this.xrEnvironment.add(room);

    let floor = new THREE.Mesh(
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
  
  createControllerAvatars() {
        // Add event listeners for controllers and other session start related setup
    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    let controller1 = this.renderer.xr.getController(0);
    let controllerGrip1 = this.renderer.xr.getControllerGrip(0);
    controllerGrip1.add(
      controllerModelFactory.createControllerModel(controllerGrip1)
    );
    this.scene.add(controller1);
    this.scene.add(controllerGrip1);

    let controller2 = this.renderer.xr.getController(1);
    let controllerGrip2 = this.renderer.xr.getControllerGrip(1);
    controllerGrip2.add(
      controllerModelFactory.createControllerModel(controllerGrip2)
    );
    this.scene.add(controller2);
    this.scene.add(controllerGrip2);

    let hand1 = this.renderer.xr.getHand(0);
    hand1.add(handModelFactory.createHandModel(hand1));

    this.scene.add(hand1);

    let hand2 = this.renderer.xr.getHand(1);
    hand2.add(handModelFactory.createHandModel(hand2));

    this.scene.add(hand2);

    controller1.addEventListener("selectstart", this.onSelectStart.bind(this));
    controller1.addEventListener("selectend", this.onSelectEnd.bind(this));

    controller2.addEventListener("selectstart", this.onSelectStart.bind(this));
    controller2.addEventListener("selectend", this.onSelectEnd.bind(this));

    // Attach laser pointers to both controllers
    const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

    const line = new THREE.Line( geometry );
    line.name = 'line';
    line.scale.z = 5;

    controller1.add( line.clone() );
    controller2.add( line.clone() );
  }

  onSessionStart() {
    this.createXRScene();
    this.createControllerAvatars();
    
    // Put the group of cards near the player
    this.cardGroup.position.set(0, 1, -0.5);
    // this.xrEnvironment.visible = true;

  }

  onSessionEnd() {
    // Reset the cards back to an order set for the 2D view
    this.cardGroup.children[0].position.set(-0.2, 0, 0);
    this.cardGroup.children[1].position.set(0, 0, 0);
    this.cardGroup.children[2].position.set(0.2, 0, 0);

    this.cardGroup.children[0].rotation.set(0,0,0);
    this.cardGroup.children[1].rotation.set(0,0,0);
    this.cardGroup.children[2].rotation.set(0,0,0);


    // Clean up when the VR session ends
    this.cardGroup.position.set(0, 0, -2.5);
    this.camera.position.set(0, 0, 0);
    this.camera.fov = 5;
    this.camera.updateProjectionMatrix();
    //controls.target.copy(cardGroup.position);
    this.scene.remove( this.xrEnvironment );
    this.xrEnvironment.removeFromParent();
    this.xrEnvironment = null;
  }
}
import * as THREE from 'three';

// Responsible for setting up the VR/XR specific bits
class XRScene {
  
  setBaseReferenceSpace(ref) {
    this.baseReferenceSpace = ref;
  }
  
  constructor(renderer, document) {

  // Turn on WebXR support
  let referenceSpaceType = "local-floor"; // or 'local', 'unbounded', etc.
  let xrSession;

  renderer.xr.enabled = true;
  renderer.xr.addEventListener("sessionstart", (event) => {
    xrSession = renderer.xr.getSession();
    xrSession.
      requestReferenceSpace(referenceSpaceType).
      then(this.setBaseReferenceSpace().bind(this)); // TODO, I don't think this is going to bind to the right 'this'
    });
  });
  document.body.appendChild(VRButton.createButton(renderer));

  function onSelectStart( event ) {

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
  
  function onSelectEnd( event ) {

    const controller = event.target;

    if ( controller.userData.selected !== undefined ) {

      const card = controller.userData.selected;
      card.border.material.emissive.b = 0;
      cardGroup.attach( card );

      controller.userData.selected = undefined;

    }

  }
  
  function getIntersections( controller ) {

    controller.updateMatrixWorld();

    tempMatrix.identity().extractRotation( controller.matrixWorld );

    raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
    raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

    return raycaster.intersectObjects( cardGroup.children, false );

  }

  function intersectObjects( controller ) {

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

  function cleanIntersected() {

    while ( intersected.length ) {

      const object = intersected.pop();
      object.border.material.emissive.r = 0;

    }

  }  

  function onSessionStart() {
    // Put the group of cards near the player
    cardGroup.position.set(0, 1, -0.5);
    xrEnvironment.visible = true;

    // Add event listeners for controllers and other session start related setup
    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();

    controller1 = renderer.xr.getController(0);
    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(
      controllerModelFactory.createControllerModel(controllerGrip1)
    );
    scene.add(controller1);
    scene.add(controllerGrip1);

    controller2 = renderer.xr.getController(1);
    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(
      controllerModelFactory.createControllerModel(controllerGrip2)
    );
    scene.add(controller2);
    scene.add(controllerGrip2);

    hand1 = renderer.xr.getHand(0);
    hand1.add(handModelFactory.createHandModel(hand1));

    scene.add(hand1);

    hand2 = renderer.xr.getHand(1);
    hand2.add(handModelFactory.createHandModel(hand2));

    scene.add(hand2);

    controller1.addEventListener("selectstart", onSelectStart);
    controller1.addEventListener("selectend", onSelectEnd);

    controller2.addEventListener("selectstart", onSelectStart);
    controller2.addEventListener("selectend", onSelectEnd);

    // Attach laser pointers to both controllers
    const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

    const line = new THREE.Line( geometry );
    line.name = 'line';
    line.scale.z = 5;

    controller1.add( line.clone() );
    controller2.add( line.clone() );

    raycaster = new THREE.Raycaster();

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

  // In VR mode, show a basic floor and walls
  //   since a black void can be a little disorienting
  xrEnvironment = new THREE.Group();
  xrEnvironment.visible = false;
  scene.add( xrEnvironment );
  
  room = new THREE.LineSegments(
    new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 3, 0),
    new THREE.LineBasicMaterial({ color: 0xbcbcbc })
  );
  xrEnvironment.add(room);
  
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 4.8, 2, 2).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xbcbcbc,
      transparent: true,
      opacity: 0.25,
    })
  );
  floor.receiveShadow = true;
  xrEnvironment.add(floor);
    
  }
}
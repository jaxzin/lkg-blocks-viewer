import * as THREE from 'three';

class BlockCard {
  constructor(texture, width, height, radius, borderWidth, quiltDims, quiltRes, maxViewingAngle) {
    this.texture = texture;
    this.material = this.createShaderMaterial(quiltDims, quiltRes, maxViewingAngle);
    this.geometry = this.createRoundRectGeometry(width, height, radius);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.onBeforeRender = this.updateAngle;
    
    this.addBorder(width, height, borderWidth);
  }
  
  getMesh() {
    return this.mesh;
  }
  
  
  
  addBorder(width, height, borderWidth) {
    const borderGeometry = this.createRoundedRechGeometry(width + borderWidth, height + borderWidth, borderWidth);
    const border = new THREE.Mesh(
      borderGeometry, 
      new THREE.MeshPhongMaterial({
        color: "#AAAAFF",
        side: THREE.DoubleSide
      })
    );
    border.position.z = -0.001;
    this.mesh.add( border );
  }
  
  updateAngle(renderer, scene, camera, geometry, material, group ) {
    // Update the viewing angle so the quilt viewer shader knows which quilt cell(s) to display
    material.uniforms.uRelativeAngle.value = this.calculateRelativeAngle(camera, this);
  }
  
  calculateRelativeAngle(camera, object) {
    // Get the world space position of the object
    let objectWorldPosition = new THREE.Vector3();
    object.getWorldPosition(objectWorldPosition);

    // Calculate the direction from the object to the camera in world space
    let toCameraDirection = new THREE.Vector3().subVectors(camera.position, objectWorldPosition);
    toCameraDirection.y = 0; // Project onto the XZ plane (quilts only have parallax in the horizontal axis)
    toCameraDirection.normalize(); // Re-normalize the vector

    // Get the forward normal of the object in world space
    let objectNormal = new THREE.Vector3(0, 0, 1); // Default forward in local space
    let objectWorldQuaternion = new THREE.Quaternion();
    object.getWorldQuaternion(objectWorldQuaternion);
    objectNormal.applyQuaternion(objectWorldQuaternion);
    objectNormal.y = 0; // Project onto the XZ plane (quilts only have parallax in the horizontal axis)
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
}

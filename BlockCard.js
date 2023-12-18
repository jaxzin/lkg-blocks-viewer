import * as THREE from 'three';
import { QuiltMaterial } from './QuiltMaterial.js';
import { RoundedRectGeometry } from './RoundedRect.js';

// A textured mesh shaped like a playing card, a rectangle with rounded corners and a colored border.
// In the center is a viewport into a stereoscopic light field.
export class BlockCard extends THREE.Mesh {
  constructor(texture, width, height, radius, borderWidth, quiltDims, maxViewingAngle) {
    let material = new QuiltMaterial(texture, quiltDims, maxViewingAngle);
    let geometry = new RoundedRectGeometry(width, height, radius);
    super(geometry, material)
    this.castShadow = true;
    // Important event handler, updates the relative angle in the shader.
    // Runs once per eye (when in XR mode), leading to a stereoscopic view of the lightfield
    this.onBeforeRender = this.updateAngle.bind(this);
    
    this.addBorder(width, height, borderWidth);
  }
    
  getBorder() {
    this.border;
  }
  
  //===================================
  // Helper functions
  //===================================

    
  addBorder(width, height, borderWidth) {
    const borderGeometry = new RoundedRectGeometry(width + borderWidth, height + borderWidth, borderWidth);
    this.border = new THREE.Mesh(
      borderGeometry, 
      new THREE.MeshPhongMaterial({
        color: "#AAAAFF",
        side: THREE.DoubleSide
      })
    );
    this.border.position.z = -0.001;
    this.add( this.border );
  }
  
  updateAngle(renderer, scene, camera, geometry, material, group ) {
    // Update the viewing angle so the quilt viewer shader knows which quilt cell(s) to display
    let angle = this.calculateRelativeAngle(camera, this)
    material.setRelativeAngle( angle );
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

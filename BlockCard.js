import * as THREE from 'three';
import QuiltMaterial from 'QuiltMaterial';

class BlockCard {
  constructor(texture, width, height, radius, borderWidth, quiltDims, quiltRes, maxViewingAngle) {
    this.texture = texture;
    this.material = new QuiltMaterial(texture, quiltDims, quiltRes, maxViewingAngle);
    this.geometry = this.createRoundRectGeometry(width, height, radius);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.onBeforeRender = this.updateAngle;
    
    this.addBorder(width, height, borderWidth);
  }
  
  getMesh() {
    return this.mesh;
  }
  
  //===================================
  // Helper functions
  //===================================
  
  // Function to create a rounded rectangle shape
  createRoundedRectShape(width, height, radius) {
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
  
  createRoundedRectGeometry(width, height, radius) {
    const shape = this.createRoundedRectShape(width, height, radius);
    const geometry = new THREE.ShapeGeometry(shape);  

    // If the geometry is not already a BufferGeometry, convert it
    if (!(geometry instanceof THREE.BufferGeometry)) {
        geometry = new THREE.BufferGeometry().fromGeometry(geometry);
    }

    // Access the UV attribute
    var uvs = geometry.attributes.uv;
    for (let i = 0; i < uvs.array.length; i += 2) {
        // Scale UVs
        uvs.array[i] /= width;      // u coordinate
        uvs.array[i + 1] /= height; // v coordinate

        // Center the UVs
        uvs.array[i] += 0.5;       // u coordinate
        uvs.array[i + 1] += 0.5    // v coordinate

    }

    // Update the UV attribute
    uvs.needsUpdate = true;  
    return geometry;
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
    material.setRelativeAngle(this.calculateRelativeAngle(camera, this));
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

import * as THREE from 'three';

// A simple 2D plane that has rounded corners and normalized UV coordinates for texture mapping
export class RoundedRectGeometry {
  constructor(width, height, radius) {
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
    return geometry; // this replaces "this" class with an instance of BufferedGeometry. Javascript is cool!
  }
  
  
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

}


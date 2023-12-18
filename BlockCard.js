import * as THREE from 'three';

class BlockCard {
  constructor(texture, width, height, radius, quiltDims, quiltRes, maxViewingAngle) {
    this.texture = texture;
    this.material = this.createShaderMaterial(quiltDims, quiltRes, maxViewingAngle);
    this.geometry = this.createRoundRectGeometry(width, height, radius);
    this.quiltViewer = new THREE.Mesh(this.geometry, this.material);
    this.quiltViewer.castShadow = true;
    this.quiltViewer.onBeforeRender = updateAngle;
  }
  
  
}

function updateAngle(renderer, scene, camera, geometry, material, group ) {
  // Update the viewing angle so the quilt viewer shader knows which quilt cell(s) to display
  material.uniforms.uRelativeAngle.value = calculateRelativeAngle(camera, this);
}
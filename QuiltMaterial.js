import * as THREE from 'three';

// A Material that can display a light field quilt texture in a similar way to physical Looking Glass display.
export class QuiltMaterial extends THREE.ShaderMaterial {
  // A Quilt needs...
  // texture: THREE.Texture will all the pixels
  // quiltDims: A Vector2 with the column (x) and row (y) count of views in the quilt
  // maxViewingAngle: the total horizontal viewing cone in degrees
  constructor(texture, quiltDims, maxViewingAngle) {
    const vertexShader = `
        varying vec2 vUv;

        void main() {
            vUv = uv; // Assign the UV coordinates from the vertex attributes
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    const fragmentShader = `
        uniform sampler2D uTexture;
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
            float totalImages = float(quiltDims.x * quiltDims.y); // Total number of images in the quilt

            // Calculate cell size in UV space
            vec2 cellSize = 1. / quiltDims;

            // Calculate the normalized angle and use fract() to get the fractional part for interpolation
            float index = fract(normalizedAngle * totalImages);

            // Determine the current cell's index and the next cell's index
            float currentCellIndex = floor(normalizedAngle * totalImages);
            float nextCellIndex = currentCellIndex + 1.0;

            // Ensure the cell index is within bounds
            currentCellIndex = clamp(currentCellIndex, 0.0, totalImages - 1.0);
            nextCellIndex = clamp(nextCellIndex, 0.0, totalImages - 1.0);

            // Calculate the row and column for the current and next cells
            vec2 currentCell = vec2(mod(currentCellIndex, quiltDims.x), floor(currentCellIndex / quiltDims.x));
            vec2 nextCell = vec2(mod(nextCellIndex, quiltDims.x), floor(nextCellIndex / quiltDims.x));

            // Calculate UV coordinates for the current and next cells
            vec2 currentCellUv = (vUv * cellSize) + (currentCell / quiltDims);
            vec2 nextCellUv = (vUv * cellSize) + (nextCell / quiltDims);

            // Fetch the colors from the current and next cells
            vec4 currentColor = texture2D(uTexture, currentCellUv);
            vec4 nextColor = texture2D(uTexture, nextCellUv);

            // Interpolate between the current and next cell based on the fractional index
            vec4 textureColor = mix(currentColor, nextColor, index);

            // Calculate fade factor (1 at the edges of the cone, 0 at the center)
            float fadeFactor = clamp(pow(abs(uRelativeAngle) / maxAngle, 5.), 0., 1.);

            // Fade the off-axis stand-in to about 50% brightness
            vec4 standin = mix(textureColor, vec4(0.,0.,0.,1.), 0.5);

            // Fade to the standin as the viewing angle approaches the bounds of the viewing cone
            gl_FragColor = mix(textureColor, standin, fadeFactor);
        }
    `;
    
    // Initialize the ShaderMaterial with custom shaders and uniforms.
    super({
      uniforms: {
        uTexture: { value: texture },
        uRelativeAngle: { value: 0.0 },
        quiltDims: { value: quiltDims },
        viewCone: { value: maxViewingAngle }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    })
  }
  
  setRelativeAngle(angle) {
    this.uniforms.uRelativeAngle.value = angle;
  }
}
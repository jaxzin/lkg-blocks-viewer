import * as THREE from 'three';

// A Material that can display a light field quilt texture in a similar way to physical Looking Glass display.
export class QuiltMaterial extends THREE.ShaderMaterial {
  // A Quilt needs...
  // texture: THREE.Texture will all the pixels
  // quiltDims: A THREE.Vector2 with the column (x) and row (y) count of views in the quilt
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

        // Static values we calc in JS rather then on each iteration of the shader
        uniform float totalImages;
        uniform vec2 cellSize;

        varying vec2 vUv;

        // Get the color based on a single view index (1D) into the quilt
        void cellColor(float viewIndex, out vec4 color) {
          viewIndex = clamp(viewIndex, 0., totalImages - 1.);
          vec2 cellIndex = vec2(mod(viewIndex, quiltDims.x), floor(viewIndex / quiltDims.x));
          vec2 cellUv = (vUv * cellSize) + (cellIndex / quiltDims);

          color = texture2D(uTexture, cellUv);
        }
        
        // Mix the color based on the normalized relative viewing angle
        void mixCellColor(float angle, out vec4 color) {
            // Calculate the normalized angle and use fract() to get the fractional part for interpolation
            float viewFrac = fract(angle * totalImages);

            // Determine the current cell's index and the next cell's index
            float viewIndex = floor(angle * totalImages);
            float nextViewIndex = viewIndex + 1.;
            
            // Fetch the colors from the current and next cells
            vec4 currentColor;
            cellColor(viewIndex, currentColor);
            vec4 nextColor;
            cellColor(nextViewIndex, nextColor);
            
            // Interpolate between the current and next cell based on the fractional index
            color = mix(currentColor, nextColor, viewFrac);
        }

        void main() {
            // Define the viewing angle range (in radians)
            float maxAngle = radians(viewCone * .5);

            // Normalize the angle to be within [0, 1]
            float normalizedAngle = (maxAngle - uRelativeAngle) / (2.0 * maxAngle);

            // Interpolate between the current and next cell in the quilt
            vec4 textureColor;
            mixCellColor(normalizedAngle, textureColor);

            // Calculate fade factor (1 at the edges of the cone, 0 at the center)
            float fadeFactor = clamp(pow(abs(uRelativeAngle) / maxAngle, 5.), 0., .5);

            // Dim as the viewing angle approaches the bounds of the viewing cone
            gl_FragColor = mix(textureColor, vec4(0.,0.,0.,1.), fadeFactor);
        }
    `;
    
    // Initialize the ShaderMaterial with custom shaders and uniforms.
    super({
      uniforms: {
        uTexture: { value: texture },
        uRelativeAngle: { value: 0.0 },
        quiltDims: { value: quiltDims },        
        viewCone: { value: maxViewingAngle },
        
        // Dependent static values
        totalImages: { value: (quiltDims.x * quiltDims.y) },
        cellSize: { value: new THREE.Vector2( 1. / quiltDims.x, 1. / quiltDims.y )}
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    })
  }
  
  setRelativeAngle(angle) {
    this.uniforms.uRelativeAngle.value = angle;
  }
}
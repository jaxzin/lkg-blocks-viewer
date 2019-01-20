window.addEventListener('load', init)
let scene
let camera
let renderer
let sceneObjects = []
let uniforms = {}
let toggle = 1

function init() {
  scene = new THREE.Scene()
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 5
  
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  
  document.body.appendChild(renderer.domElement)
  adjustLighting()
  addBasicCube()
  addExperimentalCube()
  animationLoop()
}

function adjustLighting() {
    let pointLight = new THREE.PointLight(0xdddddd)
    pointLight.position.set(-5, -3, 3)
    scene.add(pointLight)
  
    let ambientLight = new THREE.AmbientLight(0x505050)
    scene.add(ambientLight)
}

function addBasicCube() {
  let geometry = new THREE.BoxGeometry(1, 1, 1)
  let material = new THREE.MeshLambertMaterial()  
  
  let mesh = new THREE.Mesh(geometry, material)
  mesh.position.x = -2
  scene.add(mesh)
  sceneObjects.push(mesh)
}

function vertexShader() {
  return `
    void main() {
      
    }
  `
}

//step 2: change based on coordinates
function fragmentShader() {
  return `
      uniform vec3 colorA; 
      uniform vec3 colorB; 
      uniform float mixer; 

      void main() {
        gl_FragColor = vec4(mix(colorA, colorB, mixer), 1.0);
      }
  `
}

function addExperimentalCube() {
  uniforms.colorA = {type: 'vec3', value: new THREE.Color(0xff0000)}
  uniforms.colorB = {type: 'vec3', value: new THREE.Color(0x0000ff)}
  uniforms.mixer = {type: 'f', value: 0.0}
  
  let geometry = new THREE.BoxGeometry(1, 1, 1)
  let material =  new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShader(),
  })
  
  let mesh = new THREE.Mesh(geometry, material)
  mesh.position.x = 2
  scene.add(mesh)
  sceneObjects.push(mesh)
}

function animationLoop() {
  renderer.render(scene, camera)
  
  for(let object of sceneObjects) {
    object.rotation.x += 0.01
    object.rotation.y += 0.03
  }
  
  if(uniforms.mixer.value >= 1.0) {
    toggle = -1
  } 
  
  if(uniforms.mixer.value <= 0.0) {
    toggle = 1
  }
  
  uniforms.mixer.value += 0.01 * toggle
  
  requestAnimationFrame(animationLoop)
}

window.addEventListener('load', init)
let scene
let camera
let renderer
let sceneObject


function init() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 50
  
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  
  document.body.appendChild(renderer.domElement)
  addCube()
}

function addCube() {
  let material = new THREE.BoxGeometry(100, 100, 100)
  let geometry = new THREE.MeshBasicMaterial()
  let mesh = new THREE.Mesh(geometry, material)
  mesh.position.z = -5
  scene.add(mesh)
  
  console.log(scene)
}
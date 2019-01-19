window.addEventListener('load', init)
let scene
let camera
let light
let renderer
let mesh


function init() {
  scene = new THREE.Scene()
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 5
  
  light = new THREE.AmbientLight(0xffffff)
  scene.add(light)
  
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  
  document.body.appendChild(renderer.domElement)
  addCube()
  animationLoop()
}

function addCube() {
  let geometry = new THREE.BoxGeometry(1, 1, 1)
  let material = new THREE.MeshLambertMaterial()
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
}

function animationLoop() {
  renderer.render(scene, camera)
  
  mesh.rotation.x += 0.01
  mesh.rotation.y += 0.03
  
  requestAnimationFrame(animationLoop)
}

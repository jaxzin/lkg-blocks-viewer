window.addEventListener('load', init)
let scene
let camera
let renderer
let mesh


function init() {
  scene = new THREE.Scene()
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 5
  
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  
  document.body.appendChild(renderer.domElement)
  adjustLighting()
  addCube()
  animationLoop()
}

function adjustLighting() {
    let pointLight = new THREE.PointLight(0xdddddd)
    pointLight.position.set(-5, -3, 3)
    scene.add(pointLight)
  
    let ambientLight = new THREE.AmbientLight(0x505050)
    scene.add(ambientLight)
}

function addCube() {
  let geometry = new THREE.BoxGeometry(1, 1, 1)
  //let material = new THREE.MeshLambertMaterial()
  let material =  new THREE.ShaderMaterial({
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent
  })
  
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
}

function animationLoop() {
  renderer.render(scene, camera)
  
  mesh.rotation.x += 0.01
  mesh.rotation.y += 0.03
  
  requestAnimationFrame(animationLoop)
}

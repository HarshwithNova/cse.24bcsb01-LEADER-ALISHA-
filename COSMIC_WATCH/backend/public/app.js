const hero = document.getElementById("hero")
const panel = document.getElementById("infoPanel")
const audio = document.getElementById("spaceAudio")
const asteroidList = document.getElementById("asteroidList")
const asteroidSelect = document.getElementById("asteroidSelect")

let asteroidData = []
let asteroidsThree = []

let cameraTarget = new THREE.Vector3(0,0,0)
let cameraPositionTarget = null

// Three.js setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 2000)
camera.position.set(0,0,8)
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById("spaceScene"), antialias:true})
renderer.setSize(innerWidth, innerHeight)

const earthOrbit = new THREE.Object3D()
scene.add(earthOrbit)

// Earth
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(.7,64,64),
  new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg") })
)
earth.position.x = 3
earthOrbit.add(earth)

// Moon
const moonOrbit = new THREE.Object3D()
earth.add(moonOrbit)
const moon = new THREE.Mesh(new THREE.SphereGeometry(.18,32,32), new THREE.MeshStandardMaterial({color:0xcccccc}))
moon.position.x = 1
moonOrbit.add(moon)

scene.add(new THREE.PointLight(0xffffff,1.6))
scene.add(new THREE.AmbientLight(0x555555))

// Hero enter
function enterSpace(){
  audio.play()
  hero.classList.add("hide")
  setTimeout(()=>panel.classList.add("show"),1500)
}

// Create label sprite
function createLabel(text,color="#fff"){
  const canvas = document.createElement("canvas")
  const size = 256
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0,0,size,size)
  ctx.fillStyle = color
  ctx.font = "bold 40px Orbitron"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, size/2, size/2)
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent:true })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(1,0.5,1)
  return sprite
}

// Fetch NASA NEO data
async function loadAsteroids(){
  const d = new Date().toISOString().split("T")[0]
  const res = await fetch(`"http://localhost:5500/api/asteroids"`) // your backend endpoint
  asteroidData = await res.json()
  asteroidList.innerHTML = ""
  asteroidSelect.innerHTML = '<option value="">--Select Asteroid--</option>'

  // Remove old 3D asteroids
  asteroidsThree.forEach(a=>scene.remove(a))
  asteroidsThree=[]

  asteroidData.forEach((a,i)=>{
    asteroidList.innerHTML += `<div class="card">
      <strong>${a.name}</strong><br>
      Diameter ${a.diameter} km<br>
      Velocity ${parseFloat(a.velocity).toFixed(2)} km/h<br>
      <span class="${a.hazardous?'danger':'safe'}">${a.hazardous?'Hazardous':'Safe'}</span>
    </div>`

    // Add to dropdown
    const option = document.createElement("option")
    option.value = a.id
    option.textContent = a.name
    asteroidSelect.appendChild(option)

    // 3D asteroid
    let radius = Math.min(Math.max(parseFloat(a.missDistance)/1e6,4),12)
    const size = Math.min(a.diameter/10,0.5)
    const geometry = new THREE.IcosahedronGeometry(size,1)
    const material = new THREE.MeshStandardMaterial({
      color: a.hazardous ? new THREE.Color(1,0,0) : new THREE.Color(0.66,0.66,0.66),
      roughness:0.9,
      emissive: a.hazardous ? new THREE.Color(0.5,0,0) : new THREE.Color(0,0,0),
      emissiveIntensity: a.hazardous ? 0.8 : 0
    })
    const asteroidMesh = new THREE.Mesh(geometry,material)
    asteroidMesh.userData = { angle:Math.random()*6.28, speed:0.001+Math.random()*0.002, radius, hazardous:a.hazardous, data:a }

    // Label
    const labelText = a.hazardous ? `${a.name} ⚠` : a.name
    const labelColor = a.hazardous ? "#ff4d4d" : "#ffffff"
    const label = createLabel(labelText,labelColor)
    label.position.y = size+0.2
    asteroidMesh.add(label)

    scene.add(asteroidMesh)
    asteroidsThree.push(asteroidMesh)
  })
}

// Show details and focus camera
function showDetails(id){
  panel.classList.add("show")
  if(!id) return
  const asteroid = asteroidData.find(a=>a.id===id)
  if(!asteroid) return

  asteroidList.innerHTML = `<div class="card">
    <strong>${asteroid.name}</strong><br>
    Diameter ${asteroid.diameter} km<br>
    Velocity ${parseFloat(asteroid.velocity).toFixed(2)} km/h<br>
    Miss Distance ${parseFloat(asteroid.missDistance).toLocaleString()} km<br>
    Orbiting Body: ${asteroid.orbitingBody}<br>
    <span class="${asteroid.hazardous?'danger':'safe'}">${asteroid.hazardous?'Hazardous':'Safe'}</span>
  </div>`

  // Highlight 3D asteroid
  const selectedAsteroid = asteroidsThree.find(a=>a.userData.data.id===id)
  asteroidsThree.forEach(a=>{
    if(a===selectedAsteroid){ a.material.opacity=1; a.material.transparent=false }
    else { a.material.opacity=0.3; a.material.transparent=true }
  })

  // Camera target
  if(selectedAsteroid){
    cameraPositionTarget = selectedAsteroid.position.clone().add(new THREE.Vector3(0,1,3))
    cameraTarget.copy(selectedAsteroid.position)
  }
}

// Reset camera
function resetCamera(){
  cameraPositionTarget = new THREE.Vector3(0,0,8)
  cameraTarget.set(0,0,0)
  asteroidsThree.forEach(a=>{ a.material.opacity=1; a.material.transparent=false })
}

// Animate
function animate(){
  requestAnimationFrame(animate)
  earthOrbit.rotation.y+=0.001
  earth.rotation.y+=0.002
  moonOrbit.rotation.y+=0.01

  asteroidsThree.forEach(a=>{
    a.userData.angle+=a.userData.speed
    a.position.x = Math.cos(a.userData.angle)*a.userData.radius
    a.position.z = Math.sin(a.userData.angle)*a.userData.radius
    a.rotation.x+=0.003
    a.rotation.y+=0.003
    if(a.userData.hazardous) a.material.emissiveIntensity = 0.5 + 0.3*Math.sin(Date.now()*0.005)
    a.children.forEach(c=>{ if(c.type==="Sprite") c.lookAt(camera.position) })
  })

  // Smooth camera
  if(cameraPositionTarget){
    camera.position.lerp(cameraPositionTarget,0.02)
    camera.lookAt(cameraTarget)
  }

  renderer.render(scene,camera)
}
animate()

// Handle window resize
window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth,innerHeight)
})

// Raycaster for clicking
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
window.addEventListener('click',(event)=>{
  mouse.x = (event.clientX / innerWidth)*2-1
  mouse.y = -(event.clientY/innerHeight)*2+1
  raycaster.setFromCamera(mouse,camera)
  const intersects = raycaster.intersectObjects(asteroidsThree,true)
  if(intersects.length>0){
    let selected = intersects[0].object
    while(!selected.userData.data && selected.parent) selected = selected.parent
    if(selected.userData.data) showDetails(selected.userData.data.id)
  }
})

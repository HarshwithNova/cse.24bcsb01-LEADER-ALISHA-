const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth/window.innerHeight,
0.1,
1000
);
camera.position.z = 15;
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);
const light = new THREE.PointLight(0x38bdf8,1);
light.position.set(10,10,10);
scene.add(light);
const earthGeo = new THREE.SphereGeometry(2,32,32);
const earthMat = new THREE.MeshStandardMaterial({color:0x1e90ff});
const earth = new THREE.Mesh(earthGeo,earthMat);
scene.add(earth);
const ringGeo = new THREE.TorusGeometry(6,0.05,16,100);
const ringMat = new THREE.MeshBasicMaterial({color:0x38bdf8});
const orbitRing = new THREE.Mesh(ringGeo,ringMat);
orbitRing.rotation.x = Math.PI/2;
scene.add(orbitRing);
const satGeo = new THREE.BoxGeometry(0.6,0.3,1.2);
const satMat = new THREE.MeshStandardMaterial({color:0xffffff});
const satellite = new THREE.Mesh(satGeo,satMat);
scene.add(satellite);
const starGeo = new THREE.BufferGeometry();
const starVertices = [];
for(let i=0;i<800;i++){
starVertices.push(
Math.random()*600-300,
Math.random()*600-300,
Math.random()*600-300
);
}
starGeo.setAttribute(
'position',
new THREE.Float32BufferAttribute(starVertices,3)
);
const starMat = new THREE.PointsMaterial({color:0xffffff});
const stars = new THREE.Points(starGeo,starMat);
scene.add(stars);
let angle = 0;
function animate(){
requestAnimationFrame(animate);
angle += 0.01;
satellite.position.x = Math.cos(angle) * 6;
satellite.position.z = Math.sin(angle) * 6;
satellite.position.y = Math.sin(angle) * 2;
satellite.rotation.x += 0.04;
satellite.rotation.y += 0.05;
earth.rotation.y += 0.002;
renderer.render(scene,camera);
}
animate();
window.addEventListener("resize",()=>{

camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth,window.innerHeight);

});

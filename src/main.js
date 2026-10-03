import * as THREE from 'three';
import './style.css';

const time = document.querySelector("#time");

// clock helper function
function updateClock() {
  const now = new Date();

  const hour = now.getHours().toString().padStart(2, '0');
  const min = now.getMinutes().toString().padStart(2, '0');
  time.innerHTML =  `${hour}:${min}`
}
updateClock();
setInterval(updateClock, 1000)

// ISS Positional Data
const URL = "https://api.wheretheiss.at/v1/satellites/25544"
async function getLocation() {
  try {
    const response = await fetch(URL)
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)

    const dataISS = await response.json()

    // fetch lat, lon
    const lat = dataISS.latitude
    const lon = dataISS.longitude
    const alt = dataISS.altitude
    const velocity = dataISS.velocity
    console.log([lat, lon, alt, velocity])
  } catch (error) {
    console.error('Unable to fetch ISS location:', error)
  }
}
getLocation();

// ThreeJS Scene
const scene = new THREE.Scene(); 
scene.background = new THREE.Color(0x000000); 

// Sphere Earth
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('textures/2k_earth_daymap.jpg');
texture.colorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 ); 

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild( renderer.domElement ); 

const geometry = new THREE.SphereGeometry(15, 32, 64);
// Changed color slightly so you can see it against the white background
const material = new THREE.MeshStandardMaterial( { map: texture } ); 
const sphere = new THREE.Mesh( geometry, material ); 
sphere.castShadow = true;
sphere.receiveShadow = true;
const earthTilt = THREE.MathUtils.degToRad(23.5); 

// Offset the Earth and its orbit to create the lower-right composition.
const composition = new THREE.Group();
composition.position.set(24, -8, 0);
scene.add(composition);

// Sun: lights the Earth from the upper left and casts shadows.
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(-40, 20, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 120;
sun.target = composition;
scene.add(sun);

// Dim fill light so the night side isn't pure black.
scene.add(new THREE.AmbientLight(0xffffff, 0.08));

// Earth Group
const earthGroup = new THREE.Group();
earthGroup.add( sphere );
earthGroup.rotation.z = earthTilt;
composition.add( earthGroup );

// ISS orbit, seen nearly edge-on and sloping down to the right.
// The near (lower) half passes in front of the Earth, the far half behind it.
const orbitRadius = 21;
const orbitGroup = new THREE.Group();
orbitGroup.rotation.set(
  THREE.MathUtils.degToRad(-75),
  0,
  THREE.MathUtils.degToRad(-25),
  'ZYX'
);
composition.add(orbitGroup);

const orbit = new THREE.Mesh(
  new THREE.TorusGeometry(orbitRadius, 0.08, 8, 256),
  new THREE.MeshBasicMaterial({ color: 0x55ddff })
);
orbitGroup.add(orbit);

// A small procedural ISS marker: central module, truss, solar panels, and antenna.
const iss = new THREE.Group();
// Keep the ISS anchored to one point on the left side of the orbit.
iss.position.x = -orbitRadius;
iss.scale.setScalar(0.7);
orbitGroup.add(iss);

const issBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xe8f1f5 });
const solarPanelMaterial = new THREE.MeshStandardMaterial({ color: 0x2b6da8, metalness: 0.3, roughness: 0.4 });
const trussMaterial = new THREE.MeshStandardMaterial({ color: 0xb8c5cc });

const issBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.45, 0.45),
  issBodyMaterial
);
iss.add(issBody);

const issTruss = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.14, 2.1),
  trussMaterial
);
iss.add(issTruss);

for (const z of [-1.05, 1.05]) {
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.05, 0.85),
    solarPanelMaterial
  );
  panel.position.z = z;
  iss.add(panel);
}

const antenna = new THREE.Mesh(
  new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8),
  issBodyMaterial
);
antenna.rotation.z = Math.PI / 2;
antenna.position.x = 0.55;
iss.add(antenna);

iss.traverse((o) => { if (o.isMesh) o.castShadow = true; });

// MOVE CAMERA OUTSIDE THE SPHERE (Radius is 15, so set this > 15)
camera.position.z = 40;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate( time ) {
  sphere.rotation.y = time/30000;
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

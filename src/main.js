import * as THREE from 'three';
import './style.css';
import { placeAt } from './location.js';

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

// Shortcut tiles, saved in this browser's localStorage
const STORAGE_KEY = 'shortcuts';
const defaultShortcuts = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Spotify', url: 'https://spotify.com' },
];

function loadShortcuts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? defaultShortcuts;
  } catch {
    return defaultShortcuts;
  }
}

function saveShortcuts(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Unable to save shortcuts:', error);
  }
}

let shortcuts = loadShortcuts();
const shortcutsEl = document.querySelector('#shortcuts');

// "+" tile for adding a new website
const addButton = document.createElement('button');
addButton.type = 'button';
addButton.className = 'shortcut';
addButton.innerHTML = `<span class="shortcut-icon shortcut-add">+</span><span class="shortcut-name">Add</span>`;
addButton.addEventListener('click', () => {
  let url = prompt('Website URL')?.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    alert('That doesn\'t look like a valid URL.');
    return;
  }

  const name = prompt('Name', hostname.replace(/^www\./, ''))?.trim();
  if (name === undefined) return;
  shortcuts.push({ name: name || hostname, url });
  saveShortcuts(shortcuts);
  renderShortcuts();
});

// Inside the extension, Chrome serves favicons from its own cache ("favicon" permission).
// On the Vite dev server there's no extension API, so fall back to Google's favicon service.
function faviconURL(pageUrl) {
  if (globalThis.chrome?.runtime?.id) {
    const url = new URL(chrome.runtime.getURL('/_favicon/'));
    url.searchParams.set('pageUrl', pageUrl);
    url.searchParams.set('size', '64');
    return url.toString();
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(pageUrl).hostname)}&sz=64`;
}

function renderShortcuts() {
  shortcutsEl.innerHTML = '';
  for (const { name, url } of shortcuts) {
    const a = document.createElement('a');
    a.className = 'shortcut';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = `${name} (right-click to remove)`;

    const icon = document.createElement('span');
    icon.className = 'shortcut-icon';
    const img = document.createElement('img');
    img.src = faviconURL(url);
    img.alt = '';
    icon.append(img);

    const label = document.createElement('span');
    label.className = 'shortcut-name';
    label.textContent = name;

    a.append(icon, label);

    // Right-click a tile to remove it
    a.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      if (!confirm(`Remove ${name}?`)) return;
      shortcuts = shortcuts.filter((s) => s.url !== url);
      saveShortcuts(shortcuts);
      renderShortcuts();
    });

    shortcutsEl.append(a);
  }
  shortcutsEl.append(addButton);
}
renderShortcuts();

// ISS Positional Data
const issInfo = document.querySelector("#issInfo");
const ISS_API_URL = "https://api.wheretheiss.at/v1/satellites/25544"
async function getLocation() {
  try {
    const response = await fetch(ISS_API_URL)
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)

    const dataISS = await response.json()

    // fetch lat, lon
    const lat = dataISS.latitude
    const lon = dataISS.longitude
    const alt = dataISS.altitude
    const velocity = dataISS.velocity
    const place = await placeAt(lat, lon)

    issInfo.innerHTML = `
      <h2>ISS</h2>
      <dl>
        <dt>Over</dt><dd>${place.name}</dd>
        <dt>Latitude</dt><dd>${lat.toFixed(2)}°</dd>
        <dt>Longitude</dt><dd>${lon.toFixed(2)}°</dd>
        <dt>Altitude</dt><dd>${alt.toFixed(1)} km</dd>
        <dt>Velocity</dt><dd>${Math.round(velocity).toLocaleString()} km/h</dd>
      </dl>`
  } catch (error) {
    console.error('Unable to fetch ISS location:', error)
  }
}
getLocation();
setInterval(getLocation, 5000)

// ThreeJS Scene
const scene = new THREE.Scene(); 
scene.background = new THREE.Color(0x000000); 

// Sphere Earth
const textureLoader = new THREE.TextureLoader();
const dayTexture = textureLoader.load('textures/2k_earth_daymap.jpg');
dayTexture.colorSpace = THREE.SRGBColorSpace;
const nightTexture = textureLoader.load('textures/2k_earth_nightmap.jpg');
nightTexture.colorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 ); 

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild( renderer.domElement ); 

const geometry = new THREE.SphereGeometry(15, 32, 64);
// Changed color slightly so you can see it against the white background
const material = new THREE.MeshStandardMaterial(); 
const sphere = new THREE.Mesh( geometry, material ); 

// Use the night map (city lights) from 7:00pm until 5:00am local time.
function updateEarthTexture() {
  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 5;
  const nextMap = isNight ? nightTexture : dayTexture;
  if (material.map === nextMap) return;

  material.map = nextMap;
  // Make the city lights glow instead of being darkened by the Sun's shading.
  material.emissiveMap = isNight ? nightTexture : null;
  material.emissive.set(isNight ? 0xffffff : 0x000000);
  material.needsUpdate = true;
}
updateEarthTexture();
setInterval(updateEarthTexture, 60 * 1000);
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

// Glow: wider, faint copies of the ring blended additively so they brighten
// whatever is behind them, fading out from the core line.
for (const [tube, opacity] of [[0.25, 0.35], [0.5, 0.15], [0.9, 0.06]]) {
  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(orbitRadius, tube, 12, 256),
    new THREE.MeshBasicMaterial({
      color: 0x55ddff,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  orbitGroup.add(glow);
}

// A small procedural ISS marker: central module, truss, solar panels, and antenna.
const iss = new THREE.Group();
// Keep the ISS anchored to one point on the left side of the orbit.
iss.position.x = -orbitRadius;
iss.scale.setScalar(1.4);
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

// Invisible, larger hover target so the tiny ISS is easy to point at.
const issHitArea = new THREE.Mesh(
  new THREE.SphereGeometry(1.8, 12, 8),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
);
iss.add(issHitArea);

// Show the ISS info box while the pointer is over the ISS.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hovering = raycaster.intersectObject(issHitArea).length > 0;
  issInfo.hidden = !hovering;
  document.body.style.cursor = hovering ? 'pointer' : '';
  if (hovering) positionIssInfo();
});

// Anchor the info box just above the ISS on screen.
const issScreenPos = new THREE.Vector3();
function positionIssInfo() {
  iss.getWorldPosition(issScreenPos).project(camera);
  issInfo.style.left = `${(issScreenPos.x + 1) / 2 * window.innerWidth}px`;
  issInfo.style.top = `${(1 - issScreenPos.y) / 2 * window.innerHeight}px`;
}

// MOVE CAMERA OUTSIDE THE SPHERE (Radius is 15, so set this > 15)
camera.position.z = 40;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate( time ) {
  sphere.rotation.y = time/30000;
  if (!issInfo.hidden) positionIssInfo();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

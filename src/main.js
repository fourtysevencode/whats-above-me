import * as THREE from 'three';

const scene = new THREE.Scene(); 
scene.background = new THREE.Color(0x000000); 

// Sphere Earth
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('textures/2k_earth_daymap.jpg');
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); 

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement ); 

const geometry = new THREE.SphereGeometry(15, 32, 16);
// Changed color slightly so you can see it against the white background
const material = new THREE.MeshBasicMaterial( { map: texture } ); 
const sphere = new THREE.Mesh( geometry, material ); 
const earthTilt = THREE.MathUtils.degToRad(23.5); 

// Earth Group
const earthGroup = new THREE.Group();
earthGroup.add( sphere );
earthGroup.rotation.z = earthTilt;
scene.add( earthGroup );

// Ring (ISS Orbit)
// Creates a very thin ring with a width of only 0.4 units
const ringGeo = new THREE.RingGeometry(17, 17.9, 64);
const ringMat = new THREE.MeshBasicMaterial({ 
  color: 0xffffff,       // A bright cyan/green neon color for visibility
  side: THREE.DoubleSide // Keeps it visible from top and bottom angles
});
const ring = new THREE.Mesh(ringGeo, ringMat);
scene.add(ring);

// MOVE CAMERA OUTSIDE THE SPHERE (Radius is 15, so set this > 15)
camera.position.z = 50; 

function animate( time ) {
  sphere.rotation.y = time/10000;
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

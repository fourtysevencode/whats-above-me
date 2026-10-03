import * as THREE from 'three';

const scene = new THREE.Scene(); // Create a scene
scene.background = new THREE.Color(0xffffff); // Make scene white
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); // Create a camera

// Set a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement ); // add renderer element to body

const geometry = new THREE.BoxGeometry( 1, 1, 1 ); // box geometry
const material = new THREE.MeshBasicMaterial( { color: 0xDEDEDE } ); // material to cover the geometry
const cube = new THREE.Mesh( geometry, material ); // create the cube mesh with geometry and material
scene.add( cube );

camera.position.z = 5;

// Rendering loop which causes a redraw everytime the screen is refreshed
function animate( time ) {
  cube.rotation.x = time/2000;
  cube.rotation.y = time/1000;
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );


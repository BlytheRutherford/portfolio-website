import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;
const controls = new OrbitControls(camera, renderer.domElement);
const light = new THREE.DirectionalLight(0xffffff, 10);
light.position.set(5, 10, 7);
scene.add(light);
const loader = new GLTFLoader();
loader.load('./models/felix_the_cat.glb', function(gltf) {
    gltf.scene.scale.set(0.005, 0.005, 0.005);
    scene.add(gltf.scene);
})

loader.load('./models/animated_dragon.glb', function(gltf) {
    gltf.scene.scale.set(15, 15, 15);
    gltf.scene.position.set(10, 0, 20);
    scene.add(gltf.scene);
});

loader.load('./models/angel.glb', function(gltf) {
    gltf.scene.scale.set(200, 200, 200);
    gltf.scene.position.set(-4, 0, 0);
    scene.add(gltf.scene);
});

loader.load('./models/mycena.glb', function(gltf) {
    gltf.scene.scale.set(2, 2, 2);
    gltf.scene.position.set(-5, 0, 0);
    scene.add(gltf.scene);
});

loader.load('./models/demon_head.glb', function(gltf) {
    gltf.scene.scale.set(2, 2, 2);
    gltf.scene.position.set(-5, 0, -5);
    scene.add(gltf.scene);
});

loader.load('./models/dark_winged_demon.glb', function(gltf) {
    gltf.scene.scale.set(10, 10, 10);
    gltf.scene.position.set(-10, 0, 0);
    scene.add(gltf.scene);
});

loader.load('./models/hand_monster.glb', function(gltf) {
    gltf.scene.scale.set(8, 8, 8);
    gltf.scene.position.set(0, 0, 5);
    scene.add(gltf.scene);
});

loader.load('./models/strego.glb', function(gltf) {
    gltf.scene.scale.set(.5, .5, .5);
    gltf.scene.position.set(0, 0, -15);
    scene.add(gltf.scene);
});

loader.load('./models/thefuture.glb', function(gltf) {
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.position.set(-20, 0, -20);
    scene.add(gltf.scene);
});

loader.load('./models/toad.glb', function(gltf) {
    gltf.scene.scale.set(.05, .05, .05);
    gltf.scene.position.set(20, 0, -20);
    scene.add(gltf.scene);
});

loader.load('./models/plague_doctor.glb', function(gltf) {
    gltf.scene.scale.set(6, 6, 6);
    gltf.scene.position.set(20, 0, 0);
    scene.add(gltf.scene);
});

loader.load('./models/eye.glb', function(gltf) {
    gltf.scene.scale.set(2, 2, 2);
    gltf.scene.position.set(-20, 0, 0);
    scene.add(gltf.scene);
});

loader.load('./models/corgi.glb', function(gltf) {
    gltf.scene.scale.set(20, 20, 20);
    gltf.scene.position.set(-20, 0, 20);
    scene.add(gltf.scene);
});

loader.load('./models/frame.glb', function(gltf) {
    gltf.scene.scale.set(10, 10, 10);
    gltf.scene.position.set(-35, 0, 20);
    scene.add(gltf.scene);
});

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
const scene = new THREE.Scene();
// Glitchy background
// Render target for post-processing
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const glitchUniforms = {
  tDiffuse: { value: null },
  time: { value: 0 }
};

const glitchMaterial = new THREE.ShaderMaterial({
  uniforms: glitchUniforms,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Heavy glitch displacement
      float glitchLine = step(0.9, random(vec2(floor(time * 1.5), floor(uv.y * 30.0))));
      uv.x += (random(vec2(time * 0.2, uv.y * 10.0)) - 0.5) * 0.15 * glitchLine;
      
      // Block glitches
      float blockGlitch = step(0.92, random(vec2(floor(uv.x * 10.0), floor(time * 0.8))));
      uv.y += (random(vec2(uv.x, time)) - 0.5) * 0.1 * blockGlitch;
      
      // Split amount
      float splitAmount = 0.015 + random(vec2(floor(time * 5.0), 0.0)) * 0.025;
      splitAmount += glitchLine * 0.06;
      
      // Sample left, center, right
      vec3 left = texture2D(tDiffuse, vec2(uv.x + splitAmount, uv.y)).rgb;
      vec3 center = texture2D(tDiffuse, uv).rgb;
      vec3 right = texture2D(tDiffuse, vec2(uv.x - splitAmount, uv.y)).rgb;
      
      // Convert to luminance
      float leftLuma = dot(left, vec3(0.299, 0.587, 0.114));
      float rightLuma = dot(right, vec3(0.299, 0.587, 0.114));
      
      // BRIGHT cyan and red
      vec3 cyan = vec3(0.0, 1.0, 1.0);
      vec3 red = vec3(1.0, 0.0, 0.0);
      
      // Stronger blend
      vec3 color = center;
      color += cyan * leftLuma * 0.7;
      color += red * rightLuma * 0.7;
      
      // Subtle noise
      float noise = random(uv + time) * 0.05;
      color += noise;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
});
const glitchQuad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  glitchMaterial
);
const postScene = new THREE.Scene();
postScene.add(glitchQuad);
const postCamera = new THREE.Camera();
//end background
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.002, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;

window.addEventListener('wheel', function(e) {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  
  const speed = e.deltaY * .001;
  camera.position.addScaledVector(direction, -speed);
  controls.target.addScaledVector(direction, -speed);
});
const light = new THREE.DirectionalLight(0xffffff, 10);
light.position.set(5, 10, 7);
scene.add(light);
const textureLoader = new THREE.TextureLoader();
const loader = new GLTFLoader();

const gui = new GUI();

// Camera position helper
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'x').listen();
cameraFolder.add(camera.position, 'y').listen();
cameraFolder.add(camera.position, 'z').listen();

// Model configs
const models = [
  { name: 'felix_the_cat', file: './models/felix_the_cat.glb', scale: 0.005, pos: [-8, 0, 0] },
  { name: 'animated_dragon', file: './models/animated_dragon.glb', scale: 15, pos: [6, 8, -40] },
  { name: 'angel', file: './models/angel.glb', scale: 200, pos: [-10, 2, -80] },
  { name: 'mycena', file: './models/mycena.glb', scale: 2, pos: [5, 1, -130] },
  { name: 'demon_head', file: './models/demon_head.glb', scale: 2, pos: [-5, 4, -170] },
  { name: 'dark_winged_demon', file: './models/dark_winged_demon.glb', scale: 50, pos: [10, 6, -220] },
  { name: 'hand_monster', file: './models/hand_monster.glb', scale: 8, pos: [-8, -3, -270] },
  { name: 'strego', file: './models/strego.glb', scale: 0.5, pos: [7, 2, -320] },
  { name: 'thefuture', file: './models/thefuture.glb', scale: 1, pos: [-12, 5, -370] },
  { name: 'toad', file: './models/toad.glb', scale: 0.05, pos: [6, 0, -420] },
  { name: 'plague_doctor', file: './models/plague_doctor.glb', scale: 6, pos: [-10, 3, -470] },
  { name: 'corgi', file: './models/corgi.glb', scale: 20, pos: [-6, 0, -570] },
  { name: 'frame', file: './models/frame.glb', scale: 10, pos: [0, 0, -620] },
  { name: 'Rot', file: './models/Rot.glb', scale: 10, pos: [0, -0.899999999999636, 4.10000000000036] }
];

models.forEach(function(config) {
  loader.load(config.file, function(gltf) {
    const model = gltf.scene;
    model.scale.set(config.scale, config.scale, config.scale);
    model.position.set(config.pos[0], config.pos[1], config.pos[2]);
    scene.add(model);
    
    // Helper object for uniform scale
    const settings = { scale: config.scale };

    // Add GUI folder for this model
    const folder = gui.addFolder(config.name);
    folder.add(model.position, 'x', -10000, 10000).step(0.1);
    folder.add(model.position, 'y', -10000, 10000).step(0.1);
    folder.add(model.position, 'z', -10000, 10000).step(0.1);
    folder.add(model.rotation, 'x', 0, Math.PI * 2).step(0.01).name('rot X');
    folder.add(model.rotation, 'y', 0, Math.PI * 2).step(0.01).name('rot Y');
    folder.add(model.rotation, 'z', 0, Math.PI * 2).step(0.01).name('rot Z');
    folder.add(settings, 'scale', 0.001, 500).step(1).onChange(function(v) {
      model.scale.set(v, v, v);
    });
    folder.close(); // Keep folders collapsed by default
  });
});


// mass content

const eyes = [];

loader.load('./models/eye.glb', function(gltf) {
  eyeData.forEach(function(data) {
    const eyeClone = gltf.scene.clone();
    eyeClone.scale.set(data.scale, data.scale, data.scale);
    eyeClone.position.set(data.pos[0], data.pos[1], data.pos[2]);
    eyeClone.rotation.x = Math.random() * Math.PI * 2;
    eyeClone.rotation.y = Math.random() * Math.PI * 2;
    eyeClone.rotation.z = Math.random() * Math.PI * 2;
    eyeClone.userData.speed = data.speed;
    scene.add(eyeClone);
    eyes.push(eyeClone);
  });
});

const eyeData = [
  // Current level
  { pos: [25, 15, -50], scale: 1.5, speed: 0.58 },
  { pos: [-30, -10, -90], scale: 3, speed: -0.42 },
  { pos: [40, 20, -140], scale: 0.8, speed: 0.15 },
  { pos: [-25, -15, -200], scale: 2.5, speed: -0.53 },
  { pos: [35, 5, -260], scale: 1, speed: 0.31 },
  { pos: [-40, 18, -310], scale: 4, speed: -0.08 },
  { pos: [20, -20, -380], scale: 1.2, speed: 0.6 },
  { pos: [-35, 12, -440], scale: 2, speed: -0.22 },
  { pos: [45, -8, -500], scale: 3.5, speed: 0.37 },
  { pos: [-20, 25, -560], scale: 0.5, speed: -0.49 },
  { pos: [30, -12, -600], scale: 2.8, speed: 0.11 },
  { pos: [-45, 8, -150], scale: 1.8, speed: -0.34 },
  { pos: [15, -25, -350], scale: 0.6, speed: 0.55 },
  { pos: [-10, 30, -480], scale: 3.2, speed: -0.18 },
  { pos: [50, 0, -30], scale: 1, speed: 0.44 },
  { pos: [-50, -5, -70], scale: 2.2, speed: -0.27 },
  { pos: [38, 28, -110], scale: 0.7, speed: 0.39 },
  { pos: [-32, -22, -170], scale: 4.5, speed: -0.06 },
  { pos: [48, 12, -230], scale: 1.3, speed: 0.24 },
  { pos: [-28, 22, -280], scale: 2.6, speed: -0.57 },
  { pos: [22, -28, -330], scale: 0.9, speed: 0.47 },
  { pos: [-42, -18, -390], scale: 3.8, speed: -0.13 },
  { pos: [55, 8, -450], scale: 1.6, speed: 0.29 },
  { pos: [-55, 15, -510], scale: 2.1, speed: -0.41 },
  { pos: [32, -30, -580], scale: 5, speed: 0.04 },
  { pos: [-38, 35, -620], scale: 0.4, speed: -0.59 },
  { pos: [60, -15, -180], scale: 1.4, speed: 0.52 },
  { pos: [-60, 10, -420], scale: 3.3, speed: -0.19 },
  { pos: [28, 32, -540], scale: 2.4, speed: 0.33 },
  { pos: [-48, -28, -300], scale: 1.9, speed: -0.46 },
  
  // High level (Y: 45 to 85)
  { pos: [22, 55, -45], scale: 1.2, speed: 0.51 },
  { pos: [-35, 62, -95], scale: 2.8, speed: -0.38 },
  { pos: [48, 48, -135], scale: 0.6, speed: 0.17 },
  { pos: [-18, 70, -195], scale: 3.5, speed: -0.56 },
  { pos: [32, 58, -255], scale: 1.8, speed: 0.28 },
  { pos: [-52, 75, -315], scale: 4.2, speed: -0.1 },
  { pos: [15, 85, -375], scale: 0.9, speed: 0.59 },
  { pos: [-40, 52, -435], scale: 2.3, speed: -0.25 },
  { pos: [55, 67, -495], scale: 3.1, speed: 0.36 },
  { pos: [-25, 78, -555], scale: 0.7, speed: -0.48 },
  { pos: [38, 45, -615], scale: 2.6, speed: 0.12 },
  { pos: [-58, 60, -155], scale: 1.6, speed: -0.32 },
  { pos: [12, 72, -345], scale: 0.5, speed: 0.54 },
  { pos: [-30, 82, -475], scale: 3.8, speed: -0.16 },
  { pos: [45, 50, -25], scale: 1.1, speed: 0.43 },
  { pos: [-42, 65, -75], scale: 2.1, speed: -0.29 },
  { pos: [28, 80, -115], scale: 0.8, speed: 0.4 },
  { pos: [-15, 47, -175], scale: 4.8, speed: -0.07 },
  { pos: [52, 73, -235], scale: 1.4, speed: 0.23 },
  { pos: [-38, 56, -285], scale: 2.9, speed: -0.54 },
  { pos: [18, 68, -335], scale: 1.0, speed: 0.45 },
  { pos: [-55, 85, -395], scale: 3.4, speed: -0.14 },
  { pos: [42, 51, -455], scale: 1.7, speed: 0.3 },
  { pos: [-22, 76, -515], scale: 2.4, speed: -0.39 },
  { pos: [35, 63, -575], scale: 4.5, speed: 0.05 },
  { pos: [-48, 49, -625], scale: 0.4, speed: -0.58 },
  { pos: [58, 71, -185], scale: 1.3, speed: 0.5 },
  { pos: [-32, 84, -425], scale: 3.6, speed: -0.21 },
  { pos: [25, 57, -545], scale: 2.2, speed: 0.35 },
  { pos: [-45, 66, -305], scale: 1.9, speed: -0.44 },
  
  // Low level (Y: -45 to -85)
  { pos: [30, -52, -55], scale: 1.4, speed: 0.56 },
  { pos: [-28, -65, -85], scale: 2.5, speed: -0.4 },
  { pos: [42, -48, -145], scale: 0.9, speed: 0.14 },
  { pos: [-22, -72, -205], scale: 3.2, speed: -0.52 },
  { pos: [38, -58, -265], scale: 1.6, speed: 0.32 },
  { pos: [-48, -80, -325], scale: 4.0, speed: -0.09 },
  { pos: [18, -85, -385], scale: 1.1, speed: 0.57 },
  { pos: [-35, -50, -445], scale: 2.0, speed: -0.24 },
  { pos: [52, -68, -505], scale: 3.3, speed: 0.38 },
  { pos: [-20, -75, -565], scale: 0.6, speed: -0.47 },
  { pos: [35, -45, -605], scale: 2.7, speed: 0.1 },
  { pos: [-55, -62, -160], scale: 1.7, speed: -0.33 },
  { pos: [15, -78, -355], scale: 0.5, speed: 0.53 },
  { pos: [-38, -84, -485], scale: 3.9, speed: -0.17 },
  { pos: [48, -55, -35], scale: 1.0, speed: 0.42 },
  { pos: [-45, -67, -65], scale: 2.3, speed: -0.26 },
  { pos: [25, -82, -105], scale: 0.7, speed: 0.41 },
  { pos: [-12, -46, -165], scale: 4.6, speed: -0.05 },
  { pos: [55, -70, -225], scale: 1.5, speed: 0.26 },
  { pos: [-32, -54, -275], scale: 2.8, speed: -0.55 },
  { pos: [22, -64, -325], scale: 0.8, speed: 0.46 },
  { pos: [-58, -88, -385], scale: 3.6, speed: -0.12 },
  { pos: [45, -49, -445], scale: 1.8, speed: 0.27 },
  { pos: [-25, -73, -505], scale: 2.2, speed: -0.37 },
  { pos: [32, -60, -565], scale: 5.0, speed: 0.03 },
  { pos: [-42, -47, -615], scale: 0.4, speed: -0.6 },
  { pos: [60, -76, -175], scale: 1.2, speed: 0.49 },
  { pos: [-30, -86, -415], scale: 3.4, speed: -0.2 },
  { pos: [28, -53, -535], scale: 2.1, speed: 0.34 },
  { pos: [-50, -69, -295], scale: 2.0, speed: -0.43 }
];

const orbs = [];

const orbData = [
  { pos: [30, 20, -60], size: 1, color: 0x00ffff, pulseSpeed: 0.02 },
  { pos: [-25, -15, -100], size: 5, color: 0xff0044, pulseSpeed: 0.03 },
  { pos: [40, 10, -160], size: 2, color: 0x00ffff, pulseSpeed: 0.015 },
  { pos: [-35, 25, -210], size: 4, color: 0xff0044, pulseSpeed: 0.025 },
  { pos: [20, -20, -280], size: 2.5, color: 0x00ffff, pulseSpeed: 0.018 },
  { pos: [-45, 30, -340], size: 4.5, color: 0xff0044, pulseSpeed: 0.022 },
  { pos: [50, -10, -400], size: 3, color: 0x00ffff, pulseSpeed: 0.028 },
  { pos: [-30, 40, -460], size: 6, color: 0xff0044, pulseSpeed: 0.012 },
  { pos: [35, 15, -530], size: 2, color: 0x00ffff, pulseSpeed: 0.032 },
  { pos: [-50, -25, -590], size: 4, color: 0xff0044, pulseSpeed: 0.02 },
  { pos: [15, 50, -120], size: 3, color: 0x00ffff, pulseSpeed: 0.024 },
  { pos: [-20, -40, -250], size: 3.5, color: 0xff0044, pulseSpeed: 0.016 },
  { pos: [55, 35, -380], size: 2.5, color: 0x00ffff, pulseSpeed: 0.027 },
  { pos: [-40, 60, -500], size: 5, color: 0xff0044, pulseSpeed: 0.014 },
  { pos: [25, -50, -180], size: 3, color: 0x00ffff, pulseSpeed: 0.021 },
  { pos: [-55, 45, -320], size: 4, color: 0xff0044, pulseSpeed: 0.019 },
  { pos: [45, -35, -440], size: 2, color: 0x00ffff, pulseSpeed: 0.026 },
  { pos: [-15, 70, -560], size: 5.5, color: 0xff0044, pulseSpeed: 0.013 }
];

orbData.forEach(function(data) {
  const geometry = new THREE.SphereGeometry(data.size, 16, 16);
  const material = new THREE.MeshBasicMaterial({ 
    color: data.color,
    transparent: true,
    opacity: 0.8
  });
  const orb = new THREE.Mesh(geometry, material);
  orb.position.set(data.pos[0], data.pos[1], data.pos[2]);
  orb.userData.pulseSpeed = data.pulseSpeed;
  orb.userData.baseSize = data.size;
  scene.add(orb);
  orbs.push(orb);
});

function animate() {
  requestAnimationFrame(animate);
  
  glitchUniforms.time.value += 0.016;
  
  eyes.forEach(function(eye) {
    eye.rotation.y += eye.userData.speed;
  });
  
  controls.update();
  
  // Render scene to texture
  //renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  
  // Apply glitch effect
  //renderer.setRenderTarget(null);
  //glitchUniforms.tDiffuse.value = renderTarget.texture;
  //renderer.render(postScene, postCamera);

  orbs.forEach(function(orb) {
  const pulse = Math.sin(glitchUniforms.time.value * orb.userData.pulseSpeed * 60) * 0.3 + 1;
  const size = orb.userData.baseSize * pulse;
  orb.scale.set(pulse, pulse, pulse);
});
}
animate();
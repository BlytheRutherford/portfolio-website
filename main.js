import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.002, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;

window.addEventListener('wheel', function(e) {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  
  const speed = e.deltaY * 0.02;
  camera.position.addScaledVector(direction, -speed);
  controls.target.addScaledVector(direction, -speed);
});
const light = new THREE.DirectionalLight(0xffffff, 10);
light.position.set(5, 10, 7);
scene.add(light);
const textureLoader = new THREE.TextureLoader();
const faceTexture = textureLoader.load('./textures/Face_Base_color.png')
const teethTexture = textureLoader.load('./textures/Teeth_Base_color.png')
const loader = new GLTFLoader();
loader.load('./models/felix_the_cat.glb', function(gltf) {
    gltf.scene.scale.set(0.005, 0.005, 0.005);
    gltf.scene.position.set(-8, 0, 0);
    scene.add(gltf.scene);
})

loader.load('./models/animated_dragon.glb', function(gltf) {
    gltf.scene.scale.set(15, 15, 15);
    gltf.scene.position.set(6, 8, -40);
    scene.add(gltf.scene);
});

loader.load('./models/angel.glb', function(gltf) {
    gltf.scene.scale.set(200, 200, 200);
    gltf.scene.position.set(-10, 2, -80);
    scene.add(gltf.scene);
});

loader.load('./models/mycena.glb', function(gltf) {
    gltf.scene.scale.set(2, 2, 2);
    gltf.scene.position.set(5, 1, -130);
    scene.add(gltf.scene);
});

loader.load('./models/demon_head.glb', function(gltf) {
    gltf.scene.scale.set(2, 2, 2);
    gltf.scene.position.set(-5, 4, -170);
    scene.add(gltf.scene);
});

loader.load('./models/dark_winged_demon.glb', function(gltf) {
    gltf.scene.scale.set(50, 50, 50);
    gltf.scene.position.set(10, 6, -220);
    scene.add(gltf.scene);
});

loader.load('./models/hand_monster.glb', function(gltf) {
    gltf.scene.scale.set(8, 8, 8);
    gltf.scene.position.set(-8, -3, -270);
    scene.add(gltf.scene);
});

loader.load('./models/strego.glb', function(gltf) {
    gltf.scene.scale.set(.5, .5, .5);
    gltf.scene.position.set(7, 2, -320);
    scene.add(gltf.scene);
});

loader.load('./models/thefuture.glb', function(gltf) {
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.position.set(-12, 5, -370);
    scene.add(gltf.scene);
});

loader.load('./models/toad.glb', function(gltf) {
    gltf.scene.scale.set(.05, .05, .05);
    gltf.scene.position.set(6, 0, -420);
    scene.add(gltf.scene);
});

loader.load('./models/plague_doctor.glb', function(gltf) {
    gltf.scene.scale.set(6, 6, 6);
    gltf.scene.position.set(-10, 3, -470);
    scene.add(gltf.scene);
});

loader.load('./models/corgi.glb', function(gltf) {
    gltf.scene.scale.set(20, 20, 20);
    gltf.scene.position.set(-6, 0, -570);
    scene.add(gltf.scene);
});

loader.load('./models/frame.glb', function(gltf) {
    gltf.scene.scale.set(10, 10, 10);
    gltf.scene.position.set(0, 0, -620);
    scene.add(gltf.scene);
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

// Kinect particle figure
const video = document.getElementById('kinect-video');
const kinectTexture = new THREE.VideoTexture(video);
kinectTexture.minFilter = THREE.NearestFilter;
kinectTexture.generateMipmaps = false;

const kinectWidth = 640, kinectHeight = 480;

const kinectGeometry = new THREE.BufferGeometry();
const vertices = new Float32Array(kinectWidth * kinectHeight * 3);

for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
  vertices[i] = j % kinectWidth;
  vertices[i + 1] = Math.floor(j / kinectWidth);
}

kinectGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

const kinectMaterial = new THREE.ShaderMaterial({
  uniforms: {
    'map': { value: kinectTexture },
    'width': { value: kinectWidth },
    'height': { value: kinectHeight },
    'nearClipping': { value: 850 },
    'farClipping': { value: 4000 },
    'pointSize': { value: 2 },
    'zOffset': { value: 1000 }
  },
  vertexShader: document.getElementById('kinect-vs').textContent,
  fragmentShader: document.getElementById('kinect-fs').textContent,
  blending: THREE.AdditiveBlending,
  depthTest: false,
  depthWrite: false,
  transparent: true
});

const kinectMesh = new THREE.Points(kinectGeometry, kinectMaterial);
kinectMesh.position.set(0, 0, -30);
kinectMesh.scale.set(0.01, 0.01, 0.01);
scene.add(kinectMesh);

video.play();

function animate() {
  requestAnimationFrame(animate);
  
  glitchUniforms.time.value += 0.016;
  
  eyes.forEach(function(eye) {
    eye.rotation.y += eye.userData.speed;
  });
  
  controls.update();
  
  // Render scene to texture
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  
  // Apply glitch effect
  renderer.setRenderTarget(null);
  glitchUniforms.tDiffuse.value = renderTarget.texture;
  renderer.render(postScene, postCamera);

  orbs.forEach(function(orb) {
  const pulse = Math.sin(glitchUniforms.time.value * orb.userData.pulseSpeed * 60) * 0.3 + 1;
  const size = orb.userData.baseSize * pulse;
  orb.scale.set(pulse, pulse, pulse);
});
}
animate();
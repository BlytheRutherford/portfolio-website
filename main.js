import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
const scene = new THREE.Scene();
// Glitchy background
// Render target for post-processing
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const mixers = [];
const clock = new THREE.Clock();
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
      
      // Random value that changes every ~2 seconds
      float glitchRoll = random(vec2(floor(time * 0.5), 0.0));
      
      // 0.0-0.5 = normal, 0.5-0.75 = subtle, 0.75-1.0 = full burst
      float intensity;
      float colorIntensity;
      
      if (glitchRoll < 0.5) {
        // Normal - no effect
        gl_FragColor = texture2D(tDiffuse, uv);
        return;
      } else if (glitchRoll < 0.75) {
        // Subtle
        intensity = 0.2;
        colorIntensity = 0.15;
      } else {
        // Full burst
        intensity = 1.0;
        colorIntensity = 0.7;
      }
      
      // Heavy glitch displacement
      float glitchLine = step(0.9, random(vec2(floor(time * 1.5), floor(uv.y * 30.0))));
      uv.x += (random(vec2(time * 0.2, uv.y * 10.0)) - 0.5) * 0.15 * glitchLine * intensity;
      
      // Block glitches
      float blockGlitch = step(0.92, random(vec2(floor(uv.x * 10.0), floor(time * 0.8))));
      uv.y += (random(vec2(uv.x, time)) - 0.5) * 0.1 * blockGlitch * intensity;
      
      // Split amount
      float splitAmount = 0.005 + random(vec2(floor(time * 5.0), 0.0)) * 0.01 * intensity;
      splitAmount += glitchLine * 0.06 * intensity;
      
      // Sample left, center, right
      vec3 left = texture2D(tDiffuse, vec2(uv.x + splitAmount, uv.y)).rgb;
      vec3 center = texture2D(tDiffuse, uv).rgb;
      vec3 right = texture2D(tDiffuse, vec2(uv.x - splitAmount, uv.y)).rgb;
      
      // Convert to luminance
      float leftLuma = dot(left, vec3(0.299, 0.587, 0.114));
      float rightLuma = dot(right, vec3(0.299, 0.587, 0.114));
      
      // Cyan and red
      vec3 cyan = vec3(0.0, 1.0, 1.0);
      vec3 red = vec3(1.0, 0.0, 0.0);
      
      vec3 color = center;
      color += cyan * leftLuma * colorIntensity;
      color += red * rightLuma * colorIntensity;
      
      // Noise only during full burst
      if (glitchRoll >= 0.75) {
        float noise = random(uv + time) * 0.05;
        color += noise;
      }
      
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
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 8000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;

window.addEventListener('wheel', function(e) {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  
  const speed = e.deltaY * .05;
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
  { name: 'felix_the_cat', file: './models/felix_the_cat.glb', scale: 0.01, pos: [-8, -1109.4, 1311], rot: [0, 2.53, 0] },
  { name: 'angel', file: './models/angel.glb', scale: 10000, pos: [-1566.6, -1555, 1487.4], rot: [0, 5.59, 0] },
  { name: 'mycena', file: './models/mycena.glb', scale: 179, pos: [513.4, 458, -95], rot: [0, 5.36, 0] },
  { name: 'demon_head', file: './models/demon_head.glb', scale: 163, pos: [-2046.7, -1800.9, -1309.2], rot: [0, 1.55, 0] },
  { name: 'dark_winged_demon', file: './models/dark_winged_demon.glb', scale: 2000, pos: [-2046.7, -901.8, 1886.9], rot: [0, 0.41, 0] },
  { name: 'strego', file: './models/strego.glb', scale: 13, pos: [195.8, -135.099, -305.6] },
  { name: 'thefuture', file: './models/thefuture.glb', scale: 30, pos: [-2013, 87.8000000000011, 389], rot: [4.89, 3.19, 1.49] },
  { name: 'toad', file: './models/toad.glb', scale: 4, pos: [-79.89, -1800.9, -3767.7], rot: [0, 1.38, 0] },
  { name: 'plague_doctor', file: './models/plague_doctor.glb', scale: 127, pos: [657.6, -571.6, -1063.3], rot: [0, 5.19, 0] },
  { name: 'corgi', file: './models/corgi.glb', scale: 181, pos: [1442, 165.9, 2132.8], rot: [0, 2.5, 0] },
  { name: 'frame', file: './models/frame.glb', scale: 88, pos: [1303.5, 165.9, 2132], rot: [0, 5.9, 0] },
  { name: 'space', file: './models/space.glb', scale: 150, pos: [0, 0, -100] }
];

models.forEach(function(config) {
  loader.load(config.file, function(gltf) {
    const model = gltf.scene;
    model.scale.set(config.scale, config.scale, config.scale);
    model.position.set(config.pos[0], config.pos[1], config.pos[2]);

    // Apply rotation if defined
    if (config.rot) {
      model.rotation.set(config.rot[0], config.rot[1], config.rot[2]);
    }

    scene.add(model);

    // Play animations if model has them
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach(function(clip) {
        mixer.clipAction(clip).play();
      })
      mixers.push(mixer);
    }
    
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

// Mouth with special animation handling
let mouthMixer = null;
let mouthAction = null;
let mouthPhase = 'waiting';
let mouthTime = 0;
let mouthDirection = 1;

loader.load('./models/mouth.glb', function(gltf) {
  const mouth = gltf.scene;
  mouth.scale.set(10, 10, 10);
  mouth.position.set(0, -0.699999999999636, 3.40000000000036);
  scene.add(mouth);
  
  if (gltf.animations.length > 0) {
    console.log('Animation count:', gltf.animations.length);
    console.log('Animation duration:', gltf.animations[0].duration);

    mouthMixer = new THREE.AnimationMixer(mouth);

    // Play ALL animations, not just the first one
    gltf.animations.forEach(function(clip) {
      const action = mouthMixer.clipAction(clip);
      action.play();
      action.paused = true;
    });

    mouthAction = mouthMixer.clipAction(gltf.animations[0]);
    mouthAction.play();
    mouthAction.paused = true;
  }

  // Add GUI for mouth
  const settings = { scale: 10 };
  const folder = gui.addFolder('mouth');
  folder.add(mouth.position, 'x', -10000, 10000).step(0.1).name('pos X');
  folder.add(mouth.position, 'y', -10000, 10000).step(0.1).name('pos Y');
  folder.add(mouth.position, 'z', -10000, 10000).step(0.1).name('pos Z');
  folder.add(mouth.rotation, 'x', 0, Math.PI * 2).step(0.01).name('rot X');
  folder.add(mouth.rotation, 'y', 0, Math.PI * 2).step(0.01).name('rot Y');
  folder.add(mouth.rotation, 'z', 0, Math.PI * 2).step(0.01).name('rot Z');
  folder.add(settings, 'scale', 0.001, 500).step(0.1).onChange(function(v) {
    mouth.scale.set(v, v, v);
  });
});

function openMouth() {
  if (mouthMixer) {
    mouthMixer._actions.forEach(function(action) {
      action.paused = false;
    });
    mouthPhase = 'opening';
  }
}

window.openMouth = openMouth; // Added line to open mouth in console log

let dragon = null;
let dragonPath = null;
let dragonProgress = 0;

loader.load('./models/animated_dragon.glb', function(gltf) {
  dragon = gltf.scene;
  dragon.scale.set(297, 297, 297);
  scene.add(dragon);
  
  if (gltf.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(dragon);
    gltf.animations.forEach(function(clip) {
      mixer.clipAction(clip).play();
    });
    mixers.push(mixer);
  }
  
  // Simple circular flight path
dragonPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-700, -300, -1800),
  new THREE.Vector3(0, -200, -1500),
  new THREE.Vector3(700, -300, -1800),
  new THREE.Vector3(0, -400, -2100),
  new THREE.Vector3(-700, -300, -1800)
]);
dragonPath.closed = true;
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
  // Close range (near models)
  { pos: [800, 200, -500], scale: 12, speed: 0.08 },
  { pos: [-1200, -400, -1200], scale: 3, speed: -0.12 },
  { pos: [1800, 100, 1500], scale: 25, speed: 0.05 },
  { pos: [-500, -1200, -2800], scale: 8, speed: -0.15 },
  { pos: [300, 400, 800], scale: 2, speed: 0.18 },
  { pos: [-1800, -800, -600], scale: 18, speed: -0.06 },
  { pos: [1200, -300, -2000], scale: 5, speed: 0.22 },
  { pos: [-900, 300, 1800], scale: 30, speed: -0.04 },
  { pos: [600, -1500, -3200], scale: 10, speed: 0.09 },
  { pos: [-1500, -100, 400], scale: 1.5, speed: -0.25 },
  { pos: [1000, -900, -1500], scale: 22, speed: 0.07 },
  { pos: [-300, 350, -200], scale: 4, speed: -0.14 },
  { pos: [1600, -600, 1000], scale: 15, speed: 0.11 },
  { pos: [-2000, -1400, -2500], scale: 6, speed: -0.08 },
  { pos: [400, 250, 1200], scale: 35, speed: 0.03 },
  { pos: [-700, -1700, -3500], scale: 9, speed: -0.16 },
  { pos: [1400, 50, -800], scale: 2.5, speed: 0.2 },
  { pos: [-1100, -500, 600], scale: 20, speed: -0.05 },
  { pos: [200, -200, -1800], scale: 7, speed: 0.13 },
  { pos: [-1600, 200, 1400], scale: 40, speed: -0.03 },
  { pos: [900, -1100, -2600], scale: 11, speed: 0.1 },
  { pos: [-400, -50, -100], scale: 3.5, speed: -0.19 },
  { pos: [1100, 380, 2000], scale: 28, speed: 0.06 },
  { pos: [-1900, -1600, -1000], scale: 5.5, speed: -0.11 },
  { pos: [500, -800, 300], scale: 16, speed: 0.15 },
  { pos: [-200, 150, -2200], scale: 8.5, speed: -0.07 },
  { pos: [1700, -400, -400], scale: 1, speed: 0.28 },
  { pos: [-1400, -1000, 1600], scale: 45, speed: -0.02 },
  { pos: [700, 420, -3000], scale: 13, speed: 0.08 },
  { pos: [-800, -1300, -700], scale: 4.5, speed: -0.17 },
  { pos: [1500, -150, 700], scale: 24, speed: 0.04 },
  { pos: [-600, 280, -1600], scale: 6.5, speed: -0.13 },
  { pos: [100, -700, 1900], scale: 32, speed: 0.05 },
  { pos: [-1700, -200, -2100], scale: 7.5, speed: -0.09 },
  { pos: [1300, 320, -300], scale: 2, speed: 0.24 },
  { pos: [-1000, -1500, 200], scale: 19, speed: -0.06 },
  { pos: [800, -450, -2400], scale: 14, speed: 0.1 },
  { pos: [-150, 100, 1100], scale: 50, speed: -0.02 },
  { pos: [1900, -1200, -1400], scale: 9.5, speed: 0.12 },
  { pos: [-1300, 50, -500], scale: 3, speed: -0.21 },
  { pos: [450, -350, -900], scale: 17, speed: 0.07 },
  { pos: [-850, 420, 950], scale: 6, speed: -0.14 },
  { pos: [1650, -800, -2700], scale: 38, speed: 0.04 },
  { pos: [-1150, -650, -350], scale: 2.5, speed: -0.18 },
  { pos: [350, 180, 1650], scale: 21, speed: 0.09 },
  { pos: [-1850, -1100, -1850], scale: 11, speed: -0.07 },
  { pos: [1050, 50, 450], scale: 4, speed: 0.16 },
  { pos: [-550, -280, -2950], scale: 33, speed: -0.03 },
  { pos: [750, -1350, 150], scale: 8, speed: 0.11 },
  { pos: [-1650, 320, -750], scale: 1.5, speed: -0.23 },
  
  // Mid-distance
  { pos: [2500, -500, 2500], scale: 27, speed: 0.05 },
  { pos: [-2500, -900, -3500], scale: 5, speed: -0.12 },
  { pos: [2800, 280, -550], scale: 42, speed: 0.03 },
  { pos: [-2800, -1700, 2500], scale: 9, speed: -0.1 },
  { pos: [3000, -180, -4000], scale: 15, speed: 0.08 },
  { pos: [-3000, 150, 3000], scale: 3.5, speed: -0.15 },
  { pos: [2600, -600, -650], scale: 23, speed: 0.06 },
  { pos: [-2600, -350, -3500], scale: 7, speed: -0.09 },
  { pos: [2900, 400, 2800], scale: 1, speed: 0.26 },
  { pos: [-2900, -1450, -2000], scale: 36, speed: -0.04 },
  { pos: [3200, -1050, 1500], scale: 12, speed: 0.1 },
  { pos: [-3200, 80, -4500], scale: 4.5, speed: -0.17 },
  { pos: [2700, -220, 3200], scale: 29, speed: 0.05 },
  { pos: [-2700, -780, -1500], scale: 6.5, speed: -0.11 },
  { pos: [3100, 250, -2800], scale: 18, speed: 0.07 },
  { pos: [-3100, -1200, 3500], scale: 2, speed: -0.2 },
  { pos: [2400, -400, 1800], scale: 44, speed: 0.03 },
  { pos: [-2400, 380, -5000], scale: 10, speed: -0.08 },
  { pos: [3300, -950, -1200], scale: 5.5, speed: 0.14 },
  { pos: [-3300, -150, 2200], scale: 26, speed: -0.05 },
  
  // Far distance (like distant stars)
  { pos: [4500, 800, -5500], scale: 55, speed: 0.02 },
  { pos: [-4500, -2000, 4000], scale: 60, speed: -0.02 },
  { pos: [5000, -1500, 5000], scale: 48, speed: 0.03 },
  { pos: [-5000, 1200, -6000], scale: 52, speed: -0.03 },
  { pos: [4800, 500, -4000], scale: 65, speed: 0.02 },
  { pos: [-4800, -800, 5500], scale: 58, speed: -0.02 },
  { pos: [5500, -2200, -5000], scale: 70, speed: 0.01 },
  { pos: [-5500, 1500, 4500], scale: 45, speed: -0.03 },
  { pos: [4200, 1000, 6000], scale: 62, speed: 0.02 },
  { pos: [-4200, -2500, -4500], scale: 50, speed: -0.02 },
  { pos: [5800, -500, 3500], scale: 75, speed: 0.01 },
  { pos: [-5800, 2000, -5500], scale: 68, speed: -0.01 },
  { pos: [4000, -1800, -6500], scale: 55, speed: 0.02 },
  { pos: [-4000, 800, 6500], scale: 72, speed: -0.02 },
  { pos: [6000, 300, -3500], scale: 80, speed: 0.01 },
  { pos: [-6000, -1200, 5000], scale: 60, speed: -0.02 },
  { pos: [5200, -2800, 4000], scale: 65, speed: 0.02 },
  { pos: [-5200, 1800, -7000], scale: 85, speed: -0.01 },
  { pos: [4600, 600, 5500], scale: 58, speed: 0.02 },
  { pos: [-4600, -900, -5800], scale: 70, speed: -0.02 },
  { pos: [6500, -1000, -4200], scale: 90, speed: 0.01 },
  { pos: [-6500, 2500, 6000], scale: 78, speed: -0.01 },
  { pos: [5600, 1500, -6800], scale: 82, speed: 0.01 },
  { pos: [-5600, -2200, 3800], scale: 55, speed: -0.02 },
  { pos: [4400, -700, 7000], scale: 95, speed: 0.01 },
  { pos: [-4400, 1000, -4800], scale: 62, speed: -0.02 },
  { pos: [7000, 200, 4800], scale: 88, speed: 0.01 },
  { pos: [-7000, -1800, -6200], scale: 75, speed: -0.01 },
  { pos: [5900, -2500, -5200], scale: 68, speed: 0.02 },
  { pos: [-5900, 2200, 5800], scale: 100, speed: -0.01 },
  
  // Original mid-range continued
  { pos: [1850, -500, 1250], scale: 27, speed: 0.05 },
  { pos: [-250, -900, -1150], scale: 5, speed: -0.12 },
  { pos: [550, 280, -550], scale: 42, speed: 0.03 },
  { pos: [-1450, -1700, 750], scale: 9, speed: -0.1 },
  { pos: [1250, -180, -3350], scale: 15, speed: 0.08 },
  { pos: [-950, 150, 1950], scale: 3.5, speed: -0.15 },
  { pos: [150, -600, -650], scale: 23, speed: 0.06 },
  { pos: [-1750, -350, -2350], scale: 7, speed: -0.09 },
  { pos: [950, 400, 550], scale: 1, speed: 0.26 },
  { pos: [-650, -1450, 1350], scale: 36, speed: -0.04 },
  { pos: [1550, -1050, -1950], scale: 12, speed: 0.1 },
  { pos: [-350, 80, -1350], scale: 4.5, speed: -0.17 },
  { pos: [650, -220, 2050], scale: 29, speed: 0.05 },
  { pos: [-1550, -780, -450], scale: 6.5, speed: -0.11 },
  { pos: [1150, 250, -2550], scale: 18, speed: 0.07 },
  { pos: [-50, -1200, 50], scale: 2, speed: -0.2 },
  { pos: [1750, -400, 850], scale: 44, speed: 0.03 },
  { pos: [-1050, 380, -2750], scale: 10, speed: -0.08 },
  { pos: [250, -950, -1050], scale: 5.5, speed: 0.14 },
  { pos: [-1950, -150, 1550], scale: 26, speed: -0.05 },
  { pos: [850, 120, -150], scale: 3, speed: 0.19 },
  { pos: [-450, -580, -3650], scale: 34, speed: -0.04 },
  { pos: [1350, -1300, 1750], scale: 8.5, speed: 0.09 },
  { pos: [-1250, -20, -950], scale: 1.5, speed: -0.22 },
  { pos: [50, 350, 250], scale: 20, speed: 0.06 },
  { pos: [-750, -1600, -1650], scale: 13, speed: -0.1 },
  { pos: [1450, -680, -2150], scale: 48, speed: 0.02 },
  { pos: [-150, 200, 1450], scale: 7.5, speed: -0.13 },
  { pos: [950, -480, -50], scale: 4, speed: 0.15 },
  { pos: [-1350, -880, 650], scale: 31, speed: -0.05 },
  { pos: [550, 450, -3150], scale: 9.5, speed: 0.08 },
  { pos: [-1850, -1250, -550], scale: 2.5, speed: -0.16 },
  { pos: [1650, 30, 1050], scale: 22, speed: 0.06 },
  { pos: [-650, 280, -1850], scale: 6, speed: -0.12 },
  { pos: [350, -1100, 1850], scale: 37, speed: 0.04 },
  { pos: [-1550, -420, -2650], scale: 11, speed: -0.08 },
  { pos: [1150, -200, 350], scale: 1, speed: 0.25 },
  { pos: [-950, 100, -250], scale: 16, speed: -0.07 },
  { pos: [750, -750, -1250], scale: 43, speed: 0.03 },
  { pos: [-250, -1400, 950], scale: 5, speed: -0.14 },
  { pos: [1850, 180, -850], scale: 24, speed: 0.06 },
  { pos: [-1150, -580, -3050], scale: 8, speed: -0.1 },
  { pos: [450, 320, 1150], scale: 3.5, speed: 0.17 },
  { pos: [-1750, -950, 1650], scale: 39, speed: -0.03 },
  { pos: [1050, -1500, -1750], scale: 10, speed: 0.09 },
  { pos: [-550, 50, -650], scale: 2, speed: -0.19 },
  { pos: [150, -320, 2150], scale: 28, speed: 0.05 },
  { pos: [-1450, 400, -1450], scale: 7, speed: -0.11 },
  { pos: [1350, -850, 550], scale: 46, speed: 0.02 },
  { pos: [-850, -180, -2450], scale: 4.5, speed: -0.13 },
  { pos: [650, 150, -350], scale: 19, speed: 0.07 },
  { pos: [-50, -1050, 450], scale: 12, speed: -0.09 },
  { pos: [1550, -550, -2850], scale: 3, speed: 0.16 },
  { pos: [-1650, -1350, 1250], scale: 35, speed: -0.04 },
  { pos: [950, 280, 750], scale: 6.5, speed: 0.12 },
  { pos: [-350, -680, -1550], scale: 1.5, speed: -0.21 },
  { pos: [1750, -1200, 1950], scale: 25, speed: 0.05 },
  { pos: [-1250, 220, -50], scale: 9, speed: -0.1 },
  { pos: [250, -420, -950], scale: 41, speed: 0.03 },
  { pos: [-950, -1550, -3450], scale: 5.5, speed: -0.12 },
  { pos: [1250, 80, 150], scale: 14, speed: 0.08 },
  { pos: [-650, 350, 1750], scale: 2.5, speed: -0.18 },
  { pos: [550, -880, -2050], scale: 32, speed: 0.04 },
  { pos: [-1950, -250, -1250], scale: 8.5, speed: -0.08 },
  { pos: [850, -50, 650], scale: 4, speed: 0.14 },
  { pos: [-450, -1150, 50], scale: 47, speed: -0.02 },
  { pos: [1450, 400, -1650], scale: 11, speed: 0.09 },
  { pos: [-1050, -750, -750], scale: 3.5, speed: -0.15 },
  { pos: [50, 180, 1350], scale: 21, speed: 0.06 },
  { pos: [-1350, -1700, -2250], scale: 6, speed: -0.11 },
  { pos: [1650, -980, 1550], scale: 38, speed: 0.04 },
  { pos: [-750, 120, -2950], scale: 1, speed: -0.24 }
];

const orbs = [];

const orbData = [
  // Close range
  { pos: [600, 150, -400], size: 15, color: 0x00ffff, pulseSpeed: 0.02 },
  { pos: [-1000, -600, -1500], size: 40, color: 0xff0044, pulseSpeed: 0.015 },
  { pos: [1400, -200, 1200], size: 8, color: 0x00ffff, pulseSpeed: 0.025 },
  { pos: [-400, 300, 600], size: 25, color: 0xff0044, pulseSpeed: 0.018 },
  { pos: [200, -1400, -2600], size: 50, color: 0x00ffff, pulseSpeed: 0.012 },
  { pos: [-1600, -900, -800], size: 12, color: 0xff0044, pulseSpeed: 0.022 },
  { pos: [1000, 400, 1800], size: 35, color: 0x00ffff, pulseSpeed: 0.016 },
  { pos: [-800, -300, -2000], size: 18, color: 0xff0044, pulseSpeed: 0.02 },
  { pos: [1800, -700, -200], size: 60, color: 0x00ffff, pulseSpeed: 0.01 },
  { pos: [-1200, 200, 1000], size: 22, color: 0xff0044, pulseSpeed: 0.019 },
  { pos: [300, -1100, -3200], size: 30, color: 0x00ffff, pulseSpeed: 0.014 },
  { pos: [-1900, -1600, 400], size: 45, color: 0xff0044, pulseSpeed: 0.013 },
  { pos: [800, 50, 200], size: 10, color: 0x00ffff, pulseSpeed: 0.024 },
  { pos: [-500, -800, -1200], size: 55, color: 0xff0044, pulseSpeed: 0.011 },
  { pos: [1600, -350, 1500], size: 20, color: 0x00ffff, pulseSpeed: 0.018 },
  { pos: [-1400, 150, -600], size: 32, color: 0xff0044, pulseSpeed: 0.015 },
  { pos: [400, -950, -2800], size: 48, color: 0x00ffff, pulseSpeed: 0.012 },
  { pos: [-200, 350, 800], size: 14, color: 0xff0044, pulseSpeed: 0.021 },
  { pos: [1200, -500, 400], size: 38, color: 0x00ffff, pulseSpeed: 0.014 },
  { pos: [-1800, -1200, -1800], size: 26, color: 0xff0044, pulseSpeed: 0.017 },
  
  // Mid-distance
  { pos: [2800, 280, 2500], size: 52, color: 0x00ffff, pulseSpeed: 0.011 },
  { pos: [-2800, -450, -3200], size: 16, color: 0xff0044, pulseSpeed: 0.02 },
  { pos: [3200, -1000, 1800], size: 42, color: 0x00ffff, pulseSpeed: 0.013 },
  { pos: [-3200, 100, -2500], size: 28, color: 0xff0044, pulseSpeed: 0.016 },
  { pos: [2500, -650, 3500], size: 58, color: 0x00ffff, pulseSpeed: 0.01 },
  { pos: [-2500, -200, -4000], size: 11, color: 0xff0044, pulseSpeed: 0.023 },
  { pos: [3000, 420, 2000], size: 36, color: 0x00ffff, pulseSpeed: 0.015 },
  { pos: [-3000, -1350, -1500], size: 44, color: 0xff0044, pulseSpeed: 0.013 },
  { pos: [2600, -150, 4000], size: 19, color: 0x00ffff, pulseSpeed: 0.019 },
  { pos: [-2600, 250, -3800], size: 54, color: 0xff0044, pulseSpeed: 0.011 },
  { pos: [3500, -780, 2800], size: 24, color: 0x00ffff, pulseSpeed: 0.017 },
  { pos: [-3500, -1500, -2800], size: 33, color: 0xff0044, pulseSpeed: 0.015 },
  { pos: [2900, 180, 3200], size: 46, color: 0x00ffff, pulseSpeed: 0.012 },
  { pos: [-2900, -550, -4500], size: 13, color: 0xff0044, pulseSpeed: 0.022 },
  { pos: [3300, -880, 1500], size: 56, color: 0x00ffff, pulseSpeed: 0.01 },
  { pos: [-3300, 80, -2000], size: 21, color: 0xff0044, pulseSpeed: 0.018 },
  
  // Far distance (distant glowing stars)
  { pos: [4500, 600, -5000], size: 70, color: 0x00ffff, pulseSpeed: 0.008 },
  { pos: [-4500, -1800, 4500], size: 85, color: 0xff0044, pulseSpeed: 0.007 },
  { pos: [5000, -1200, 5500], size: 65, color: 0x00ffff, pulseSpeed: 0.009 },
  { pos: [-5000, 1500, -5500], size: 90, color: 0xff0044, pulseSpeed: 0.006 },
  { pos: [5500, 800, -4500], size: 78, color: 0x00ffff, pulseSpeed: 0.008 },
  { pos: [-5500, -2200, 5000], size: 72, color: 0xff0044, pulseSpeed: 0.008 },
  { pos: [6000, -500, 6000], size: 95, color: 0x00ffff, pulseSpeed: 0.006 },
  { pos: [-6000, 2000, -6000], size: 80, color: 0xff0044, pulseSpeed: 0.007 },
  { pos: [4800, 1200, -6500], size: 88, color: 0x00ffff, pulseSpeed: 0.007 },
  { pos: [-4800, -900, 6500], size: 68, color: 0xff0044, pulseSpeed: 0.009 },
  { pos: [5800, -2500, 4000], size: 100, color: 0x00ffff, pulseSpeed: 0.005 },
  { pos: [-5800, 1800, -4000], size: 75, color: 0xff0044, pulseSpeed: 0.008 },
  { pos: [6500, 300, -5800], size: 82, color: 0x00ffff, pulseSpeed: 0.007 },
  { pos: [-6500, -1500, 5800], size: 92, color: 0xff0044, pulseSpeed: 0.006 },
  { pos: [5200, -700, 7000], size: 105, color: 0x00ffff, pulseSpeed: 0.005 },
  { pos: [-5200, 2500, -7000], size: 85, color: 0xff0044, pulseSpeed: 0.007 },
  { pos: [7000, 1000, -4800], size: 110, color: 0x00ffff, pulseSpeed: 0.004 },
  { pos: [-7000, -2000, 4800], size: 98, color: 0xff0044, pulseSpeed: 0.006 },
  { pos: [4200, -1800, 6800], size: 75, color: 0x00ffff, pulseSpeed: 0.008 },
  { pos: [-4200, 800, -6800], size: 88, color: 0xff0044, pulseSpeed: 0.007 },
  
  // Original close/mid continued
  { pos: [600, 280, 1600], size: 52, color: 0x00ffff, pulseSpeed: 0.011 },
  { pos: [-900, -450, -2400], size: 16, color: 0xff0044, pulseSpeed: 0.02 },
  { pos: [1700, -1000, -100], size: 42, color: 0x00ffff, pulseSpeed: 0.013 },
  { pos: [-100, 100, 1200], size: 28, color: 0xff0044, pulseSpeed: 0.016 },
  { pos: [1000, -650, -3400], size: 58, color: 0x00ffff, pulseSpeed: 0.01 },
  { pos: [-1500, -200, 600], size: 11, color: 0xff0044, pulseSpeed: 0.023 },
  { pos: [200, 420, -800], size: 36, color: 0x00ffff, pulseSpeed: 0.015 },
  { pos: [-700, -1350, -400], size: 44, color: 0xff0044, pulseSpeed: 0.013 },
  { pos: [1400, -150, 2000], size: 19, color: 0x00ffff, pulseSpeed: 0.019 },
  { pos: [-1100, 250, -1400], size: 54, color: 0xff0044, pulseSpeed: 0.011 },
  { pos: [500, -780, 100], size: 24, color: 0x00ffff, pulseSpeed: 0.017 },
  { pos: [-1700, -1500, -2200], size: 33, color: 0xff0044, pulseSpeed: 0.015 },
  { pos: [900, 180, 900], size: 46, color: 0x00ffff, pulseSpeed: 0.012 },
  { pos: [-300, -550, 1400], size: 13, color: 0xff0044, pulseSpeed: 0.022 },
  { pos: [1500, -880, -1600], size: 56, color: 0x00ffff, pulseSpeed: 0.01 },
  { pos: [-1300, 80, -200], size: 21, color: 0xff0044, pulseSpeed: 0.018 },
  { pos: [100, -1200, -2000], size: 39, color: 0x00ffff, pulseSpeed: 0.014 },
  { pos: [-600, 380, 1800], size: 29, color: 0xff0044, pulseSpeed: 0.016 },
  { pos: [1800, -400, 700], size: 47, color: 0x00ffff, pulseSpeed: 0.012 },
  { pos: [-1000, -700, -3000], size: 17, color: 0xff0044, pulseSpeed: 0.02 },
  { pos: [700, 320, -1000], size: 62, color: 0x00ffff, pulseSpeed: 0.009 },
  { pos: [-1850, -950, 200], size: 23, color: 0xff0044, pulseSpeed: 0.018 },
  { pos: [350, -320, 1100], size: 41, color: 0x00ffff, pulseSpeed: 0.013 },
  { pos: [-450, 50, -2600], size: 34, color: 0xff0044, pulseSpeed: 0.015 },
  { pos: [1300, -1100, 1700], size: 51, color: 0x00ffff, pulseSpeed: 0.011 },
  { pos: [-1600, 400, -1000], size: 9, color: 0xff0044, pulseSpeed: 0.025 },
  { pos: [800, -580, -500], size: 27, color: 0x00ffff, pulseSpeed: 0.017 },
  { pos: [-200, -1450, -1600], size: 43, color: 0xff0044, pulseSpeed: 0.013 },
  { pos: [1600, 150, 300], size: 16, color: 0x00ffff, pulseSpeed: 0.02 },
  { pos: [-1200, -250, 1500], size: 57, color: 0xff0044, pulseSpeed: 0.01 },
  { pos: [450, 280, -3600], size: 31, color: 0x00ffff, pulseSpeed: 0.015 },
  { pos: [-800, -850, 50], size: 20, color: 0xff0044, pulseSpeed: 0.019 },
  { pos: [1100, -1300, -1200], size: 49, color: 0x00ffff, pulseSpeed: 0.012 },
  { pos: [-1450, 180, -2800], size: 12, color: 0xff0044, pulseSpeed: 0.022 },
  { pos: [50, -420, 1900], size: 37, color: 0x00ffff, pulseSpeed: 0.014 },
  { pos: [-550, 350, -100], size: 53, color: 0xff0044, pulseSpeed: 0.011 },
  { pos: [1750, -750, 1300], size: 18, color: 0x00ffff, pulseSpeed: 0.019 },
  { pos: [-950, -1150, -2100], size: 44, color: 0xff0044, pulseSpeed: 0.013 },
  { pos: [550, 80, 500], size: 26, color: 0x00ffff, pulseSpeed: 0.017 },
  { pos: [-1700, -350, 900], size: 59, color: 0xff0044, pulseSpeed: 0.01 }
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
  
const delta = clock.getDelta();
  
  // Mouth animation logic
  if (mouthMixer && mouthPhase !== 'waiting') {
    if (mouthPhase === 'opening') {
      mouthMixer.update(delta);
      if (mouthAction.time >= 8.58) {
        mouthPhase = 'looping';
        mouthTime = 8.58;
        mouthDirection = -1;
      }
    } else if (mouthPhase === 'looping') {
      mouthTime += delta * mouthDirection;
      
      if (mouthTime >= 8.58) {
        mouthTime = 8.58;
        mouthDirection = -1;
      } else if (mouthTime <= 2.78) {
        mouthTime = 2.78;
        mouthDirection = 1;
      }
      
    mouthMixer._actions.forEach(function(action) {
      action.time = mouthTime;
    });
    mouthMixer.update(0);
    }
  }
  
  // Other model animations
  mixers.forEach(function(mixer) {
    mixer.update(delta);
  });

  // Dragon flight path
if (dragon && dragonPath) {
  dragonProgress += delta * 0.1;
  if (dragonProgress > 1) dragonProgress = 0;
  
  const point = dragonPath.getPointAt(dragonProgress);
  dragon.position.copy(point);
  
  const tangent = dragonPath.getTangentAt(dragonProgress);
  dragon.lookAt(point.clone().add(tangent));
}
  
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
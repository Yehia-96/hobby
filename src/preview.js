import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CARDS } from './cards.js';
import { addLights, mountMonster } from './stage.js';
import { createDuelApp } from './duelApp.js';

// Desktop stand-in for the AR page: the same monsters and duel, on two virtual cards on a
// virtual table, so models and animations can be checked without a phone or a camera.

const CARD_ASPECT = 86 / 59; // Yu-Gi-Oh cards are 59 x 86 mm
const CARD_GAP = 0.9;
const MAX_FRAME_SECONDS = 0.1;

const container = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15122a);
addLights(scene);

const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 50);
camera.position.set(0, 1.9, 3.1);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.45, 0);
controls.enableDamping = true;

const table = new THREE.Mesh(
  new THREE.CircleGeometry(4, 48),
  new THREE.MeshStandardMaterial({ color: 0x241f3d, roughness: 0.9 }),
);
table.rotation.x = -Math.PI / 2;
table.position.y = -0.002;
scene.add(table);

const textures = new THREE.TextureLoader();

const slots = CARDS.map((card, i) => {
  // Same frame MindAR gives an anchor: card in its XY plane, +Z out of the card.
  const anchor = new THREE.Group();
  anchor.rotation.x = -Math.PI / 2;
  anchor.position.x = (i === 0 ? -1 : 1) * CARD_GAP;
  scene.add(anchor);

  const faceMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3360, roughness: 0.6 });
  textures.load(card.image, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    faceMaterial.map = texture;
    faceMaterial.color.set(0xffffff);
    faceMaterial.needsUpdate = true;
  }, undefined, () => console.warn(`No card image at ${card.image}; showing a blank card.`));
  anchor.add(new THREE.Mesh(new THREE.PlaneGeometry(1, CARD_ASPECT), faceMaterial));

  const slot = mountMonster(card);
  anchor.add(slot.stage);
  return { ...slot, anchor };
});

const app = createDuelApp({ scene, slots, hudContainer: document.getElementById('hud') });

const toggles = document.getElementById('toggles');
for (const slot of slots) {
  const label = document.createElement('label');
  label.innerHTML = `<input type="checkbox" checked> ${slot.card.name}`;
  const box = label.querySelector('input');
  box.addEventListener('change', () => {
    slot.anchor.visible = box.checked;
    app.setVisible(slot.card.id, box.checked);
  });
  toggles.appendChild(label);
  app.setVisible(slot.card.id, true);
}

function resize() {
  const { clientWidth: w, clientHeight: h } = container;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), MAX_FRAME_SECONDS);
  app.update(clock.elapsedTime, dt);
  controls.update();
  renderer.render(scene, camera);
});

// Handy for poking at the scene from the dev tools console.
window.preview = { scene, camera, controls, slots };

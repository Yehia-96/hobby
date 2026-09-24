import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { CARDS } from './cards.js';
import { addLights, mountMonster } from './stage.js';
import { createDuelApp } from './duelApp.js';

const TARGETS_URL = 'targets/cards.mind';
const MAX_FRAME_SECONDS = 0.1;

const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start');
const startError = document.getElementById('start-error');
const hudContainer = document.getElementById('hud');

startButton.addEventListener('click', async () => {
  startButton.disabled = true;
  startError.hidden = true;
  try {
    await startAr();
    startScreen.hidden = true;
    hudContainer.hidden = false;
  } catch (err) {
    console.error(err);
    startError.textContent = explain(err);
    startError.hidden = false;
    startButton.disabled = false;
  }
});

function explain(err) {
  if (err?.name === 'NotAllowedError') return 'Camera access was blocked. Allow it in Settings › Safari › Camera and try again.';
  if (!window.isSecureContext) return 'The camera only works over https. Open this page from its https address.';
  return err?.message ?? 'Could not start the camera.';
}

async function startAr() {
  const check = await fetch(TARGETS_URL, { method: 'HEAD' });
  if (!check.ok) throw new Error(`Card targets are missing (${TARGETS_URL}). Run npm run compile-targets first.`);

  const mindar = new MindARThree({
    container: document.getElementById('ar'),
    imageTargetSrc: TARGETS_URL,
    maxTrack: CARDS.length,
    uiScanning: 'no',
    uiLoading: 'yes',
  });
  const { renderer, scene, camera } = mindar;
  addLights(scene);

  let app;
  const slots = CARDS.map((card, index) => {
    const slot = mountMonster(card);
    const anchor = mindar.addAnchor(index);
    anchor.group.add(slot.stage);
    anchor.onTargetFound = () => app?.setVisible(card.id, true);
    anchor.onTargetLost = () => app?.setVisible(card.id, false);
    return slot;
  });
  app = createDuelApp({ scene, slots, hudContainer });

  await mindar.start();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), MAX_FRAME_SECONDS);
    app.update(clock.elapsedTime, dt);
    renderer.render(scene, camera);
  });
}

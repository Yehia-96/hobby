import * as THREE from 'three';

export function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(1, 3, 2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fb8ff, 1.2);
  rim.position.set(-2, 1, -2);
  scene.add(rim);
}

// A card anchor is the card's XY plane with +Z pointing out of the card, one unit = card
// width. Monsters are built Y-up facing +Z, so the stage stands them up on the card, facing
// its bottom edge, which is the player who laid it down.
export function mountMonster(card) {
  const stage = new THREE.Group();
  stage.rotation.x = Math.PI / 2;
  stage.scale.setScalar(card.modelScale);
  const monster = card.create();
  stage.add(monster.root);
  return { card, stage, monster };
}

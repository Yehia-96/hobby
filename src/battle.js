import * as THREE from 'three';
import { tween, lerp } from './anim.js';
import { fireBeam, fireOrb, burst } from './effects.js';

// Plays one attack on screen. The rules are already settled by duel.js; `outcome` just says
// who gets destroyed. Slots are { card, stage, monster } from stage.js.

const WHITE = new THREE.Color(0xffffff);

// World length of one card width at this slot, since MindAR's world scale is arbitrary.
function worldUnit(slot) {
  return new THREE.Vector3().setFromMatrixScale(slot.stage.parent.matrixWorld).x;
}

// The card's normal in world space, i.e. "up" for everything standing on it.
function worldUp(slot) {
  return new THREE.Vector3(0, 1, 0).transformDirection(slot.stage.matrixWorld);
}

function chestOf(slot, unit) {
  return slot.stage.getWorldPosition(new THREE.Vector3())
    .addScaledVector(worldUp(slot), 0.45 * unit * slot.card.modelScale);
}

function turnTo(slot, yaw, seconds = 0.35) {
  const { root } = slot.monster;
  const from = root.rotation.y;
  const delta = Math.atan2(Math.sin(yaw - from), Math.cos(yaw - from));
  return tween(seconds, (p) => { root.rotation.y = from + delta * p; });
}

function yawToward(slot, target) {
  const local = slot.stage.worldToLocal(target.stage.getWorldPosition(new THREE.Vector3()));
  return Math.atan2(local.x, local.z);
}

function materialsOf(slot) {
  const found = new Set();
  slot.monster.root.traverse((o) => {
    if (o.material?.isMeshStandardMaterial) found.add(o.material);
  });
  return [...found];
}

function flash(slot, seconds = 0.45) {
  const materials = materialsOf(slot).map((m) => ({ m, color: m.emissive.clone(), intensity: m.emissiveIntensity }));
  return tween(seconds, (p) => {
    const k = Math.sin(Math.PI * p);
    for (const { m, color, intensity } of materials) {
      m.emissive.copy(color).lerp(WHITE, k);
      m.emissiveIntensity = lerp(intensity, 1.5, k);
    }
  });
}

async function shatter(scene, slot) {
  const unit = worldUnit(slot);
  await flash(slot, 0.3);
  burst(scene, chestOf(slot, unit), { unit, color: slot.card.color, count: 120 });
  const { root } = slot.monster;
  const startYaw = root.rotation.y;
  await tween(0.6, (p) => {
    root.scale.setScalar(Math.max(0.001, 1 - p));
    root.rotation.y = startYaw + p * 4;
  });
  root.visible = false;
}

export async function playAttack({ scene, attacker, defender, outcome }) {
  const unit = worldUnit(attacker);

  await turnTo(attacker, yawToward(attacker, defender));
  await attacker.monster.attack();

  const from = attacker.monster.muzzle.getWorldPosition(new THREE.Vector3());
  const to = chestOf(defender, unit);
  const fire = attacker.monster.attackStyle === 'beam' ? fireBeam : fireOrb;
  await fire(scene, from, to, { unit, up: worldUp(attacker), color: attacker.card.color });

  attacker.monster.recover();
  burst(scene, to, { unit, color: attacker.card.color });
  await flash(defender);

  const bySlotId = { [attacker.card.id]: attacker, [defender.card.id]: defender };
  await Promise.all(outcome.destroyed.map((id) => shatter(scene, bySlotId[id])));

  if (attacker.monster.root.visible) await turnTo(attacker, 0);
}

export function restore(slot) {
  const { root } = slot.monster;
  root.visible = true;
  root.scale.setScalar(1);
  root.rotation.y = 0;
}

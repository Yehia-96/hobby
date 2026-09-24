import * as THREE from 'three';
import { tween } from '../anim.js';
import { createChain, createBone, createSpike, standard, glow } from './parts.js';

// Blue-Eyes White Dragon, built from primitives. Y is up, the dragon faces +Z, and one unit
// is one card width. It hovers with its wings flapping; the attack rears the head back,
// opens the jaw and charges a glow in the mouth, and the battle code fires the beam.

const NECK_ROOT_PITCH = 1.1;
const TORSO_PITCH = -0.5;
const NECK_REST = [-0.1, -0.15, -0.2, -0.2, -0.1, 0.1];
const TAIL_REST = 0.16;

export function createBlueEyes() {
  const mat = {
    scale: standard(0xe9eff8, { roughness: 0.35, metalness: 0.25 }),
    belly: standard(0xbcd0ea, { roughness: 0.45 }),
    accent: standard(0x6d9fe6, { roughness: 0.3, metalness: 0.4 }),
    membrane: standard(0xd3e3fa, { side: THREE.DoubleSide, transparent: true, opacity: 0.92, roughness: 0.6 }),
    claw: standard(0x9fb6d6, { roughness: 0.3, metalness: 0.5 }),
    eye: glow(0x2f9bff, 3),
    breath: glow(0x9fd4ff, 4),
  };

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const torso = createTorso(mat);
  body.add(torso);

  const neck = createChain({ count: 6, length: 0.5, radiusStart: 0.07, radiusEnd: 0.042, material: mat.scale });
  neck.root.position.set(0, 0.06, 0.2);
  neck.root.rotation.x = NECK_ROOT_PITCH;
  torso.add(neck.root);

  const head = createHead(mat);
  head.group.scale.setScalar(1.5);
  neck.tip.add(head.group);

  const tail = createChain({ count: 9, length: 0.8, radiusStart: 0.085, radiusEnd: 0.012, material: mat.scale });
  tail.root.position.set(0, -0.02, -0.22);
  tail.root.rotation.x = -2.0;
  tail.joints.forEach((joint, i) => {
    const spike = createSpike(0.018 - i * 0.0015, 0.05, mat.accent);
    spike.rotation.x = Math.PI / 2;
    spike.position.z = 0.07 - i * 0.007;
    joint.add(spike);
  });
  torso.add(tail.root);

  const wings = [1, -1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.09 * side, 0.86, 0.06);
    const wing = createWing(mat);
    wing.scale.set(1.3 * side, 1.3, 1.3);
    pivot.add(wing);
    body.add(pivot);
    return { pivot, side };
  });

  for (const side of [1, -1]) {
    body.add(createHindLeg(mat, side));
    body.add(createForeArm(mat, side));
  }

  const state = { charge: 0 };

  function update(elapsed) {
    const t = elapsed;
    body.position.y = 0.04 * Math.sin(t * 2.2);

    const flap = 0.4 * Math.sin(t * 3.2) - 0.1;
    for (const { pivot, side } of wings) {
      pivot.rotation.set(0, 0.35 * side, (flap + 0.25 * state.charge) * side);
    }

    let neckPitch = TORSO_PITCH + NECK_ROOT_PITCH;
    neck.joints.forEach((joint, i) => {
      const bend = NECK_REST[i] + 0.04 * Math.sin(t * 1.5 + i * 0.5) - 0.08 * state.charge;
      joint.rotation.x = bend;
      neckPitch += bend;
    });
    // Keep the head level whatever the neck is doing, tipping it down a little at rest.
    head.group.rotation.x = 0.15 * (1 - state.charge) - neckPitch;

    tail.joints.forEach((joint, i) => {
      joint.rotation.x = TAIL_REST;
      joint.rotation.z = 0.08 * Math.sin(t * 1.8 - i * 0.6);
    });

    head.jaw.rotation.x = 0.05 + 0.55 * state.charge;
    head.breath.scale.setScalar(0.001 + state.charge);
    mat.eye.emissiveIntensity = 2.5 + Math.sin(t * 4) * 0.5 + state.charge * 3;
  }

  return {
    name: 'Blue-Eyes White Dragon',
    root,
    muzzle: head.muzzle,
    attackStyle: 'beam',
    update,
    attack: () => tween(0.55, (p) => { state.charge = p; }),
    recover: () => tween(0.4, (p) => { state.charge = 1 - p; }),
  };
}

function createTorso(mat) {
  const torso = new THREE.Group();
  torso.position.y = 0.72;
  torso.rotation.x = TORSO_PITCH;

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), mat.scale);
  chest.scale.set(1, 0.9, 1.5);
  torso.add(chest);

  const underside = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10), mat.belly);
  underside.scale.set(0.85, 0.7, 1.35);
  underside.position.set(0, -0.05, 0.02);
  torso.add(underside);

  // Ridge of spikes along the back, sitting on the ellipsoid's top surface.
  for (let i = 0; i < 5; i++) {
    const z = 0.16 - i * 0.09;
    const y = 0.18 * Math.sqrt(Math.max(0, 1 - (z / 0.3) ** 2));
    const spike = createSpike(0.025, 0.08, mat.accent);
    spike.position.set(0, y + 0.02, z);
    spike.rotation.x = -0.6;
    torso.add(spike);
  }
  return torso;
}

function createHead(mat) {
  const group = new THREE.Group();

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 12), mat.scale);
  skull.scale.set(0.9, 0.75, 1.2);
  skull.position.y = 0.02;
  group.add(skull);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 14), mat.scale);
  snout.rotation.x = Math.PI / 2;
  snout.scale.set(1, 1, 0.7);
  snout.position.set(0, 0.005, 0.14);
  group.add(snout);

  const jaw = new THREE.Group();
  jaw.position.set(0, -0.03, 0.03);
  const lowerJaw = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.17, 12), mat.belly);
  lowerJaw.rotation.x = Math.PI / 2;
  lowerJaw.scale.set(1, 1, 0.5);
  lowerJaw.position.z = 0.09;
  jaw.add(lowerJaw);
  group.add(jaw);

  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), mat.eye);
    eye.position.set(0.042 * side, 0.038, 0.07);
    group.add(eye);

    const horn = createSpike(0.018, 0.13, mat.accent);
    horn.position.set(0.035 * side, 0.06, -0.05);
    horn.rotation.set(-1.2, 0, -0.3 * side);
    group.add(horn);

    const cheek = createSpike(0.012, 0.07, mat.claw);
    cheek.position.set(0.055 * side, -0.01, -0.02);
    cheek.rotation.set(-1.4, 0, -0.8 * side);
    group.add(cheek);
  }

  const muzzle = new THREE.Group();
  muzzle.position.set(0, -0.01, 0.25);
  group.add(muzzle);

  const breath = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), mat.breath);
  muzzle.add(breath);

  return { group, jaw, muzzle, breath };
}

// The wing is drawn in its local XY plane, pointing out along +X; the caller mirrors it.
function createWing(mat) {
  const wing = new THREE.Group();
  const wrist = [0.5, 0.44, 0];
  const fingerTips = [[0.92, 0.48, 0], [0.82, 0.06, 0], [0.62, -0.16, 0], [0.36, -0.22, 0]];

  const shape = new THREE.Shape();
  shape.moveTo(0, 0.04);
  shape.lineTo(0.22, 0.28);
  shape.lineTo(0.5, 0.44);
  shape.lineTo(0.92, 0.48);
  shape.quadraticCurveTo(0.72, 0.28, 0.82, 0.06);
  shape.quadraticCurveTo(0.64, 0.0, 0.62, -0.16);
  shape.quadraticCurveTo(0.47, -0.06, 0.36, -0.22);
  shape.quadraticCurveTo(0.18, -0.08, 0, -0.08);
  shape.lineTo(0, 0.04);
  wing.add(new THREE.Mesh(new THREE.ShapeGeometry(shape, 10), mat.membrane));

  wing.add(createBone([0, 0, 0], [0.22, 0.28, 0], 0.024, mat.scale));
  wing.add(createBone([0.22, 0.28, 0], wrist, 0.02, mat.scale));
  for (const tip of fingerTips) wing.add(createBone(wrist, tip, 0.011, mat.scale));

  const thumb = createSpike(0.014, 0.06, mat.claw);
  thumb.position.set(wrist[0], wrist[1] + 0.03, 0);
  wing.add(thumb);
  return wing;
}

function createHindLeg(mat, side) {
  const leg = new THREE.Group();
  leg.position.set(0.12 * side, 0.6, -0.1);
  leg.rotation.x = 0.3;

  const thigh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), mat.scale);
  thigh.scale.set(0.8, 1.25, 1);
  leg.add(thigh);
  leg.add(createBone([0, -0.05, 0], [0, -0.24, 0.07], 0.03, mat.scale));
  leg.add(createFoot(mat, [0, -0.25, 0.08]));
  return leg;
}

function createForeArm(mat, side) {
  const arm = new THREE.Group();
  arm.position.set(0.1 * side, 0.7, 0.2);
  arm.add(createBone([0, 0, 0], [0.01 * side, -0.12, 0.08], 0.02, mat.scale));
  arm.add(createFoot(mat, [0.01 * side, -0.13, 0.09], 0.7));
  return arm;
}

function createFoot(mat, [x, y, z], size = 1) {
  const foot = new THREE.Group();
  foot.position.set(x, y, z);
  for (const spread of [-0.4, 0, 0.4]) {
    const claw = createSpike(0.012 * size, 0.06 * size, mat.claw);
    claw.rotation.set(Math.PI / 2 + 0.4, 0, spread);
    claw.position.set(spread * 0.04 * size, 0, 0.02 * size);
    foot.add(claw);
  }
  return foot;
}

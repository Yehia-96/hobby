import * as THREE from 'three';
import { tween, lerp } from '../anim.js';
import { createChain, createBone, createSpike, standard, glow } from './parts.js';

// Dark Magician, built from primitives. Y is up, he faces +Z, and one unit is one card width.
// He levitates slightly above the card; the attack swings the staff forward and charges its
// gem, and the battle code fires the Dark Magic orb from it.

const SHOULDER = { rest: -0.3, attack: -1.6 };
const ELBOW = { rest: -1.1, attack: -0.4 };
const STAFF_PITCH = { rest: 0, attack: 1.2 };

export function createDarkMagician() {
  const mat = {
    robe: standard(0x3b1c63, { roughness: 0.7 }),
    armor: standard(0x7a3fc0, { roughness: 0.3, metalness: 0.45 }),
    trim: standard(0xc9a7ff, { roughness: 0.25, metalness: 0.6 }),
    cape: standard(0x2a1247, { roughness: 0.8, side: THREE.DoubleSide }),
    skin: standard(0xcfd6f0, { roughness: 0.6 }),
    staff: standard(0x2f9e5c, { roughness: 0.35, metalness: 0.3 }),
    eye: glow(0x6dff9a, 2.5),
    gem: glow(0xa98bff, 2.5),
  };

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  body.add(createRobe(mat));
  const cape = createCape(mat);
  body.add(cape);
  body.add(createHead(mat));

  const staffArm = createArm(mat, -1);
  const staff = createStaff(mat);
  staffArm.hand.add(staff.group);
  body.add(staffArm.shoulder);

  const freeArm = createArm(mat, 1);
  body.add(freeArm.shoulder);

  const state = { charge: 0 };

  function update(elapsed) {
    const t = elapsed;
    const c = state.charge;
    body.position.y = 0.05 + 0.03 * Math.sin(t * 1.8);
    cape.rotation.x = -0.05 - 0.04 * Math.sin(t * 1.3);

    const shoulderX = lerp(SHOULDER.rest, SHOULDER.attack, c) + 0.03 * Math.sin(t * 1.8);
    const elbowX = lerp(ELBOW.rest, ELBOW.attack, c);
    staffArm.shoulder.rotation.set(shoulderX, 0, -0.15);
    staffArm.elbow.rotation.x = elbowX;
    // Hold the staff upright at rest and tilted at the target while attacking.
    staff.group.rotation.x = lerp(STAFF_PITCH.rest, STAFF_PITCH.attack, c) - shoulderX - elbowX;

    freeArm.shoulder.rotation.set(-0.5 - 0.6 * c, 0, 0.3 + 0.3 * c);
    freeArm.elbow.rotation.x = -0.6 + 0.3 * c + 0.05 * Math.sin(t * 2.1);

    staff.gem.scale.setScalar(1 + 1.6 * c);
    mat.gem.emissiveIntensity = 2 + Math.sin(t * 3) * 0.6 + c * 4;
  }

  return {
    name: 'Dark Magician',
    root,
    muzzle: staff.gem,
    attackStyle: 'orb',
    update,
    attack: () => tween(0.5, (p) => { state.charge = p; }),
    recover: () => tween(0.45, (p) => { state.charge = 1 - p; }),
  };
}

function createRobe(mat) {
  const robe = new THREE.Group();
  const profile = [
    [0.001, 0], [0.27, 0.02], [0.25, 0.12], [0.2, 0.3], [0.15, 0.46], [0.16, 0.58],
    [0.19, 0.7], [0.2, 0.76], [0.15, 0.83], [0.06, 0.86], [0.001, 0.87],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  robe.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 28), mat.robe));

  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.012, 8, 36), mat.trim);
  hem.rotation.x = Math.PI / 2;
  hem.position.y = 0.03;
  robe.add(hem);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.17, 22, 14), mat.armor);
  chest.scale.set(1.12, 0.85, 0.85);
  chest.position.set(0, 0.68, 0.01);
  robe.add(chest);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.022, 8, 30), mat.trim);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.47;
  robe.add(belt);

  const buckle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), mat.eye);
  buckle.position.set(0, 0.47, 0.16);
  buckle.scale.set(1, 1, 0.5);
  robe.add(buckle);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 24), mat.trim);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.86;
  robe.add(collar);

  for (const side of [1, -1]) {
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      mat.armor,
    );
    pauldron.position.set(0.2 * side, 0.78, 0);
    pauldron.scale.set(1.15, 0.8, 1.1);
    pauldron.rotation.z = -0.5 * side;
    robe.add(pauldron);

    const edge = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.01, 6, 24), mat.trim);
    edge.position.copy(pauldron.position);
    edge.rotation.set(Math.PI / 2, -0.5 * side, 0);
    edge.scale.set(1.15, 1.1, 1);
    robe.add(edge);
  }
  return robe;
}

function createCape(mat) {
  const cape = new THREE.Group();
  cape.position.y = 0.8;
  const profile = [[0.17, 0], [0.24, -0.3], [0.29, -0.6], [0.33, -0.78]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const back = Math.PI / 2 + 0.35;
  cape.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 20, back, Math.PI - 0.7), mat.cape));
  return cape;
}

function createHead(mat) {
  const head = new THREE.Group();
  head.position.y = 0.96;

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), mat.skin);
  face.scale.set(0.92, 1.1, 0.95);
  head.add(face);

  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), mat.eye);
    eye.position.set(0.03 * side, 0.015, 0.075);
    head.add(eye);
  }

  const hat = new THREE.Group();
  hat.position.y = 0.04;
  hat.rotation.x = -0.25;
  head.add(hat);

  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.022, 8, 28), mat.armor);
  brim.rotation.x = Math.PI / 2;
  hat.add(brim);

  const band = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.01, 6, 28), mat.trim);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.03;
  hat.add(band);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.095, 0.18, 20), mat.armor);
  crown.position.y = 0.09;
  hat.add(crown);

  const tip = createChain({ count: 6, length: 0.32, radiusStart: 0.05, radiusEnd: 0.006, material: mat.armor, radial: 14 });
  tip.root.position.y = 0.18;
  tip.joints.forEach((joint) => { joint.rotation.x = -0.45; });
  hat.add(tip.root);

  return head;
}

// side = -1 is his right (the staff arm), since he faces +Z.
function createArm(mat, side) {
  const shoulder = new THREE.Group();
  shoulder.position.set(0.2 * side, 0.76, 0);
  shoulder.add(createBone([0, 0, 0], [0, -0.2, 0], 0.036, mat.robe));

  const elbow = new THREE.Group();
  elbow.position.y = -0.2;
  shoulder.add(elbow);
  elbow.add(createBone([0, 0, 0], [0, -0.18, 0], 0.032, mat.armor));

  const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.01, 6, 16), mat.trim);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.y = -0.16;
  elbow.add(cuff);

  const hand = new THREE.Group();
  hand.position.y = -0.2;
  elbow.add(hand);
  hand.add(new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 8), mat.skin));

  return { shoulder, elbow, hand };
}

function createStaff(mat) {
  const group = new THREE.Group();

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.95, 8), mat.staff);
  shaft.position.y = 0.02;
  group.add(shaft);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 24), mat.staff);
  ring.position.y = 0.56;
  group.add(ring);

  for (const side of [1, -1]) {
    const prong = createSpike(0.012, 0.09, mat.staff);
    prong.position.set(0.05 * side, 0.63, 0);
    prong.rotation.z = -0.5 * side;
    group.add(prong);
  }

  const gem = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), mat.gem);
  gem.position.y = 0.56;
  group.add(gem);

  const butt = createSpike(0.016, 0.06, mat.staff);
  butt.rotation.x = Math.PI;
  butt.position.y = -0.48;
  group.add(butt);

  return { group, gem };
}

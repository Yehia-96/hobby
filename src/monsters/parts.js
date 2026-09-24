import * as THREE from 'three';
import { lerp } from '../anim.js';

// Chain of tapering segments for necks, tails and the magician's hat tip. Each joint is
// nested in the previous one, so bending every joint a little curls the whole chain.
// The chain grows along the root's local +Y.
export function createChain({ count, length, radiusStart, radiusEnd, material, radial = 10 }) {
  const root = new THREE.Group();
  const joints = [];
  const segLen = length / count;
  let parent = root;

  for (let i = 0; i < count; i++) {
    const joint = new THREE.Group();
    if (i > 0) joint.position.y = segLen;
    parent.add(joint);

    const r0 = lerp(radiusStart, radiusEnd, i / count);
    const r1 = lerp(radiusStart, radiusEnd, (i + 1) / count);
    const segment = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen, radial), material);
    segment.position.y = segLen / 2;
    joint.add(segment);
    joint.add(new THREE.Mesh(new THREE.SphereGeometry(r0, radial, 6), material));

    joints.push(joint);
    parent = joint;
  }

  const tip = new THREE.Group();
  tip.position.y = segLen;
  parent.add(tip);
  return { root, joints, tip };
}

// Thin cylinder between two points, used for wing bones.
export function createBone(from, to, radius, material) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const length = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.6, radius, length, 6), material);
  mesh.position.copy(a).lerp(b, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

export function createSpike(radius, height, material) {
  return new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), material);
}

export function standard(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1, ...extra });
}

export function glow(color, intensity = 2) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });
}

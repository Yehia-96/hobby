import * as THREE from 'three';
import { tween, easeOut, linear } from './anim.js';

// Attack visuals. Everything lives in world space, and `unit` is the world length of one
// card width, because MindAR's world scale is arbitrary. Each fire* function resolves at
// the moment of impact and cleans itself up afterwards.

const UP = new THREE.Vector3(0, 1, 0);

function additive(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

function dispose(scene, object) {
  scene.remove(object);
  object.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
}

// Blue-Eyes' White Lightning: a beam that shoots out of the mouth and lingers briefly.
export async function fireBeam(scene, from, to, { unit, color }) {
  const beam = new THREE.Group();
  beam.position.copy(from);
  beam.quaternion.setFromUnitVectors(UP, to.clone().sub(from).normalize());
  const length = from.distanceTo(to);

  const layers = [
    [0.018, additive(0xffffff, 1)],
    [0.045, additive(color, 0.55)],
    [0.09, additive(color, 0.2)],
  ].map(([radius, material]) => {
    const geometry = new THREE.CylinderGeometry(radius * unit, radius * unit, 1, 16, 1, true);
    geometry.translate(0, 0.5, 0);
    const mesh = new THREE.Mesh(geometry, material);
    beam.add(mesh);
    return mesh;
  });
  scene.add(beam);

  await tween(0.22, (p) => { beam.scale.set(1, length * p, 1); }, easeOut);

  const opacities = layers.map((m) => m.material.opacity);
  tween(0.5, (p) => {
    layers.forEach((m, i) => { m.material.opacity = opacities[i] * (1 - p); });
    beam.scale.x = beam.scale.z = 1 + p;
  }, linear).then(() => dispose(scene, beam));
}

// Dark Magician's Dark Magic Attack: a spinning orb that arcs over to the target.
export async function fireOrb(scene, from, to, { unit, up, color }) {
  const orb = new THREE.Group();
  orb.add(new THREE.Mesh(new THREE.SphereGeometry(0.05 * unit, 16, 12), additive(0xffffff, 1)));
  orb.add(new THREE.Mesh(new THREE.SphereGeometry(0.1 * unit, 16, 12), additive(color, 0.5)));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13 * unit, 0.012 * unit, 6, 32), additive(color, 0.8));
  orb.add(ring);
  scene.add(orb);

  const arcHeight = 0.35 * unit;
  await tween(0.65, (p) => {
    orb.position.copy(from).lerp(to, p).addScaledVector(up, Math.sin(Math.PI * p) * arcHeight);
    ring.rotation.x += 0.3;
    ring.rotation.y += 0.2;
    orb.scale.setScalar(0.6 + p * 0.6);
  });
  dispose(scene, orb);
}

// Spray of sparks at the point of impact.
export function burst(scene, at, { unit, color, count = 60 }) {
  const positions = new Float32Array(count * 3);
  const velocities = Array.from({ length: count }, () =>
    new THREE.Vector3().randomDirection().multiplyScalar((0.4 + Math.random() * 0.8) * unit));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color, size: 0.045 * unit, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.position.copy(at);
  scene.add(points);

  return tween(0.7, (p) => {
    velocities.forEach((v, i) => positions.set([v.x * p, v.y * p, v.z * p], i * 3));
    geometry.attributes.position.needsUpdate = true;
    material.opacity = 1 - p;
  }, easeOut).then(() => dispose(scene, points));
}

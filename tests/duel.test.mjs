import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDuel, resolveAttack, isAlive, winnerOf, STARTING_LP } from '../src/duel.js';

const blueEyes = { id: 'blue-eyes', atk: 3000, owner: 'p1' };
const darkMagician = { id: 'dark-magician', atk: 2500, owner: 'p2' };
const twin = { id: 'twin', atk: 3000, owner: 'p2' };

test('new duel starts both players on full life points with nothing destroyed', () => {
  const duel = createDuel(['p1', 'p2']);
  assert.deepEqual(duel.lp, { p1: STARTING_LP, p2: STARTING_LP });
  assert.equal(isAlive(duel, 'blue-eyes'), true);
});

test('stronger attacker destroys the defender and deals the difference', () => {
  const duel = createDuel(['p1', 'p2']);
  const { state, outcome } = resolveAttack(duel, blueEyes, darkMagician);
  assert.deepEqual(outcome.destroyed, ['dark-magician']);
  assert.deepEqual(outcome.damage, { player: 'p2', amount: 500 });
  assert.equal(state.lp.p2, STARTING_LP - 500);
  assert.equal(isAlive(state, 'dark-magician'), false);
});

test('weaker attacker is destroyed and its owner takes the damage', () => {
  const duel = createDuel(['p1', 'p2']);
  const { state, outcome } = resolveAttack(duel, darkMagician, blueEyes);
  assert.deepEqual(outcome.destroyed, ['dark-magician']);
  assert.deepEqual(outcome.damage, { player: 'p2', amount: 500 });
  assert.equal(state.lp.p1, STARTING_LP);
});

test('equal attack destroys both monsters and deals no damage', () => {
  const duel = createDuel(['p1', 'p2']);
  const { state, outcome } = resolveAttack(duel, blueEyes, twin);
  assert.deepEqual(outcome.destroyed.sort(), ['blue-eyes', 'twin']);
  assert.equal(outcome.damage, null);
  assert.deepEqual(state.lp, duel.lp);
});

test('resolving an attack does not mutate the previous state', () => {
  const duel = createDuel(['p1', 'p2']);
  resolveAttack(duel, blueEyes, darkMagician);
  assert.equal(duel.lp.p2, STARTING_LP);
  assert.equal(isAlive(duel, 'dark-magician'), true);
});

test('life points never drop below zero and the other player wins', () => {
  const lowLp = { ...createDuel(['p1', 'p2']), lp: { p1: STARTING_LP, p2: 300 } };
  assert.equal(winnerOf(lowLp), null);
  const { state } = resolveAttack(lowLp, blueEyes, darkMagician);
  assert.equal(state.lp.p2, 0);
  assert.equal(winnerOf(state), 'p1');
});

test('a destroyed monster cannot attack or be attacked', () => {
  const duel = resolveAttack(createDuel(['p1', 'p2']), blueEyes, darkMagician).state;
  assert.throws(() => resolveAttack(duel, darkMagician, blueEyes), /destroyed/);
  assert.throws(() => resolveAttack(duel, blueEyes, darkMagician), /destroyed/);
});

// Battle rules for the prototype: both monsters in attack position, ATK vs ATK,
// the loser is destroyed and its owner takes the difference. No effects, no chains.
// Every function returns a new state; nothing is mutated.

export const STARTING_LP = 8000;

export function createDuel(players) {
  return {
    lp: Object.fromEntries(players.map((p) => [p, STARTING_LP])),
    destroyed: [],
  };
}

export const isAlive = (state, monsterId) => !state.destroyed.includes(monsterId);

export function winnerOf(state) {
  const players = Object.keys(state.lp);
  const standing = players.filter((p) => state.lp[p] > 0);
  return standing.length === 1 ? standing[0] : null;
}

export function resolveAttack(state, attacker, defender) {
  for (const m of [attacker, defender]) {
    if (!isAlive(state, m.id)) throw new Error(`${m.id} is destroyed`);
  }

  const diff = attacker.atk - defender.atk;
  const destroyed = diff > 0 ? [defender.id] : diff < 0 ? [attacker.id] : [attacker.id, defender.id];
  const damage = diff === 0 ? null : { player: diff > 0 ? defender.owner : attacker.owner, amount: Math.abs(diff) };

  const lp = damage
    ? { ...state.lp, [damage.player]: Math.max(0, state.lp[damage.player] - damage.amount) }
    : state.lp;

  return {
    state: { lp, destroyed: [...state.destroyed, ...destroyed] },
    outcome: { destroyed, damage },
  };
}

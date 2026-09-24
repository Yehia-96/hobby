import { createDuel, resolveAttack, winnerOf } from './duel.js';
import { playAttack, restore } from './battle.js';
import { tickTweens } from './anim.js';
import { createHud } from './hud.js';
import { PLAYERS } from './cards.js';

// Glue between the rules, the 3D slots and the HUD. The AR page and the preview page both
// use it; they differ only in where the slots live and how visibility is detected.
export function createDuelApp({ scene, slots, hudContainer }) {
  const byId = Object.fromEntries(slots.map((s) => [s.card.id, s]));
  const visible = new Set();
  let duel = createDuel(Object.keys(PLAYERS));
  let busy = false;

  const hud = createHud(hudContainer, slots.map((s) => s.card), { onAttack: attack, onReset: reset });
  const refresh = () => hud.render({ duel, visible, busy, winner: winnerOf(duel) });

  async function attack(attackerId) {
    if (busy) return;
    const attacker = byId[attackerId];
    const defender = slots.find((s) => s.card.id !== attackerId);
    let result;
    try {
      result = resolveAttack(duel, attacker.card, defender.card);
    } catch (err) {
      hud.toast(err.message);
      return;
    }

    busy = true;
    refresh();
    try {
      await playAttack({ scene, attacker, defender, outcome: result.outcome });
      duel = result.state;
      hud.toast(describe(result.outcome));
    } catch (err) {
      console.error('Attack animation failed', err);
      hud.toast('Something went wrong playing that attack');
    } finally {
      busy = false;
      refresh();
    }
  }

  function describe({ destroyed, damage }) {
    const names = destroyed.map((id) => byId[id].card.shortName).join(' and ');
    const hit = damage ? ` ${PLAYERS[damage.player]} takes ${damage.amount} damage.` : '';
    const winner = winnerOf(duel);
    return `${names} destroyed!${hit}${winner ? ` ${PLAYERS[winner]} wins!` : ''}`;
  }

  function reset() {
    if (busy) return;
    duel = createDuel(Object.keys(PLAYERS));
    slots.forEach(restore);
    hud.toast('New duel');
    refresh();
  }

  refresh();

  return {
    setVisible(cardId, isVisible) {
      if (isVisible) visible.add(cardId);
      else visible.delete(cardId);
      refresh();
    },
    update(elapsed, dt) {
      tickTweens(dt);
      for (const slot of slots) slot.monster.update(elapsed);
    },
  };
}

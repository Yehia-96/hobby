import { PLAYERS } from './cards.js';

// On-screen overlay: life points, a status chip per card, attack buttons and a message toast.
// It only renders what it's given and reports clicks; the duel app owns the state.

const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createHud(container, cards, { onAttack, onReset }) {
  container.innerHTML = `
    <div class="hud-top">
      ${Object.entries(PLAYERS).map(([id, name]) => `
        <div class="lp" data-player="${id}">
          <span class="lp-name">${escape(name)}</span>
          <span class="lp-value">8000</span>
        </div>`).join('')}
    </div>
    <div class="hud-hint" hidden>Point the camera at a card</div>
    <div class="hud-toast" hidden></div>
    <div class="hud-bottom">
      <div class="chips">
        ${cards.map((c) => `
          <div class="chip" data-card="${c.id}">
            <span class="chip-dot"></span>
            <span class="chip-name">${escape(c.name)}</span>
            <span class="chip-stats">ATK ${c.atk} / DEF ${c.def}</span>
          </div>`).join('')}
      </div>
      <div class="actions">
        ${cards.map((c) => `<button class="attack" data-attacker="${c.id}">${escape(c.shortName)} attack!</button>`).join('')}
        <button class="reset">Reset duel</button>
      </div>
    </div>`;

  container.querySelectorAll('button.attack').forEach((btn) => {
    btn.addEventListener('click', () => onAttack(btn.dataset.attacker));
  });
  container.querySelector('button.reset').addEventListener('click', onReset);

  const toast = container.querySelector('.hud-toast');
  let toastTimer;

  return {
    render({ duel, visible, busy, winner }) {
      for (const [player, lp] of Object.entries(duel.lp)) {
        const el = container.querySelector(`.lp[data-player="${player}"]`);
        el.querySelector('.lp-value').textContent = lp;
        el.classList.toggle('lost', lp === 0);
      }
      for (const card of cards) {
        const chip = container.querySelector(`.chip[data-card="${card.id}"]`);
        const destroyed = duel.destroyed.includes(card.id);
        chip.dataset.state = destroyed ? 'destroyed' : visible.has(card.id) ? 'visible' : 'hidden';
      }
      const bothReady = cards.every((c) => visible.has(c.id) && !duel.destroyed.includes(c.id));
      container.querySelectorAll('button.attack').forEach((btn) => {
        btn.disabled = busy || !!winner || !bothReady;
      });
      container.querySelector('.hud-hint').hidden = visible.size > 0;
    },

    toast(message, seconds = 3) {
      toast.textContent = message;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.hidden = true; }, seconds * 1000);
    },
  };
}

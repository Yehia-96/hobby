// Tiny tween runner driven by the render loop, so every animation shares one clock.

const active = new Set();

export const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
export const easeOut = (p) => 1 - (1 - p) ** 3;
export const linear = (p) => p;

export function tween(duration, onUpdate, ease = easeInOut) {
  return new Promise((resolve) => {
    active.add({ elapsed: 0, duration, onUpdate, ease, resolve });
  });
}

export const wait = (seconds) => tween(seconds, () => {});

export function tickTweens(dt) {
  for (const tw of [...active]) {
    tw.elapsed = Math.min(tw.elapsed + dt, tw.duration);
    tw.onUpdate(tw.ease(tw.duration === 0 ? 1 : tw.elapsed / tw.duration));
    if (tw.elapsed >= tw.duration) {
      active.delete(tw);
      tw.resolve();
    }
  }
}

export const lerp = (a, b, t) => a + (b - a) * t;

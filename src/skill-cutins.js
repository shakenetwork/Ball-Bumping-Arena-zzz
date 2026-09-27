/* Shared presentation module. No energy, damage, AI, or physics mutations. */
(function (global) {
  'use strict';
  const SEATS = Object.freeze([
    { side: 'right', row: 'bottom' },
    { side: 'left', row: 'top' },
    { side: 'right', row: 'top' },
    { side: 'left', row: 'bottom' },
  ]);
  function create(host, config) {
    const root = document.createElement('div');
    root.className = 'skill-cutin-layer';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-label', '技能释放提示');
    host.appendChild(root);
    const active = new Map();
    const preloads = new Map();
    function preload(characterId) {
      const item = config[characterId];
      if (!item?.image || preloads.has(characterId)) return;
      const image = new Image();
      image.src = item.image;
      preloads.set(characterId, image);
    }
    function cancel(slot) {
      const previous = active.get(slot);
      if (previous) previous.card.remove();
      active.delete(slot);
    }
    function clear() {
      for (const slot of [...active.keys()]) cancel(slot);
    }
    function play({ slot, characterId, duration, headline, warning, effect, compactHeadline, compactLabel, color }) {
      const item = config[characterId];
      const seat = SEATS[slot];
      if (!item || !seat || !Number.isFinite(duration) || duration <= 0) return false;
      preload(characterId);
      cancel(slot);
      const card = document.createElement('div');
      card.className = 'skill-cutin';
      card.dataset.side = seat.side;
      card.dataset.row = seat.row;
      card.dataset.slot = String(slot);
      card.dataset.effect = effect || item.effect || 'rush';
      card.style.setProperty('--cutin-color', color || item.color);
      const art = document.createElement('img');
      art.className = 'skill-cutin-art';
      art.alt = '';
      art.setAttribute('aria-hidden', 'true');
      art.draggable = false;
      // All characters face into the arena, independently of authored orientation.
      art.dataset.flip = String(item.facing !== (seat.side === 'right' ? 'left' : 'right'));
      art.addEventListener('error', () => card.classList.add('no-art'), { once: true });
      if (item.image) art.src = item.image;
      else card.classList.add('no-art');
      const copy = document.createElement('div');
      copy.className = 'skill-cutin-copy';
      const title = document.createElement('strong');
      title.textContent = item.name + ' · ' + (headline || item.headline || '技能发动');
      const detail = document.createElement('span');
      detail.textContent = warning || item.warning || '注意闪避';
      copy.append(title, detail);
      card.append(art, copy);
      root.appendChild(card);
      active.set(slot, { card, title, detail, item, remaining: duration,
        splash: Math.min(duration, item.splashSeconds || 1.4), compact: false, lastSecond: -1,
        compactHeadline: compactHeadline || '技能中', compactLabel: compactLabel || '注意闪避' });
      return true;
    }
    function update(dt, paused = false) {
      root.classList.toggle('is-paused', paused);
      if (paused || !Number.isFinite(dt) || dt <= 0) return;
      for (const [slot, state] of active) {
        state.remaining -= dt;
        state.splash -= dt;
        if (state.remaining <= 0) { cancel(slot); continue; }
        if (state.splash <= .18) state.card.classList.add('is-leaving');
        if (state.splash <= 0 && !state.compact) {
          state.compact = true;
          state.card.classList.add('is-compact');
          state.title.textContent = state.item.name + ' · ' + state.compactHeadline;
          // Announce activation once; countdown updates are purely visual.
          state.detail.setAttribute('aria-live', 'off');
        }
        const second = Math.ceil(state.remaining);
        if (state.compact && second !== state.lastSecond) {
          state.detail.textContent = second + ' 秒 · ' + state.compactLabel;
          state.lastSecond = second;
        }
      }
    }
    function resize() {
      const { width, height } = host.getBoundingClientRect();
      root.style.setProperty('--cutin-width', Math.max(90, Math.min(220, (width - height) / 2 - 58)) + 'px');
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    return Object.freeze({ play, update, cancel, clear, preload,
      destroy() { clear(); observer.disconnect(); root.remove(); preloads.clear(); },
    });
  }
  global.SkillCutins = Object.freeze({ create });
})(window);

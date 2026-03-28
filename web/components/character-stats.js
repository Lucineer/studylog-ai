// ─── Character Stats Bar Component (Preact + HTM) ──────────────────────────
import { html, useState } from '../preact-shim.js';

const ABILITY_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_NAMES = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

function getCharacter() {
  try {
    const raw = sessionStorage.getItem('lo-character');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function mod(score) {
  if (!score) return 0;
  return Math.floor((score - 10) / 2);
}

function modStr(score) {
  const m = mod(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

export function CharacterStats() {
  const [expanded, setExpanded] = useState(false);
  const char = getCharacter();

  if (!char) return null;

  const hp = char.hp || char.hitPoints;
  const maxHp = char.maxHp || char.maxHitPoints || hp || 0;
  const currentHp = hp != null ? (char.currentHp != null ? char.currentHp : hp) : 0;
  const hpPct = maxHp > 0 ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : 0;

  return html`
    <div class="character-stats-bar" onClick=${() => setExpanded(!expanded)}>
      <div class="stats-collapsed">
        ${ABILITY_ORDER.map(a => {
          const val = char.abilities?.[a] || char.stats?.[a] || char[a];
          if (!val) return null;
          return html`<span class="stat-item" title=${ABILITY_NAMES[a]}>
            <span class="stat-label">${ABILITY_NAMES[a]}</span>
            <span class="stat-value">${val}</span>
          </span>`;
        })}
        ${maxHp > 0 && html`
          <span class="hp-bar-wrap" title="HP: ${currentHp}/${maxHp}">
            <div class="hp-bar">
              <div class="hp-fill" style=${`width:${hpPct}%;background:${hpPct > 50 ? '#4caf50' : hpPct > 25 ? '#ff9800' : '#f44336'}`}></div>
            </div>
            <span class="hp-text">${currentHp}/${maxHp}</span>
          </span>
        `}
        <span class="stats-chevron">${expanded ? '▲' : '▼'}</span>
      </div>
      ${expanded && html`
        <div class="stats-expanded">
          <div class="stats-grid">
            ${ABILITY_ORDER.map(a => {
              const val = char.abilities?.[a] || char.stats?.[a] || char[a];
              return html`<div class="stat-detail">
                <span class="stat-detail-name">${ABILITY_NAMES[a]}</span>
                <span class="stat-detail-val">${val || '–'}</span>
                <span class="stat-detail-mod">${val ? modStr(val) : ''}</span>
              </div>`;
            })}
          </div>
          ${maxHp > 0 && html`
            <div class="hp-detail">
              <span>HP: ${currentHp} / ${maxHp}</span>
              <div class="hp-bar hp-bar-lg">
                <div class="hp-fill" style=${`width:${hpPct}%;background:${hpPct > 50 ? '#4caf50' : hpPct > 25 ? '#ff9800' : '#f44336'}`}></div>
              </div>
            </div>
          `}
          ${char.name && html`<div class="stat-char-name">${char.name}</div>`}
        </div>
      `}
    </div>
  `;
}

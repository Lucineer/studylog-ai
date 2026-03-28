// ─── Dice Roller Component (Preact + HTM) ────────────────────────────────────
import { html, signal, computed } from '../preact-shim.js';

const DICE_TYPES = [
  { sides: 4, label: 'd4', shape: 'tetra' },
  { sides: 6, label: 'd6', shape: 'cube' },
  { sides: 8, label: 'd8', shape: 'octa' },
  { sides: 10, label: 'd10', shape: 'deca' },
  { sides: 12, label: 'd12', shape: 'dodeca' },
  { sides: 20, label: 'd20', shape: 'icosa' },
  { sides: 100, label: 'd100', shape: 'deca' },
];

// D6 pip patterns for visual dice
const D6_PIPS = {
  1: [[1,1]],
  2: [[0,2],[2,0]],
  3: [[0,2],[1,1],[2,0]],
  4: [[0,0],[0,2],[2,0],[2,2]],
  5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
  6: [[0,0],[0,1],[0,2],[2,0],[2,1],[2,2]],
};

const rollResults = signal([]);
const isRolling = signal(false);
const selectedDice = signal(20);
const diceCount = signal(1);
const modifier = signal(0);

// ─── Dice Notation Parser ───────────────────────────────────────────────────
// Supports: "2d6+3", "1d20-2", "4d6 drop lowest", "d20", "2d8+1d4"
function parseDiceNotation(notation) {
  notation = notation.trim().toLowerCase();
  // Handle "drop lowest" / "drop highest"
  const dropMatch = notation.match(/drop\s+(lowest|highest)/);
  const dropMode = dropMatch ? dropMatch[1] : null;
  if (dropMatch) notation = notation.replace(/\s*drop\s+(lowest|highest)/, '');

  // Parse XdY[+/-Z] patterns
  const parts = [];
  const regex = /(\d*)d(\d+)/g;
  let modTotal = 0;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(notation)) !== null) {
    const count = parseInt(match[1]) || 1;
    const sides = parseInt(match[2]);
    parts.push({ count, sides, dropMode });
    lastIndex = match.index + match[0].length;
  }

  // Parse remaining modifier
  const modStr = notation.slice(lastIndex).trim();
  if (modStr) {
    const modNum = eval(modStr.replace(/\s/g, '')); // safe: only numbers and +- operators
    if (typeof modNum === 'number') modTotal = modNum;
  }

  if (parts.length === 0) return null;
  return { parts, modifier: modTotal };
}

function executeNotation(parsed) {
  let total = parsed.modifier;
  const allRolls = [];
  const results = parsed.parts.map(p => {
    const rolls = [];
    for (let i = 0; i < p.count; i++) {
      rolls.push(Math.floor(Math.random() * p.sides) + 1);
    }

    // Handle drop lowest/highest
    let keptRolls = [...rolls];
    if (p.dropMode === 'lowest' && rolls.length > 1) {
      keptRolls = rolls.filter(r => r !== Math.min(...rolls)).slice(0, rolls.length - 1);
    } else if (p.dropMode === 'highest' && rolls.length > 1) {
      keptRolls = rolls.filter(r => r !== Math.max(...rolls)).slice(0, rolls.length - 1);
    }

    const sum = keptRolls.reduce((a, b) => a + b, 0);
    total += sum;
    allRolls.push(...rolls);
    return { rolls, keptRolls, sides: p.sides, sum };
  });

  // Build notation string
  const notationStr = parsed.parts.map(p => `${p.count}d${p.sides}`).join('+')
    + (parsed.modifier >= 0 ? (parsed.modifier > 0 ? '+' + parsed.modifier : '') : parsed.modifier);

  return {
    notation: notationStr,
    rolls: allRolls,
    modifier: parsed.modifier,
    total,
    results,
    critical: allRolls.length === 1 && allRolls[0] === 20 ? 'success' :
              allRolls.length === 1 && allRolls[0] === 1 ? 'failure' : null,
    timestamp: Date.now(),
  };
}

// ─── Visual D6 Component ────────────────────────────────────────────────────
function D6Face({ value, rolling }) {
  const pips = D6_PIPS[value] || [];
  return html`
    <div class=${`d6-face ${rolling ? 'tumbling' : ''}`}>
      <div class="d6-grid">
        ${Array.from({ length: 9 }).map((_, i) => {
          const row = Math.floor(i / 3), col = i % 3;
          const isPip = pips.some(([r, c]) => r === row && c === col);
          return html`<div class=${`d6-cell ${isPip ? 'pip' : ''}`}>${isPip ? '●' : ''}</div>`;
        })}
      </div>
    </div>
  `;
}

// ─── Dice Face Component (for non-d6) ───────────────────────────────────────
function DiceFace({ sides, value, rolling }) {
  if (sides === 6) return html`<${D6Face} value=${value} rolling=${rolling} />`;
  return html`
    <div class=${`dice-face d${sides} ${rolling ? 'tumbling' : ''}`}>
      <span class="dice-number">${value}</span>
    </div>
  `;
}

// ─── Main DiceRoller Component ──────────────────────────────────────────────
class DiceRoller extends Component {
  constructor(props) {
    super(props);
    this.state = { notation: '', animDice: [], showNotationInput: false };
  }

  roll() {
    if (isRolling.value) return;
    isRolling.value = true;

    const count = diceCount.value;
    const sides = selectedDice.value;
    const mod = modifier.value;
    const rolls = [];
    const animDice = [];

    for (let i = 0; i < Math.min(count, 6); i++) {
      const result = Math.floor(Math.random() * sides) + 1;
      rolls.push(result);
      animDice.push({ sides, value: 0, finalValue: result });
    }

    // Animate tumble
    this.setState({ animDice });
    let tick = 0;
    const tumbleInterval = setInterval(() => {
      tick++;
      const updated = animDice.map(d => ({ ...d, value: Math.floor(Math.random() * d.sides) + 1 }));
      this.setState({ animDice: updated });
      if (tick >= 8) {
        clearInterval(tumbleInterval);
        const final = animDice.map(d => ({ ...d, value: d.finalValue }));
        this.setState({ animDice: final });
        this.completeRoll(rolls, sides, count, mod);
      }
    }, 100);
  }

  completeRoll(rolls, sides, count, mod) {
    const total = rolls.reduce((a, b) => a + b, 0) + mod;
    const notation = `${count}d${sides}${mod !== 0 ? (mod > 0 ? '+' : '') + mod : ''}`;
    // sound placeholder: playSound('dice-clatter.mp3');

    setTimeout(() => {
      rollResults.value = [...rollResults.value.slice(-19), {
        rolls, total, modifier: mod, sides, count, notation,
        critical: sides === 20 && count === 1 && rolls[0] === 20 ? 'success' :
                  sides === 20 && count === 1 && rolls[0] === 1 ? 'failure' : null,
        timestamp: Date.now(), reason: 'Manual roll',
      }];
      isRolling.value = false;
      this.setState({ animDice: [] });
    }, 200);
  }

  rollNotation() {
    const input = this.state.notation.trim();
    if (!input) return;
    const parsed = parseDiceNotation(input);
    if (!parsed) return;

    isRolling.value = true;
    // sound placeholder: playSound('dice-clatter.mp3');
    setTimeout(() => {
      const result = executeNotation(parsed);
      rollResults.value = [...rollResults.value.slice(-19), { ...result, reason: 'Notation' }];
      isRolling.value = false;
    }, 600);
  }

  render() {
    return html`
      <div class="dice-roller">
        <!-- Dice Selector -->
        <div class="dice-selector">
          ${DICE_TYPES.map(d => html`
            <button class=${`dice-btn ${selectedDice.value === d.sides ? 'active' : ''}`}
                    onClick=${() => selectedDice.value = d.sides}>${d.label}</button>
          `)}
        </div>

        <!-- Controls -->
        <div class="dice-controls">
          <label class="dice-label">Qty:
            <input type="number" min="1" max="20" value=${diceCount.value}
              onInput=${e => diceCount.value = Math.max(1, parseInt(e.target.value) || 1)} />
          </label>
          <label class="dice-label">Mod:
            <input type="number" value=${modifier.value}
              onInput=${e => modifier.value = parseInt(e.target.value) || 0} />
          </label>
          <button class=${`roll-btn ${isRolling.value ? 'rolling' : ''}`} onClick=${() => this.roll()}>
            ${isRolling.value ? '🎲 Rolling...' : '🎲 Roll!'}
          </button>
        </div>

        <!-- Notation Input -->
        <div class="notation-row">
          <button class="notation-toggle" onClick=${() => this.setState(s => ({ showNotationInput: !s.showNotationInput }))}>
            📝 Notation
          </button>
          ${this.state.showNotationInput && html`
            <form class="notation-form" onSubmit=${(e) => { e.preventDefault(); this.rollNotation(); }}>
              <input type="text" class="notation-input" placeholder='e.g. "2d6+3" or "4d6 drop lowest"'
                value=${this.state.notation}
                onInput=${e => this.setState({ notation: e.target.value })} />
              <button type="submit" class="notation-roll-btn">Roll</button>
            </form>
          `}
        </div>

        <!-- Animated Dice -->
        ${this.state.animDice.length > 0 && html`
          <div class="dice-animation-area">
            ${this.state.animDice.map((d, i) => html`
              <${DiceFace} key=${i} sides=${d.sides} value=${d.value} rolling=${d.value !== d.finalValue} />
            `)}
          </div>
        `}

        <!-- Roll History -->
        <div class="roll-history">
          <h4>Roll History</h4>
          ${rollResults.value.length === 0 && html`<p class="empty-hint">No rolls yet</p>`}
          ${rollResults.value.slice().reverse().slice(0, 10).map((r, i) => html`
            <div class=${`roll-result ${r.critical ? 'crit-' + r.critical : ''}`}>
              <span class="roll-notation">${r.notation}</span>
              <span class="roll-values">[${r.rolls.join(', ')}]${r.modifier ? (r.modifier >= 0 ? ' +' : ' ') + r.modifier : ''}</span>
              <span class="roll-total ${r.critical === 'success' ? 'nat20' : r.critical === 'failure' ? 'nat1' : ''}">${r.total}</span>
              ${r.critical === 'success' && html`<span class="crit-label nat20-label">🎉 NATURAL 20!</span>`}
              ${r.critical === 'failure' && html`<span class="crit-label nat1-label">💀 CRITICAL FAIL!</span>`}
              ${r.reason && html`<span class="roll-reason">${r.reason}</span>`}
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

export { DiceRoller, rollResults, selectedDice, diceCount, modifier, parseDiceNotation, executeNotation };

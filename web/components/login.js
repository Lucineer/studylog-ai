import { html, useState, useEffect } from '../preact-shim.js';
import { authState, addToast, getToken } from '../app.js';

const CLASSES = [
  { name: 'Fighter', icon: '⚔️', desc: 'Martial prowess, heavy armor, weapon mastery', hp: 10, stats: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 10 } },
  { name: 'Wizard', icon: '🧙', desc: 'Arcane magic, spellbook, ritual casting', hp: 6, stats: { str: 8, dex: 14, con: 12, int: 16, wis: 14, cha: 10 } },
  { name: 'Rogue', icon: '🗡️', desc: 'Stealth, cunning, sneak attacks, thievery', hp: 8, stats: { str: 10, dex: 16, con: 12, int: 14, wis: 12, cha: 14 } },
  { name: 'Cleric', icon: '✨', desc: 'Divine magic, healing, Turn Undead', hp: 8, stats: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 } },
  { name: 'Ranger', icon: '🏹', desc: 'Archery, nature magic, beast companion', hp: 10, stats: { str: 14, dex: 16, con: 12, int: 10, wis: 14, cha: 10 } },
  { name: 'Bard', icon: '🎵', desc: 'Performance magic, inspiration, versatility', hp: 8, stats: { str: 10, dex: 14, con: 12, int: 14, wis: 12, cha: 16 } },
];

const WORLD_SEEDS = [
  { name: 'The Forgotten Realm', scene: 'You stand at the edge of the Whispering Woods, where the ancient road disappears into mist. A weathered signpost reads: "Thornhaven — 3 leagues east. Turn back." Something glints in the mud at your feet.' },
  { name: 'The Dragon Coast', scene: 'Salt wind whips through the docks of Saltmarsh as you step off the merchant vessel. The town is quiet — too quiet for a port city. A fisherman waves urgently from a nearby skiff, pointing toward a column of smoke rising from the lighthouse.' },
  { name: 'The Underdark', scene: 'The tunnel opens into a vast cavern, bioluminescent fungi casting an eerie blue glow across underground pools. Strange clicking echoes from the darkness ahead. Your torch flickers — something in this cavern breathes air.' },
  { name: 'The Celestial Throne', scene: 'Floating islands drift through an amber sky. You stand on the edge of one, a crumbling temple behind you. Below, an endless cloud sea. A staircase of light descends from the temple — the old gods left something here.' },
];

export function QuickStart() {
  const [step, setStep] = useState(0); // 0: world, 1: class, 2: name, 3: playing
  const [world, setWorld] = useState(null);
  const [charClass, setCharClass] = useState(null);
  const [charName, setCharName] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstResponse, setFirstResponse] = useState('');
  const ensureToken = async () => {
    if (getToken()) return;
    try {
      const res = await fetch('/v1/auth/guest', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('lo-token', data.token);
        sessionStorage.setItem('lo-guest', '1');
        authState.value = { isLoggedIn: true, token: data.token, isGuest: true };
      }
    } catch {}
  };

  const startAdventure = async () => {
    setLoading(true);
    await ensureToken();
    const token = getToken();
    if (!token) { setLoading(false); return; }

    const classData = charClass;
    const systemMsg = `You are DMlog.ai, an immersive Dungeon Master. The player is ${charName}, a level 1 ${classData.name}. Stats: STR ${classData.stats.str}, DEX ${classData.stats.dex}, CON ${classData.stats.con}, INT ${classData.stats.int}, WIS ${classData.stats.wis}, CHA ${classData.stats.cha}. HP: ${classData.hp}. 

Start the adventure with the scene described, then present an immediate choice or encounter. Be dramatic and specific. End your response with a clear prompt for the player's action. Use **bold** for important nouns and *italics* for sensory details. Keep the first response to 3-4 paragraphs.`;

    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: `I'm ready to begin. The world is "${world.name}". The scene: ${world.scene}` },
          ],
          max_tokens: 300,
        }),
      });
      const data = await res.json();
      setFirstResponse(data.choices?.[0]?.message?.content || 'The adventure begins...');
      setStep(3);
    } catch (err) {
      addToast('Failed to start adventure: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 0: World selection
  if (step === 0) {
    return html`
      <div class="login">
        <div class="login-card landing quickstart">
          <h1>🎮 Start a Campaign</h1>
          <p class="tagline">Choose your world. Create your hero. Begin your adventure.</p>
          <div class="world-grid">
            ${WORLD_SEEDS.map(w => html`
              <div class="world-card ${world?.name === w.name ? 'selected' : ''}"
                   onclick=${() => setWorld(w)}>
                <div class="world-name">${w.name}</div>
                <div class="world-preview">${w.scene.slice(0, 80)}...</div>
              </div>
            `)}
          </div>
          <button class="primary" onclick=${() => setStep(1)} disabled=${!world} style="width:100%;margin-top:1rem">
            Choose Your Class →
          </button>
          <div style="margin-top:.5rem">
            <button class="link-btn" onclick=${() => { authState.value = { isLoggedIn: true, token: null }; }}>← Back to home</button>
          </div>
        </div>
      </div>
    `;
  }

  // Step 1: Class selection
  if (step === 1) {
    return html`
      <div class="login">
        <div class="login-card landing quickstart">
          <h1>⚔️ Choose Your Class</h1>
          <p class="tagline">${world.name} awaits, ${charName || 'adventurer'}.</p>
          <div class="class-grid">
            ${CLASSES.map(c => html`
              <div class="class-card ${charClass?.name === c.name ? 'selected' : ''}"
                   onclick=${() => setCharClass(c)}>
                <div class="class-icon">${c.icon}</div>
                <div class="class-name">${c.name}</div>
                <div class="class-desc">${c.desc}</div>
                <div class="class-stats">HP ${c.hp} · STR ${c.stats.str} · DEX ${c.stats.dex}</div>
              </div>
            `)}
          </div>
          <div style="display:flex;gap:.5rem;margin-top:1rem">
            <button class="link-btn" onclick=${() => setStep(0)}>← Back</button>
            <button class="primary" onclick=${() => setStep(2)} disabled=${!charClass} style="flex:1">
              Name Your Hero →
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Step 2: Name your hero
  if (step === 2) {
    return html`
      <div class="login">
        <div class="login-card landing quickstart">
          <h1>✏️ Name Your Hero</h1>
          <p class="tagline">${charClass.icon} ${charClass.name} in ${world.name}</p>
          <form onSubmit=${(e) => { e.preventDefault(); if (charName.trim()) startAdventure(); }}>
            <input type="text" placeholder="What is your name, adventurer?"
              value=${charName} onInput=${e => setCharName(e.target.value)}
              disabled=${loading} autofocus maxlength="30" />
            <button type="submit" class="primary" disabled=${loading || !charName.trim()} style="width:100%">
              ${loading ? html`<span class="spinner"></span> The dice are falling...` : `🎲 Roll for Adventure`}
            </button>
          </form>
          <div style="margin-top:.5rem">
            <button class="link-btn" onclick=${() => setStep(1)}>← Back</button>
          </div>
        </div>
      </div>
    `;
  }

  // Step 3: Adventure begins — show first response then transition to chat
  if (step === 3) {
    return html`
      <div class="login">
        <div class="login-card landing quickstart adventure-start">
          <div class="adventure-header">
            <span>${charClass.icon} ${charName} the ${charClass.name}</span>
            <span class="world-label">${world.name}</span>
          </div>
          <div class="adventure-text" dangerouslySetInnerHTML=${{
            __html: firstResponse
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/\n/g, '<br>')
          }}></div>
          <button class="primary" onclick=${() => {
            // Store character context for chat
            sessionStorage.setItem('lo-character', JSON.stringify({ name: charName, class: charClass.name, world: world.name, icon: charClass.icon }));
            authState.value = { ...authState.value, isLoggedIn: true };
          }} style="width:100%;margin-top:1rem;font-size:1rem;padding:.75rem">
            Continue the Adventure →
          </button>
        </div>
      </div>
    `;
  }

  return null;
}

// Modified Login that includes the QuickStart option
export function Login() {
  const [mode, setMode] = useState('landing');
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const storeToken = (data) => {
    const token = data.token || data.accessToken || data.access_token;
    if (data.guest) {
      sessionStorage.setItem('lo-token', token);
      sessionStorage.setItem('lo-guest', '1');
    } else {
      localStorage.setItem('lo-token', token);
      localStorage.setItem('lo-userid', data.userId || data.user_id || '');
    }
    authState.value = {
      isLoggedIn: true,
      token,
      userId: data.userId || data.user_id,
      isGuest: data.guest || false,
    };
    if (data.guest) addToast(`${data.messagesRemaining} free messages remaining`);
  };

  const handleGuest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/auth/guest', { method: 'POST' });
      if (!res.ok) throw new Error(`Guest access unavailable (${res.status})`);
      const data = await res.json();
      storeToken(data);
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!passphrase.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error?.message || `Login failed (${res.status})`); }
      const data = await res.json();
      storeToken(data);
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (passphrase.length < 8) { setError('Passphrase must be at least 8 characters'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error?.message || `Registration failed (${res.status})`); }
      const data = await res.json();
      storeToken(data);
      addToast('Account created! Your passphrase unlocks your AI memory.');
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  if (mode === 'quickstart') return html`<${QuickStart} />`;

  if (mode === 'landing') {
    return html`
      <div class="login">
        <div class="login-card landing">
          <div style="font-size:2rem;margin-bottom:.5rem">🏰</div>
          <h1>DMlog.ai</h1>
          <p class="tagline">Your AI Dungeon Master remembers everything.</p>
          <button class="primary" onclick=${() => setMode('quickstart')} style="width:100%;font-size:1rem;padding:.75rem;margin-bottom:.75rem">
            🎮 Start a Campaign — No Signup
          </button>
          <div class="features">
            <div class="feature">🧠 The DM remembers every session, NPC, and plot thread</div>
            <div class="feature">🎲 Built-in dice, combat, and character tracking</div>
            <div class="feature">⚡ Multi-model AI finds the best narration</div>
            <div class="feature">🔒 Your campaign data is encrypted</div>
          </div>
          ${error && html`<div class="error">${error}</div>`}
          <button class="guest-btn" onclick=${handleGuest} disabled=${isLoading}>
            ${isLoading ? html`<span class="spinner"></span>` : '⚡ Quick play (free, 5 messages)'}
          </button>
          <div class="auth-divider"><span>or</span></div>
          <div class="auth-links">
            <button class="link-btn" onclick=${() => setMode('login')}>Sign in</button>
            <button class="link-btn" onclick=${() => setMode('register')}>Create account</button>
          </div>
          <p class="fine-print">Free forever. Open source. Your data, your rules.</p>
        </div>
      </div>
    `;
  }

  if (mode === 'login') {
    return html`
      <div class="login">
        <div class="login-card">
          <button class="back-btn" onclick=${() => { setMode('landing'); setError(null); }}>← Back</button>
          <h1>🔐 Sign In</h1>
          <p class="subtitle">Enter your passphrase to unlock your AI memory.</p>
          ${error && html`<div class="error">${error}</div>`}
          <form onSubmit=${handleLogin}>
            <input type="password" placeholder="Passphrase" value=${passphrase}
              onInput=${e => setPassphrase(e.target.value)} disabled=${isLoading} autofocus autocomplete="current-password" />
            <button type="submit" class="primary" disabled=${isLoading || !passphrase.trim()} style="width:100%">
              ${isLoading ? html`<span class="spinner"></span>` : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    `;
  }

  return html`
    <div class="login">
      <div class="login-card">
        <button class="back-btn" onclick=${() => { setMode('landing'); setError(null); }}>← Back</button>
        <h1>🔐 Create Account</h1>
        <p class="subtitle">Choose a passphrase. This is your key — write it down.</p>
        ${error && html`<div class="error">${error}</div>`}
        <form onSubmit=${handleRegister}>
          <input type="password" placeholder="Passphrase (8+ characters)" value=${passphrase}
            onInput=${e => setPassphrase(e.target.value)} disabled=${isLoading} autofocus autocomplete="new-password" minlength="8" />
          <button type="submit" class="primary" disabled=${isLoading || passphrase.length < 8} style="width:100%">
            ${isLoading ? html`<span class="spinner"></span>` : 'Create Account'}
          </button>
        </form>
        <p class="fine-print">Passphrase hashed with PBKDF2 (100K iterations). We can't reset it.</p>
      </div>
    </div>
  `;
}

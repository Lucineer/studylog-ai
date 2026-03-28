import { html, useState, useEffect } from '../preact-shim.js';
import { authState, sessionUpdated, addToast, getToken } from '../app.js';

export function NPCPanel() {
  const [npcs, setNpcs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [open, setOpen] = useState(true);
  const [character, setCharacter] = useState(null);

  // Load saved character from session storage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('lo-character');
      if (saved) setCharacter(JSON.parse(saved));
    } catch {}
  }, []);

  const fetchNPCs = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/v1/chat/npcs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setNpcs(data.npcs || []);
    } catch {
      // silently fail — NPC panel is secondary
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNPCs(); }, [sessionUpdated.value]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const diffMins = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    return `${Math.floor(diffHrs / 24)}d`;
  };

  if (!open) {
    return html`
      <div class="npc-panel collapsed" onclick=${() => setOpen(true)} title="Open NPC panel">
        <span style="writing-mode:vertical-lr;font-size:.7rem;letter-spacing:.05em">👥 ${npcs.length}</span>
      </div>
    `;
  }

  return html`
    <div class="npc-panel">
      <div class="npc-header">
        <span>👥 NPCs${npcs.length > 0 ? ` (${npcs.length})` : ''}</span>
        <div>
          <button onclick=${fetchNPCs} title="Refresh">🔄</button>
          <button onclick=${() => setOpen(false)} title="Close">✕</button>
        </div>
      </div>

      ${character ? html`
        <div class="npc-character-card">
          <div class="npc-character-name">${character.icon} ${character.name}</div>
          <div class="npc-character-class">${character.class} · ${character.world}</div>
        </div>
      ` : null}

      <div class="npc-list">
        ${loading ? html`<div class="npc-empty"><span class="spinner"></span></div>` :
          npcs.length === 0 ? html`
            <div class="npc-empty">
              <div>🎭</div>
              <div>No NPCs discovered yet.</div>
              <div style="font-size:.65rem;margin-top:4px;opacity:.6">They'll appear as the DM introduces characters.</div>
            </div>
          ` :
          npcs.map(npc => html`
            <div class="npc-item" onclick=${() => setExpanded(expanded === npc.name ? null : npc.name)}>
              <div class="npc-name">${npc.name}</div>
              ${npc.title ? html`<div class="npc-title">${npc.title}</div>` : null}
              <div class="npc-meta">${npc.mentionCount}× · ${formatTime(npc.lastMentioned)}</div>
              ${expanded === npc.name && html`
                <div class="npc-detail">
                  <div class="npc-desc">First seen: ${new Date(npc.firstMentioned).toLocaleDateString()}</div>
                  <div class="npc-desc">Last seen: ${new Date(npc.lastMentioned).toLocaleDateString()}</div>
                  <div class="npc-desc">Mentions: ${npc.mentionCount}</div>
                </div>
              `}
            </div>
          `)
        }
      </div>
    </div>
  `;
}

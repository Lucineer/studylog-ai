import { html, useState } from '../preact-shim.js';
import { MessageContent } from './message-content.js';

export function DraftPanel({ drafts, onPick, onClose }) {
  const [selected, setSelected] = useState(null);

  return html`
    <div>
      <div class="draft-panel">
        ${drafts.map((d, i) => html`
          <div class="draft-card ${selected === i ? 'selected' : ''} ${selected !== null && selected !== i ? 'dimmed' : ''}"
               onclick=${() => setSelected(i)}>
            <div class="draft-card-header">
              <span class="provider">${d.profileName || d.provider || `Option ${i + 1}`}</span>
              <span class="latency">${d.latencyMs ? `${(d.latencyMs / 1000).toFixed(1)}s` : ''}</span>
            </div>
            <div class="draft-card-body"><${MessageContent} content=${d.content} /></div>
            <div class="draft-card-actions">
              <button class="primary" onclick=${(e) => { e.stopPropagation(); onPick(i); }}>✓ Use this</button>
            </div>
          </div>
        `)}
      </div>
      <div class="draft-actions-bar">
        <button onclick=${onClose}>← Back to Chat</button>
        <span style="font-size:.75rem;color:var(--t3)">Pick the response you prefer</span>
      </div>
    </div>
  `;
}

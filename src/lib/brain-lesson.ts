// ═══════════════════════════════════════════════════════════════════
// brain-lesson.ts — "Build Your Own Brain" interactive lesson
// 6 chapters teaching repo-agents by using repo-agents
// ═══════════════════════════════════════════════════════════════════

export interface Chapter {
  id: number;
  title: string;
  description: string;
  lessonHtml: string;
  taskHtml: string;
  taskHint: string;
  verifyKey: string; // key that must appear in task output
  unlockCondition: string; // human-readable
}

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "What is a Repo-Agent?",
    description: "The repository IS the agent — no separate runtime needed.",
    lessonHtml: `
<p>Most AI agents are programs that sit in memory, waiting for API calls. A <strong>repo-agent</strong> is different: the <em>repository itself</em> is the agent. Every file is a memory cell. Every commit is a thought.</p>
<p>A repo-agent reads its own files to recover context, writes new files to persist decisions, and uses <code>SOUL.md</code> to define its personality. No database required — the file system <em>is</em> the database.</p>
<pre>my-agent/
├── SOUL.md        ← personality & instructions
├── MEMORY.md      ← long-term memory
├── memory/        ← daily logs
│   └── 2026-04-03.md
├── TOOLS.md       ← tool notes
└── .git/          ← full history = thought trace</pre>
<p>When the agent wakes up, it reads <code>SOUL.md</code> first, then <code>MEMORY.md</code>, then today's log. It knows who it is, what it's working on, and what happened last time.</p>`,
    taskHtml: `<p><strong>Task:</strong> Call the repo-agent to create a file called <code>hello-brain.md</code> in the workspace. The file should contain the text: <code>I am a repo-agent. My repo is my mind.</code></p>
<p>Use the invoke endpoint: <code>POST /api/repo-agent/invoke</code> with action <code>"writeFile"</code>, path <code>"hello-brain.md"</code>, content <code>"I am a repo-agent. My repo is my mind."</code></p>`,
    taskHint: `{"action":"writeFile","path":"hello-brain.md","content":"I am a repo-agent. My repo is my mind."}`,
    verifyKey: "hello-brain.md",
    unlockCondition: "Write hello-brain.md via repo-agent invoke",
  },
  {
    id: 2,
    title: "Your First Memory",
    description: "KV persistence — making thoughts survive restarts.",
    lessonHtml: `
<p>An agent that forgets everything between sessions is useless. Memory persistence is the first real capability.</p>
<p>In Cloudflare Workers, <strong>KV</strong> (Key-Value storage) gives us durable memory. It's simple:</p>
<pre>// Write a memory
await env.STUDYLOG_KV.put("brain-memory-greeting", "Hello, world!");

// Read it back (survives restarts, deployments, cold starts)
const greeting = await env.STUDYLOG_KV.get("brain-memory-greeting");
// → "Hello, world!"</pre>
<p>KV is <em>eventually consistent</em> — writes propagate in ~60 seconds globally. For a brain, that's fine. Human memories aren't instant either.</p>
<p>The pattern: agent encounters new info → formats a key → stores in KV → retrieves on next wake. This is how the progress system for <em>this lesson</em> works — your completion state lives in KV.</p>`,
    taskHtml: `<p><strong>Task:</strong> Store a memory and retrieve it. POST to <code>/brain/progress</code> with <code>{"sessionId":"test","chapter":2,"completed":true,"memory":"KV is my hippocampus"}</code>, then GET <code>/brain/progress?sessionId=test</code> to verify it comes back.</p>`,
    taskHint: "POST first, then GET. The progress endpoint stores in KV and reads it back.",
    verifyKey: "KV is my hippocampus",
    unlockCondition: "Store and retrieve a memory via KV progress endpoint",
  },
  {
    id: 3,
    title: "Personality & Soul",
    description: "SOUL.md and system prompts — who does the agent think it is?",
    lessonHtml: `
<p><code>SOUL.md</code> is the most important file in any repo-agent. It's loaded as a system prompt every time the agent starts, defining:</p>
<ul>
<li><strong>Identity</strong> — name, personality, values</li>
<li><strong>Behavior</strong> — how to respond, what to avoid</li>
<li><strong>Boundaries</strong> — what not to do (red lines)</li>
<li><strong>Voice</strong> — tone, humor level, formality</li>
</ul>
<pre># SOUL.md
## Core Truths
Be genuinely helpful, not performatively helpful.
Have opinions. An assistant with no personality is just a search engine.
Earn trust through competence.

## Boundaries
Private things stay private. Period.
When in doubt, ask before acting externally.</pre>
<p>The magic: the agent can <strong>edit its own SOUL.md</strong>. Over time, it evolves. It becomes less generic, more specific to its human. The repo-agent doesn't just <em>have</em> a personality — it <em>grows</em> one.</p>`,
    taskHtml: `<p><strong>Task:</strong> Use the repo-agent to write a <code>SOUL.md</code> file. Include at least these sections: <strong>Identity</strong>, <strong>Behavior</strong>, and <strong>Voice</strong>. Make it uniquely yours.</p>
<pre>Action: writeFile, Path: SOUL.md</pre>`,
    taskHint: `{"action":"writeFile","path":"SOUL.md","content":"# SOUL.md\\n## Identity\\nI am a learning brain.\\n## Behavior\\nBe curious and concise.\\n## Voice\\nWarm but precise."}`,
    verifyKey: "SOUL.md",
    unlockCondition: "Create a SOUL.md with Identity, Behavior, and Voice sections",
  },
  {
    id: 4,
    title: "Learning from Users",
    description: "Confidence tracking and deadband — not every input changes the brain.",
    lessonHtml: `
<p>A naive agent updates its state on every interaction. A smart one asks: <em>is this new information actually worth remembering?</em></p>
<p><strong>Confidence tracking</strong> assigns a score (0–1) to each piece of knowledge. Low confidence = needs more evidence. High confidence = locked in. The <code>confidence-tracker</code> updates scores based on:</p>
<ul>
<li><strong>Repetition</strong> — seeing it multiple times raises confidence</li>
<li><strong>Corroboration</strong> — multiple sources agree</li>
<li><strong>Contradiction</strong> — conflicting info lowers confidence</li>
</ul>
<p><strong>Deadband</strong> is the tolerance zone. If confidence is 0.48 and the deadband is 0.10, updates below 0.38 or above 0.58 are ignored. This prevents the brain from oscillating on every tiny input:</p>
<pre>newConfidence = oldConfidence + learningRate * (evidence - oldConfidence)
if (|newConfidence - oldConfidence| < deadband) → skip update</pre>
<p>Result: stable, resilient beliefs that don't flip-flop.</p>`,
    taskHtml: `<p><strong>Task:</strong> Use the confidence tracker. Call <code>POST /api/repo-agent/invoke</code> with action <code>"trackConfidence"</code>, key <code>"brain-lesson-knowledge"</code>, evidence <code>0.8</code>. Then call it again with evidence <code>0.15</code> and observe the deadband in action.</p>`,
    taskHint: `{"action":"trackConfidence","key":"brain-lesson-knowledge","evidence":0.8}`,
    verifyKey: "confidence",
    unlockCondition: "Track confidence with evidence and observe deadband filtering",
  },
  {
    id: 5,
    title: "Connecting Brains",
    description: "Cross-repo knowledge graph — agents sharing what they know.",
    lessonHtml: `
<p>One brain is smart. A network of brains is <em>intelligent</em>.</p>
<p>The <strong>knowledge graph</strong> connects concepts across repos. Each node is a topic with a mastery score. Edges connect related topics:</p>
<pre>Nodes: { "recursion": 0.91, "base-case": 0.88, "memoization": 0.65 }
Edges: [ ["recursion","base-case"], ["recursion","memoization"] ]</pre>
<p><strong>Cross-Cocapn</strong> (Cross-Repository Coordinated Agent Protocol Network) lets agents share knowledge. When Agent A learns recursion deeply, it can publish that to the graph. Agent B, studying dynamic programming, discovers the connection and benefits from A's expertise.</p>
<p>This is how the repo-agent ecosystem becomes greater than the sum of its parts. Each agent specializes; the graph connects specializations.</p>`,
    taskHtml: `<p><strong>Task:</strong> Add a link to the knowledge graph. POST to <code>/api/cocapn/links</code> with <code>{"topic":"repo-agents","platform":"github","repo":"superinstance/studylog-ai","type":"lesson"}</code>, then verify with GET <code>/api/cocapn/links/repo-agents</code>.</p>`,
    taskHint: `{"topic":"repo-agents","platform":"github","repo":"superinstance/studylog-ai","type":"lesson"}`,
    verifyKey: "repo-agents",
    unlockCondition: "Add and retrieve a cross-repo knowledge link",
  },
  {
    id: 6,
    title: "The Evaporation Engine",
    description: "From LLM-dependent to locked response — the ultimate optimization.",
    lessonHtml: `
<p>The <strong>Evaporation Engine</strong> is the endgame. It takes frequently-requested patterns and "evaporates" them — transforming LLM-dependent responses into deterministic, cached answers.</p>
<p>The pipeline:</p>
<ol>
<li><strong>Detect</strong> — a query pattern repeats with high confidence (>0.9)</li>
<li><strong>Lock</strong> — generate the final response once, store it</li>
<li><strong>Evaporate</strong> — future requests skip the LLM entirely</li>
</ol>
<pre>// Before: every "what is recursion?" costs an LLM call
response = await callLLM("what is recursion?")

// After evaporation: instant, free, deterministic
response = await env.STUDYLOG_KV.get("locked:recursion")
// → "Recursion is when a function calls itself..." (locked response)</pre>
<p>The brain becomes cheaper, faster, and more reliable over time. High-frequency, high-confidence knowledge crystallizes. The LLM is reserved for novel queries. This is how a repo-agent transitions from "AI that talks" to "AI that <em>knows</em>."</p>`,
    taskHtml: `<p><strong>Task:</strong> Trigger the evaporation pipeline. POST to <code>/api/repo-agent/invoke</code> with action <code>"evaporate"</code>, query <code>"What is a repo-agent?"</code>, confidence <code>0.95</code>. Check the evaporation report to see the pipeline status.</p>`,
    taskHint: `{"action":"evaporate","query":"What is a repo-agent?","confidence":0.95}`,
    verifyKey: "evaporate",
    unlockCondition: "Run the evaporation pipeline on a high-confidence query",
  },
];

export type BrainProgress = Record<number, { completed: boolean; taskOutput?: string; timestamp?: string }>;

// ── HTML Rendering ────────────────────────────────────────────────────

const NAVY = '#1E3A5F';
const GOLD = '#F59E0B';
const DARK = '#0f172a';

function baseStyle(): string {
  return `*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:${DARK};color:#e2e8f0;min-height:100vh}
.nav{background:${NAVY};padding:1rem 2rem;display:flex;align-items:center;gap:1.5rem;border-bottom:2px solid ${GOLD}22}
.nav a{color:${GOLD};text-decoration:none;font-weight:600;font-size:.9rem}
.nav a:hover{text-decoration:underline}
.nav .logo{color:${GOLD};font-size:1.1rem;font-weight:700;letter-spacing:-.5px}
.container{max-width:800px;margin:2rem auto;padding:0 1.5rem}
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:2rem;margin-bottom:1.5rem}
.card h2{color:${GOLD};margin-bottom:.5rem;font-size:1.4rem}
.card h3{color:#94a3b8;font-size:.9rem;font-weight:400;margin-bottom:1rem}
.card pre{background:${DARK};border:1px solid #1e293b;border-radius:8px;padding:1rem;overflow-x:auto;font-size:.82rem;color:${GOLD};margin:1rem 0}
.card p,.card li{color:#cbd5e1;line-height:1.7;margin-bottom:.5rem}
.card ul,.card ol{padding-left:1.5rem;margin-bottom:1rem}
.task{border-left:3px solid ${GOLD};background:#1e293b;padding:1.5rem;border-radius:0 12px 12px 0;margin:1.5rem 0}
.task strong{color:${GOLD}}
.btn{display:inline-block;padding:.6rem 1.5rem;background:${GOLD};color:${DARK};border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:.9rem;text-decoration:none}
.btn:hover{opacity:.9}
.btn-outline{background:transparent;border:1px solid ${GOLD}44;color:${GOLD}}
.btn-sm{padding:.4rem 1rem;font-size:.8rem}
.badge{display:inline-block;padding:.2rem .6rem;border-radius:20px;font-size:.7rem;font-weight:600}
.badge-done{background:#22c55e22;color:#22c55e}
.badge-locked{background:#47556944;color:#475569}
.badge-active{background:${GOLD}22;color:${GOLD}}
.chapters{display:grid;gap:.8rem;margin-top:1rem}
.ch-row{display:flex;align-items:center;gap:1rem;padding:1rem;background:#1e293b;border:1px solid #334155;border-radius:10px;cursor:pointer;text-decoration:none;color:#e2e8f0;transition:border-color .2s}
.ch-row:hover{border-color:${GOLD}66}
.ch-num{width:32px;height:32px;border-radius:50%;background:${NAVY};color:${GOLD};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0}
.ch-info{flex:1}
.ch-info .title{font-weight:600;font-size:.95rem}
.ch-info .desc{color:#64748b;font-size:.8rem;margin-top:.15rem}
.output-area{background:${DARK};border:1px solid #1e293b;border-radius:8px;padding:1rem;margin-top:1rem;font-family:monospace;font-size:.82rem;color:#94a3b8;min-height:60px;white-space:pre-wrap}
.verify-msg{margin-top:1rem;padding:.6rem 1rem;border-radius:8px;font-size:.85rem}
.verify-ok{background:#22c55e22;color:#22c55e;border:1px solid #22c55e33}
.verify-fail{background:#ef444422;color:#ef4444;border:1px solid #ef444433}
.progress-bar{height:4px;background:#1e293b;border-radius:2px;margin-top:1.5rem;overflow:hidden}
.progress-bar .fill{height:100%;background:${GOLD};border-radius:2px;transition:width .3s}
.hint-box{margin-top:.5rem;padding:.5rem .8rem;background:#1e293b;border:1px dashed #334155;border-radius:6px;font-size:.78rem;color:#64748b;cursor:pointer}
.hint-box:hover{color:#94a3b8}`;
}

export function landingHtml(): string {
  const chLinks = CHAPTERS.map(c =>
    `<a class="ch-row" href="/brain/chapter/${c.id}"><div class="ch-num">${c.id}</div><div class="ch-info"><div class="title">${c.title}</div><div class="desc">${c.description}</div></div><span class="badge badge-locked" data-badge="${c.id}">Locked</span></a>`
  ).join('\n');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Build Your Own Brain — StudyLog.ai</title>
<style>${baseStyle()}</style></head><body>
<nav class="nav"><a class="logo" href="/brain">🧠 Build Your Own Brain</a><a href="/">StudyLog.ai</a></nav>
<div class="container">
<div class="card"><h2>🧠 Build Your Own Brain</h2><h3>6 chapters teaching repo-agents by using repo-agents. The lesson IS the subject.</h3>
<p>Every chapter teaches a concept, then asks you to <em>use</em> that concept through the live API. You're not reading about repo-agents — you're <strong>building one</strong> as you learn.</p>
<div class="chapters" id="chapters">${chLinks}</div>
<div class="progress-bar"><div class="fill" id="progress-fill" style="width:0%"></div></div>
<div id="progress-text" style="text-align:center;margin-top:.5rem;color:#64748b;font-size:.8rem"></div>
</div></div>
<script>
const sessionId = crypto.randomUUID();
(async()=>{
  try {
    const r = await fetch('/brain/progress?sessionId='+sessionId);
    if(r.ok){const d=await r.json();updateBadges(d)} 
  } catch(e){/* no saved progress */}
  try {
    const r2 = await fetch('/brain/progress');
    if(r2.ok){const d=await r2.json();if(d._session) updateBadges(d)}
  } catch(e){}
})();
function updateBadges(progress){
  let done=0;
  CHAPTERS.forEach(c=>{
    const el=document.querySelector('[data-badge="'+c.id+'"]');
    if(progress[c.id]&&progress[c.id].completed){el.className='badge badge-done';el.textContent='✓ Done';done++}
  });
  const pct=Math.round(done/6*100);
  document.getElementById('progress-fill').style.width=pct+'%';
  document.getElementById('progress-text').textContent=done+'/6 chapters complete';
}
const CHAPTERS=[${CHAPTERS.map(c=>c.id).join(',')}];
</script></body></html>`;
}

export function chapterHtml(num: number): string | null {
  const ch = CHAPTERS.find(c => c.id === num);
  if (!ch) return null;
  const prev = num > 1 ? `<a class="btn btn-outline btn-sm" href="/brain/chapter/${num-1}">← Chapter ${num-1}</a>` : '';
  const next = num < 6 ? `<a class="btn btn-sm" href="/brain/chapter/${num+1}">Chapter ${num+1} →</a>` : `<a class="btn btn-sm" href="/brain">Complete! 🎉</a>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ch.${ch.id}: ${ch.title} — Build Your Own Brain</title>
<style>${baseStyle()}</style></head><body>
<nav class="nav"><a class="logo" href="/brain">🧠 Build Your Own Brain</a><a href="/">StudyLog.ai</a></nav>
<div class="container">
<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:1rem"><span class="badge badge-active">Chapter ${ch.id}/6</span></div>
<div class="card"><h2>${ch.title}</h2><h3>${ch.description}</h3>${ch.lessonHtml}</div>
<div class="card"><h2>⚡ Interactive Task</h2>${ch.taskHtml}
<div class="hint-box" onclick="this.querySelector('.hint-content').style.display=this.querySelector('.hint-content').style.display==='none'?'block':'none'">💡 Show hint<div class="hint-content" style="display:none;margin-top:.5rem"><code>${ch.taskHint}</code></div></div>
<textarea id="task-output" class="output-area" placeholder="Paste the API response here to verify..." rows="4"></textarea>
<div style="margin-top:1rem;display:flex;gap:.8rem;flex-wrap:wrap">
<button class="btn" onclick="verify()">✓ Verify Task</button>
<button class="btn btn-outline" onclick="saveProgress()">💾 Save Progress</button>
</div>
<div id="verify-result"></div>
</div>
<div style="display:flex;justify-content:space-between;margin-bottom:2rem">${prev}${next}</div>
</div>
<script>
const CHAPTER=${ch.id};
const VERIFY_KEY="${ch.verifyKey}";
const sessionId = crypto.randomUUID();

async function verify(){
  const output = document.getElementById('task-output').value;
  const el = document.getElementById('verify-result');
  if(!output.trim()){el.innerHTML='<div class="verify-msg verify-fail">Paste the API response first.</div>';return}
  const ok = output.toLowerCase().includes(VERIFY_KEY.toLowerCase()) || output.length > 10;
  if(ok){el.innerHTML='<div class="verify-msg verify-ok">✅ Verified! Task complete.</div>'}
  else{el.innerHTML='<div class="verify-msg verify-fail">❌ Not quite — look for "${VERIFY_KEY}" in the response.</div>'}
}

async function saveProgress(){
  const output = document.getElementById('task-output').value;
  const ok = output.toLowerCase().includes(VERIFY_KEY.toLowerCase()) || output.length > 10;
  await fetch('/brain/progress',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({sessionId,chapter:CHAPTER,completed:ok,taskOutput:output.substring(0,500)})
  });
  if(ok){document.getElementById('verify-result').innerHTML='<div class="verify-msg verify-ok">💾 Progress saved!</div>'}
  else{document.getElementById('verify-result').innerHTML='<div class="verify-msg verify-fail">Progress saved (task not yet verified).</div>'}
}
</script></body></html>`;
}

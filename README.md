<p align="center">
  <img src="https://raw.githubusercontent.com/Lucineer/capitaine/master/docs/capitaine-logo.jpg" alt="Capitaine" width="120">
</p>

<h1 align="center">studylog-ai</h1>

<p align="center">An AI tutor that maintains a memory of your learning sessions.</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#limitations">Limitations</a> ·
  <a href="https://github.com/Lucineer/studylog-ai/issues">Issues</a>
</p>

---

Most AI tutors treat each conversation as a fresh start. This one persists between sessions, remembering your past questions, strengths, and weak points. It's designed for learning that happens across multiple days and contexts.

You run it yourself. Fork this repository and deploy it to your own Cloudflare account. You own all the data.

---

### How It Works
This is an agent built with the Cocapn fleet. It runs in a single Cloudflare Worker.
- It stores your conversation history and learning state in a durable object, accessible when you return.
- It structures lessons and generates scannable study slides.
- It schedules periodic review questions based on a simple forgetting curve.

It is a standard fleet vessel. You can modify its behavior by editing the source.

**Live Demo:** [studylog-ai](https://studylog-ai.casey-digennaro.workers.dev) · **Built with:** [Capitaine](https://github.com/Lucineer/capitaine) · [Cocapn](https://cocapn.ai)

---

## Quick Start
1.  Fork this repository.
2.  Clone your fork and install dependencies:
    ```bash
    git clone https://github.com/your-username/studylog-ai.git
    cd studylog-ai
    npm install
    npx wrangler login
    ```
3.  Set your API key as a secret:
    ```bash
    npx wrangler secret put DEEPSEEK_API_KEY
    ```
4.  Deploy:
    ```bash
    npx wrangler deploy
    ```

Your private AI tutor will be running at your assigned `*.workers.dev` subdomain.

## Features
*   **Session Memory**: Maintains state between visits using Cloudflare Durable Objects.
*   **Structured Output**: Generates annotated slides instead of walls of text.
*   **Adaptive Review**: Schedules review questions based on a basic forgetting curve.
*   **Self-Hosted**: Your data remains in your Cloudflare account.

## Limitations
This is an early implementation. The review scheduler is a basic heuristic and may not be as precise as dedicated spaced repetition software. The agent's curriculum-building logic is currently focused on conversational, open-ended learning rather than a strict, predefined syllabus.

---

<div align="center">
  <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> ·
  <a href="https://cocapn.ai">Cocapn</a>
</div>

*Attribution: Superinstance & Lucineer (DiGennaro et al.)*
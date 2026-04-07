<p align="center">
  <img src="https://raw.githubusercontent.com/Lucineer/capitaine/master/docs/capitaine-logo.jpg" alt="Capitaine" width="120">
</p>

<h1 align="center">studylog-ai</h1>

<p align="center">An AI tutor that uses session memory for more consistent study sessions.</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#limitations">Limitations</a> ·
  <a href="https://github.com/Lucineer/studylog-ai/issues">Issues</a>
</p>

---

Most AI tutors reset when you close the tab. This one uses a simple memory system to recall prior session topics.

### Why this exists
Learning happens over multiple sessions. This agent was built to provide a more consistent tutor across a study period. It references your stated learning gaps and adjusts material difficulty based on past quiz performance.

This is a self-hosted agent. You fork and run it on your own Cloudflare account.

**Live Demo:** [studylog-ai](https://studylog-ai.casey-digennaro.workers.dev) · **Built with:** [Capitaine](https://github.com/Lucineer/capitaine) · [Cocapn](https://github.com/Lucineer/cocapn)

This repository is a cocapn vessel—a self-contained agent that runs on Cloudflare Workers, uses LLMs for reasoning, and can coordinate with other vessels in the fleet.

---

## Quick Start

1. **Fork and clone** this repository.
2. **Install dependencies** and log in with Wrangler:
   ```bash
   npm install
   npx wrangler login
   ```
3. **Set required secrets** for GitHub and your LLM provider (e.g., DeepSeek):
   ```bash
   npx wrangler secret put GITHUB_TOKEN
   npx wrangler secret put DEEPSEEK_API_KEY
   ```
4. **Deploy** the agent:
   ```bash
   npx wrangler deploy
   ```

Your tutor agent is now running on your Cloudflare Workers subdomain.

## Features

* **Session Memory**: Maintains context across visits within the same browser session.
* **Slide Generation**: Creates structured slides with annotations for a given topic.
* **Adaptive Quizzes**: Generates questions based on previously covered material.
* **Spaced Repetition Scheduling**: Suggests review intervals using a simple forgetting curve model.
* **Multi-Model Support**: Works with DeepSeek, SiliconFlow, DeepInfra, and Moonshot via BYOK routing.
* **Local Data Control**: All session state is stored in your Cloudflare Durable Object.
* **Fleet Protocol**: Native coordination via the CRP-39 agent communication standard.

## Limitations

The agent's memory is session-based and stored in a Cloudflare Durable Object. If you deploy a new version or manually reset the Durable Object, past session history will be lost. It does not currently support cross-browser or long-term persistent memory without manual backup.

## Architecture

A single-file Cloudflare Worker with no external runtime dependencies. All logic is contained within the repository.

```
src/
  worker.ts      # Main Worker entry point
lib/
  byok.ts        # Multi-model API routing
  memory.ts      # Session state management
  curriculum.ts  # Quiz and progression logic
```

## The Fleet

studylog-ai is one vessel in the open-source Lucineer fleet. Each vessel is an independent, self-improving agent that can communicate and cooperate with others.

<div align="center">
  <a href="https://the-fleet.casey-digennaro.workers.dev">Explore the Fleet</a> ·
  <a href="https://cocapn.ai">Learn about Cocapn</a>
</div>

**Attribution:** Superinstance & Lucineer (DiGennaro et al.).
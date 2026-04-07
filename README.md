# studylog-ai
Helps you retain what you learn. This tutor attempts to track where you struggle and prompts you to review it later. You run the instance, so all your data stays with you.

📝 **Live Demo:** [studylog-ai](https://studylog-ai.casey-digennaro.workers.dev)

## Why This Exists
AI tutors often lose context after a few messages, forcing you to repeatedly re-explain your knowledge gaps. This project is an attempt to provide a simple, self-hosted alternative with persistent memory.

## What Makes This Different
1.  **Stateful Sessions**: It uses a scoring system to track concepts you've marked as difficult and may ask about them in future sessions.
2.  **You Own It**: Fork this repository and deploy it yourself. All conversation data and memory are stored in your own Cloudflare account.
3.  **One File, Zero Dependencies**: The core logic is a single Cloudflare Worker file. There is no external database or complex infrastructure to manage.

## Quick Start
This is fork-first. You will own and operate your copy.
1.  **Fork** this repository to your GitHub account.
2.  **Clone & Deploy** to Cloudflare Workers:
    ```bash
    git clone https://github.com/your-username/studylog-ai.git
    cd studylog-ai
    npx wrangler login
    npx wrangler secret put DEEPSEEK_API_KEY # Your API key
    npx wrangler deploy
    ```
3.  **Customize** the agent's behavior by editing the source `src/index.js` directly.

## How It Works
A single Cloudflare Worker uses a Durable Object as persistent storage for your learning history. A lightweight director function decides, based on simple rules and spaced repetition scheduling, whether to present new material, quiz you, or initiate a review.

## Features
*   **Persistent Memory**: Stores your lesson history, self-reported confidence scores, and scheduled reviews in a Cloudflare Durable Object.
*   **Structured Lessons**: Attempts to break topics into discrete slides with key takeaways.
*   **Adaptive Review**: Schedules practice using a basic SM2 spaced repetition algorithm.
*   **Multi‑Profile Support**: Creates isolated memory contexts for different subjects or users via URL paths.
*   **Confidence Tracking**: Logs your self-assessed certainty to help prioritize review.
*   **Cross‑Fleet Calls**: Can request information from other agents in the Cocapn Fleet.
*   **BYOK LLMs**: Configure your own API keys for supported LLM providers.

## Limitations
The spaced repetition system uses a fixed, unconfigurable implementation of the SM2 algorithm. You cannot adjust review intervals or parameters without modifying the source code.

## License
MIT License. Use, modify, and distribute it freely.

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>
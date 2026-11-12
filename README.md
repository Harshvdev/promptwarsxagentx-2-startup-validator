# SparkProof — Multi-Agent Startup Co-Pilot (PS08)

SparkProof is a single-repo Next.js (App Router) + Bun web application that validates startup ideas using a 3-stage multi-agent pipeline grounded in live web research.

## Architecture

1. **Stage 1 (`Idea Framer`):** Parses a raw startup idea into category, business model, problem statement, and 4 targeted search queries.
2. **Stage 2 (4 Parallel Specialist Agents via `Promise.all` + SSE):**
   - **Market Analyst:** `TinySearch` + `TinyFetch` → TAM / SAM / SOM, CAGR, tailwinds, headwinds, verified citations.
   - **Competitor Intel:** `TinySearch` + `TinyFetch` + optional `TinyAgent` deep extraction (with automatic fallback to `TinyFetch` if credits run out or fail) → positioning, pricing, and white-space gaps.
   - **Customer Profiler:** Builds Demand/Supply ICP personas, willingness-to-pay estimates, and 5 Mom-Test discovery questions.
   - **Devil's Advocate:** Honest 100-pt Viability Score, 5-axis breakdown, unit economics reality check, fatal risks + mitigations, and pivot suggestions.
3. **Stage 3 (`Execution Planner`):** Synthesizes all findings into a 90-day MVP & GTM roadmap + First 10 Customers playbook.

## Local Setup (Bun)

1. Install dependencies:
   ```bash
   bun install
   ```
2. Create `.env.local` from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in `GEMINI_API_KEY`, `GROQ_API_KEY` (automatic fallback), and `TINYFISH_API_KEY`.
3. Run the development server:
   ```bash
   bun dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push this repository to GitHub (`.env*` is gitignored).
2. Import the repo in Vercel and add `GEMINI_API_KEY`, `GROQ_API_KEY`, and `TINYFISH_API_KEY` under **Project Settings → Environment Variables**.
3. Deploy — `maxDuration` is configured on `/api/analyze` (`300s`) and `/api/copilot` (`60s`), and browser `localStorage` handles saved history with zero database required.

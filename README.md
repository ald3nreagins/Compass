# Compass

**Know before the market does.**

Compass is a due-diligence tool for venture capital investors and startup founders. It transcribes and analyzes pitch videos, news, and market events — turning unstructured video, audio, and text into structured, sourced signals for investment decisions.

Built at Steelhacks, September 19–20, 2026.

---

## The Problem

Venture teams review dozens of pitch videos, market updates, and news clips every week — most of it unstructured video and audio that never makes it into a searchable record. By the time something relevant surfaces, the moment to act on it has often passed.

On the other side, founders raising capital have no easy way to know which investors are actually a fit for their business, or to get structured feedback on how their pitch reads to an outside evaluator.

## What Compass Does

**For investors:**
- Upload a portfolio of companies you've invested in
- Submit a video, article, or block of text — a news clip, an earnings call, a competitor announcement
- Compass tells you which of your holdings are affected, how, and how urgently — grounded in what was actually said, not inferred

**For founders:**
- Submit your pitch video, deck text, or press coverage
- Get a structured evaluation: product description, target market, stated metrics, founder credibility signals, key claims (flagged as claims, not verified facts), risks, and investment readiness
- (Planned) Surface VC firms whose stated investment thesis matches your business

## How It Works

1. **Ingest** — a video URL, an article URL, an uploaded file, or pasted text
2. **Transcribe** — audio is transcribed via the ElevenLabs Speech-to-Text API; article/text sources skip straight to step 3
3. **Analyze** — the transcript or text is passed to Claude with a structured extraction prompt, tuned for either pitch evaluation or portfolio-impact assessment
4. **Persist** — every analysis is saved to a user's history, backed by Postgres (Supabase)
5. **Review** — results are shown as a color-coded, plain-language summary — never raw JSON

When content has no genuine bearing on an investment decision, Compass says so directly rather than forcing a connection that isn't there.

## Tech Stack

**Backend**
- Java 21, Spring Boot
- Spring Security with JWT authentication
- Spring Data JPA + PostgreSQL (hosted on Supabase)
- ElevenLabs API (speech-to-text)
- Anthropic Claude API (structured analysis)
- Jsoup (article text extraction)
- yt-dlp (video/audio retrieval)

**Frontend**
- React 19 + Vite
- React Router
- Tailwind CSS
- Recharts

## Getting Started

### Prerequisites
- Java 21+
- Node.js 18+
- Python 3 with `yt-dlp` installed (`pip install yt-dlp`)
- A Supabase (or other Postgres) database
- API keys: ElevenLabs, Anthropic

### Backend
```bash
# Set required environment variables
export SUPABASE_DB_PASSWORD=your_password
export JWT_SECRET=$(openssl rand -base64 32)
export ELEVENLABS_API_KEY=your_key
export ANTHROPIC_API_KEY=your_key

./mvnw spring-boot:run
```
The API runs on `http://localhost:8080`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
The app runs on `http://localhost:5173`.

## API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/signup` | POST | Create an account |
| `/api/auth/login` | POST | Authenticate, returns a JWT |
| `/api/transcribe` | POST | Analyze an uploaded audio/video file |
| `/api/transcribe/url` | POST | Analyze a video by URL (pitch evaluation) |
| `/api/transcribe/url/portfolio-impact` | POST | Analyze a video by URL (portfolio impact) |
| `/api/transcribe/text` | POST | Analyze pasted text |
| `/api/transcribe/text-url` | POST | Analyze an article by URL |
| `/api/transcribe/history` | GET | Retrieve a user's past analyses |
| `/api/portfolio/holdings` | GET | Retrieve portfolio holdings |

All `/api/transcribe/**` endpoints require a `Bearer` token from `/api/auth/login`.

## Roadmap

- VC-firm matching for founders based on stated investment thesis
- Team accounts and shared portfolio views
- Slack/email alerts for high-urgency portfolio signals
- Expanded source support beyond YouTube and open-access articles

## Contributors

| Name | GitHub | LinkedIn |
|---|---|---|
| Steven Rocca | [@stevenrocca3](https://github.com/stevenrocca3) | [steven-rocca](https://www.linkedin.com/in/steven-rocca-24031b303/) |
| Alvin Pan | [@blizzardblaze174](https://github.com/blizzardblaze174) | [alvin-pan1](https://www.linkedin.com/in/alvin-pan1/) |
| Alden Reagins | — | — |
| Matt | — | — |

## License

This project was built for a hackathon and is provided as-is, without warranty.

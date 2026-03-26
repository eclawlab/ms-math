# MS Math Tutor

A conversational AI-powered middle school math tutoring platform for grades 6-8, featuring adaptive learning, multiple tutor personas, and 240+ interactive PhET simulations.

## Features

- **5 Math Domains**: Numbers & Operations, Algebra, Geometry, Ratios & Proportions, Data & Probability
- **3 Tutor Personas**: Methodical (step-by-step), Competitive (challenge-driven), Creative (story-based)
- **Adaptive Learning**: Prerequisite gates, difficulty scaling, spaced repetition, and smart routing
- **PhET Simulations**: 240+ interactive math simulations embedded directly in the chat experience
- **Pedagogical Phases**: Exercises, virtual labs, CER (Claim-Evidence-Reasoning), diagrams, and vocabulary
- **Progress Tracking**: Per-skill mastery bars, streak tracking, and session history
- **Chinese Language UI**: Full Chinese-language interface for students

## Quick Start

```bash
./startup.sh
```

Or:

```bash
cd tutor && npm start
```

Then open **http://localhost:3901** in your browser.

## Project Structure

```
ms-math/
├── startup.sh              # Quick start script
├── server.js               # Standalone PhET lab server
├── tutor/
│   ├── server.js           # Main Express server (tutor + lab)
│   ├── lib/
│   │   ├── orchestrator.js # Turn processing pipeline
│   │   ├── router.js       # Intent routing & prerequisites
│   │   ├── state.js        # Session & persistence
│   │   ├── loader.js       # Skill module loader
│   │   └── wrapper.js      # Persona formatting
│   ├── prompts/            # Tutor persona & routing config
│   ├── skills/             # Math domain modules
│   │   ├── ms-math-numbers/
│   │   ├── ms-math-algebra/
│   │   ├── ms-math-geometry/
│   │   ├── ms-math-ratios/
│   │   ├── ms-math-data/
│   │   └── ms-math-study-planner/
│   └── public/             # Frontend SPA (HTML/CSS/JS)
├── numbers/                # PhET simulations by domain
├── algebra/
├── geometry/
├── ratios/
├── data-probability/
└── framework/              # PhET framework libraries
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/start` | Start or resume a session |
| POST | `/api/turn` | Process a student message |
| GET | `/api/progress/:studentId` | Get mastery dashboard |
| GET | `/api/session/:studentId` | Get session state |
| GET | `/api/simulations` | Get PhET simulation catalog |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3901` | Server port |

Student session data is stored as JSON files in `$HOME/data/sessions/`.

## Tech Stack

- Node.js + Express
- Vanilla JavaScript frontend (SPA)
- JSON file-based persistence
- PhET interactive simulations

# ⚔️ CodeClash — Gamified Competitive DSA Platform

> Transform monotonous Data Structures & Algorithms practice into an exhilarating real-time eSport. Level up through concept-based DSA skill trees, battle peers in live 1v1 duels, earn milestone badges, and receive senior-engineer AI code reviews.

---

## 🌟 Overview

Grinding Data Structures and Algorithms is notoriously repetitive, solitary, and prone to burnout. Traditional platforms present endless, disconnected problem lists with no sense of urgency, momentum, or peer engagement.

**CodeClash reinvents algorithmic learning through competitive mechanics:**
- **Skill Tree Roadmaps**: Guided progression through 8 core computer science disciplines with unlockable tiers.
- **Synchronized 1v1 Battles**: Real-time matchmaking with live opponent test telemetry and server-authoritative Elo ratings.
- **Instant AI Coaching**: Line-by-line code breakdowns, time/space complexity audits ($O(N)$), and edge-case hints.
- **Deep Gamification**: Level formulas, streak multipliers, achievement badges, and seasonal leaderboards.
- **Zero-Friction Local Execution**: Built-in persistent file database fallback so you can clone and run immediately without installing or configuring external database servers.

---

## 🚀 Key Features

- **🌲 Concept-Based DSA Skill Trees**: 8 core tracks (Arrays, Linked Lists, Trees, Graphs, DP, Greedy, etc.) with 4 progressive unlock tiers and real-time mastery tracking.
- **⚡ Live 1v1 Battle Arena**: Server-authoritative WebSocket matchmaking (`/ws/matchmaking`), 30:00 synchronized timer, live opponent test telemetry, and Elo ratings (+25/-20).
- **🤖 Solo Practice vs AI Bot**: Instant 1-click duel against `Nexus_AI_Bot` with realistic simulated problem solving and test submission timing.
- **💻 Monaco IDE & Sandbox Runner**: Multi-language code editor (Python, JavaScript, C++, Java) with sub-millisecond execution benchmarking against public & hidden test suites.
- **🧠 Senior AI Code Explainer**: Line-by-line algorithm analysis and asymptotic Big-O breakdown powered by Gemini AI with built-in zero-config fallback.
- **🏆 Gamification & Leaderboards**: Dynamic level progression ($\text{Level} = \lfloor \sqrt{\text{XP} / 25} \rfloor + 1$), UTC daily streaks, Clash Coins economy, and milestone achievements.

---

## 🛠️ System Architecture

```
+-------------------------------------------------------------------------------+
|                       Frontend (Next.js 15 + TypeScript)                      |
|   • Monaco Code Editor (Multi-Lang)            • Real-Time Battle Arena       |
|   • Concept Skill Tree Roadmap                 • Global & Seasonal Ranks      |
+-------------------------------------------------------------------------------+
                       │                                   ▲
      HTTP REST / JSON │                                   │ WebSockets
      (Auth, Problems) │                                   │ (Telemetry & Sync)
                       ▼                                   ▼
+-------------------------------------------------------------------------------+
|                         Backend (FastAPI + Python 3)                          |
|   • Sandboxed Code Execution Engine            • WebSocket Battle Manager     |
|   • Gamification (XP, Streaks, Elo)            • AI Algorithmic Explainer     |
+-------------------------------------------------------------------------------+
                       │                                   │
                       ▼                                   ▼
+------------------------------------+   +--------------------------------------+
|       Primary: MongoDB Atlas       |   |       Fallback: Local JSON Store     |
|   (Auto-detected if available)     |   |   (Auto-used if MongoDB is offline)  |
+------------------------------------+   +--------------------------------------+
```

---

## 🔍 How Everything Works Under the Hood

### 1. Dual-Engine Storage Architecture
The backend auto-detects if MongoDB is reachable on startup. If offline, it seamlessly falls back to a thread-safe, JSON-backed document storage in `backend/data_store/`. Anyone can clone and run the full platform with zero database setup.

### 2. Matchmaking & Live Battle Lifecycle
1. **Queue**: Players connect to `/ws/matchmaking` with their JWT token.
2. **Pairing**: Matchmaking pairs players by rating or matches instantly with `Nexus_AI_Bot`.
3. **Room & Sync**: Both players receive the problem statement and a synchronized 30:00 countdown clock.
4. **Live Telemetry**: When a player runs tests, their progress count is broadcast to their opponent over WebSockets without exposing solution code.
5. **Win Resolution**: First player to pass 100% of hidden test cases wins rating points (+25 Elo), XP, and Clash Coins.

### 3. Sandboxed Execution Pipeline
User code is wrapped with language-specific test harnesses and executed in isolated sub-processes with strict execution timeouts (3-5s) to guard against infinite loops and memory exhaustion.

### 4. AI Explainer Service
Analyzes code snippets for time & space complexity, pattern recognition, and optimization recommendations using Google Gemini AI, with an intelligent built-in static analysis engine fallback.

---

## 📁 Repository Structure

```
Gamified-Coding-Platform/
├── backend/                  # FastAPI server, sandbox runner & database
│   ├── data_store/           # Pre-seeded local JSON fallback database
│   ├── ai_service.py         # Gemini AI & fallback code analyzer
│   ├── battle_manager.py     # Real-time WebSocket 1v1 matchmaking engine
│   ├── execution_engine.py   # Multi-language sandboxed code executor
│   ├── gamification.py       # Elo rating, XP curves, and badge logic
│   ├── server.py             # Main FastAPI application and API routes
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend configuration template
│
├── frontend/                 # Next.js 15 App Router & React frontend
│   ├── src/
│   │   ├── app/              # Application routes (battle, practice, dashboard)
│   │   ├── components/       # Monaco editor, navigation header, UI components
│   │   └── lib/              # Auth state, API client, and TypeScript types
│   ├── package.json          # Node dependencies & scripts
│   ├── tailwind.config.ts    # Tailwind styling system
│   └── .env.example          # Frontend configuration template
│
├── package.json              # Root script to run full stack simultaneously
├── .gitignore                # Git ignore rules for Python, Next.js, and keys
└── README.md                 # Project documentation
```

---

## 🏁 Quickstart Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **Python** (v3.10 or higher)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/the-ayush-ch0udhary/Gamified-Coding-Platform.git
cd Gamified-Coding-Platform
```

---

### Step 2: Configure Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
```

**Frontend:**
```bash
cd ../frontend
cp .env.example .env.local
```

---

### Step 3: Setup & Launch Backend

```bash
cd ../backend

# Create and activate virtual environment (optional)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Seed problems, DSA skill tracks, and badges
python seed_problems.py

# Start FastAPI server
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
*Backend API is live at `http://localhost:8001` (API docs at `http://localhost:8001/docs`).*

---

### Step 4: Setup & Launch Frontend

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend is live at `http://localhost:9002`.*

---

### Step 5: (Alternative) Run Full Stack with One Command
From the project root directory:
```bash
npm install
npm run dev
```

---

## 🎮 How to Test 1v1 Battles Locally

### Option A: Solo Practice vs AI Arena Bot
1. Navigate to `http://localhost:9002` and log in or register.
2. Go to the **Battle** page from the navigation bar.
3. Click **"Practice vs Arena AI"** for an instant match against `Nexus_AI_Bot`.

### Option B: Multiplayer Duel (2 Browser Windows)
1. Open **Browser 1** (e.g., Chrome): Log in as Player 1 and open `/battle`.
2. Open **Browser 2** (e.g., Incognito / Firefox): Log in as Player 2 and open `/battle`.
3. In both windows, select the same difficulty and click **"Enter Ranked 1v1 Queue"**.
4. The matchmaking engine will pair both players, sync the 30-minute timer, and stream real-time opponent test telemetry.

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new account (initial Elo: 1200) |
| `POST` | `/api/auth/login` | Authenticate credentials and return JWT bearer token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile, stats, streak, and coins |

### 🌲 DSA Concepts & Skill Tree (`/api/concepts`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/concepts` | Retrieve all 8 DSA concepts with unlocked level statuses |
| `GET` | `/api/concepts/{concept_id}/levels` | Get tiered progression levels for a concept |
| `GET` | `/api/concepts/{concept_id}/mastery` | Calculate player mastery percentage |

### 💻 Problems & Execution (`/api/problems`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/problems` | List problems with filters (difficulty, concept, status) |
| `GET` | `/api/problems/{problem_id}` | Retrieve problem description, examples, and starter code |
| `POST` | `/api/problems/{problem_id}/run` | Execute code against sample test cases |
| `POST` | `/api/problems/{problem_id}/submit` | Verify code against hidden test cases & award XP |

### ⚡ Battles & Real-Time (`/api/battles`, `/ws`)
| Method | Endpoint | Description |
|---|---|---|
| `WS` | `/ws/matchmaking` | WebSocket connection for 1v1 matchmaking queue |
| `WS` | `/ws/battle/{battle_id}` | WebSocket room for live battle telemetry & timer sync |
| `POST` | `/api/battles/create-bot-match` | Create an instant solo match against `Nexus_AI_Bot` |
| `GET` | `/api/battles/{battle_id}` | Get battle state, participants, problem, and scores |

### 🏆 Leaderboards & Badges (`/api/leaderboard`, `/api/badges`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leaderboard/global` | Global Elo rankings with user rank positioning |
| `GET` | `/api/leaderboard/weekly` | Weekly competitive leaderboard |
| `GET` | `/api/badges` | List all available achievement badges |

### 🤖 AI Explainer (`/api/explainer`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/explainer/explain` | Senior-engineer code explanation & Big-O complexity breakdown |

---

## 📄 Copyright & Notice
Copyright © 2026 CodeClash. All rights reserved.  
Unauthorized commercial distribution or duplication of this platform without prior authorization is strictly prohibited.

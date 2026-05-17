# 🐴 Kazhuthai (Donkey Card Game)

A complete, production-ready real-time multiplayer web card game based on the traditional South Indian classic elimination card game **"Kazhuthai"** (Tamil: கழுதை, translating to "Donkey").

This game features **Strictly Human-Only Matchmaking**—specifically omitting bots, single-player campaigns, or NPC logic to focus entirely on authoritative game synchronization, responsive room lifecycles, and a high-fidelity card felt aesthetic.

---

## 🎮 Game Rules & Mechanics

Kazhuthai is a strategic multiplayer elimination card game played using a standard 52-card deck among **3 to 6 players**. The goal of the game is to **discard all cards in hand** and avoid being the last player holding cards (who becomes the "Kazhuthai" / Donkey / Loser).

### 🃏 Ranks and Priorities
*   **Deck**: Standard 52 cards (Spades ♠, Hearts ♥, Diamonds ♦, Clubs ♣).
*   **Rank Priority**: **Ace is highest** (`A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3 > 2`).
*   **Distribution**: Cards are dealt circular-evenly. Remaining extra cards are distributed clockwise starting from the first player.

### 🌟 Strict First Round Rule
1.  The game searches the dealt hands to locate the player holding the **Ace of Spades (♠A)**.
2.  That player **MUST** start the game.
3.  The very first card played in the entire game **MUST** be `♠A`. Any other play is strictly blocked by the server's anti-cheat engine.
4.  All other players must follow with Spades in clockwise turn order if they hold Spades.

### 🔄 Normal Round Flow (Clearing Cards)
*   **Follow Suit**: Once a suit is opened by the lead player, every next player **must play the same suit** if they have it.
*   **Trick Resolution**: If all active players followed the led suit successfully, the round is a **Normal Clear**:
    *   All cards in the center are **permanently discarded** (removed from the game).
    *   No player collects cards.
    *   The player who played the **highest-ranked card** of the led suit starts the next round.

### ⚡ Break Rule (Suit collection)
*   If a player **does not possess** cards of the opened suit, they are allowed to play **any card from another suit** (this is called a **BREAK**).
*   The moment a BREAK is played, the round **terminates immediately**. Circular rotations halt and subsequent players do not play.
*   **Break Resolution**:
    *   The player who played the **highest-ranked card** of the led suit must **collect all cards played** in the round.
    *   These cards return to their active hand, increasing their deck.
    *   The collecting player then starts the next round.

### 🏆 Winning & Elimination
*   A player becomes **SAFE** the moment their hand size reaches `0` cards (provided they did not just collect a break pile). Safe players exit and are skipped in future rotations.
*   The last player remaining with cards in hand loses the game and is declared the **KAZHUTHAI** (Donkey), receiving a funny donkey animation and a coin penalty.

---

## 🛠️ Technology Stack

### Backend Services (`/backend`)
*   **Core**: Node.js & Express.js
*   **Realtime**: Socket.IO for double-handshake states synchronization
*   **Database**: MongoDB & Mongoose (with automated stateful **in-memory fallbacks** if MongoDB local or cloud is disconnected, guaranteeing 100% startup reliability)
*   **Auth**: JSON Web Tokens (JWT) protecting frictionless anonymous one-click entries and profile renaming


### Frontend Client (`/frontend`)
*   **Framework**: React + Vite (React 19 support)
*   **Styling**: Tailwind CSS v3 with sleek felt green poker designs, glassmorphisms, and responsive grids
*   **Animations**: Framer Motion for card flipping, center pile fanning, emoji bursts, and victory popups
*   **Audio**: Web Audio API Sound Synthesizer (synthesizes card flicks, shuffles, alerts, and victory chimes in real-time with **zero** external MP3 assets to download)

---

## 📁 Repository Directory Structure

```
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & fallback settings
│   ├── middleware/
│   │   └── auth.js               # JWT express protection middleware
│   ├── models/
│   │   ├── User.js               # Mongoose schema for User profiles
│   │   └── Match.js              # Mongoose schema for game histories
│   ├── game/
│   │   ├── cardDeck.js           # Deck shuffling and deal distributions
│   │   ├── gameEngine.js         # Authoritative traditional rule validations
│   │   └── socketHandlers.js     # Lobby actions, turn timers, and auto-play loops
│   ├── .env                      # Server configuration variables
│   ├── package.json              # Backend package registry
│   └── server.js                 # HTTP Express and Socket.IO entry point
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Card.jsx          # Motion-animated vector playing card
    │   │   ├── GameBoard.jsx     # Greenfelt felt table, player circle, reactions
    │   │   ├── LobbyPanel.jsx    # Room roster, host launches, chat boards
    │   │   ├── AuthPanel.jsx     # One-click Anonymous Login Card & Avatar Picker

    │   │   ├── RoomSelection.jsx # Public room browser lists, custom room creations
    │   │   ├── ProfilePanel.jsx  # Player stats, coin wallets, logout panel
    │   │   ├── LeaderboardPanel.jsx # Top players rankings podium
    │   │   └── SettingsPanel.jsx # Audio sliders, rules sheets
    │   ├── context/
    │   │   ├── AuthContext.jsx   # HTTP JWT registrations & profile fetches
    │   │   └── SocketContext.jsx # Socket emits, ticks, floating emoji reactions
    │   ├── utils/
    │   │   └── soundManager.js   # Realtime Synthesizer Web Audio API
    │   ├── App.css               # Clean styling resets
    │   ├── index.css             # Tailwind base setups, scrollbars, glows
    │   ├── App.jsx               # Client wrapper and routes mount
    │   └── main.jsx              # React DOM compiler mounting
    ├── tailwind.config.js        # Felt green customized color palettes
    ├── postcss.config.js         # Tailwind PostCSS compiler configs
    ├── index.html                # App entry with locked viewport zoom bounds
    ├── package.json              # Frontend package registry
    └── vite.config.js            # Vite compiler configuration
```

---

## 🚀 Local Quickstart Guide

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm (v9 or higher)
*   MongoDB (Optional - Server automatically uses in-memory states fallback if MongoDB is not running locally!)

### 1. Launch the Backend Server
1.  Open your terminal and navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install all backend dependencies:
    ```bash
    npm install
    ```
3.  Configure variables in the `.env` file (pre-configured with defaults):
    ```env
    PORT=5000
    MONGO_URI=mongodb://127.0.0.1:27017/kazhuthai
    JWT_SECRET=jwt_secret_key_123_kazhuthai
    ```
4.  Start the development server using nodemon:
    ```bash
    npm run dev
    ```
    *The server will log `MongoDB Connected` or log a warning `WARNING: Running in In-Memory/Stateful Mock DB Mode!` if MongoDB isn't active, continuing seamlessly.*

### 2. Launch the Frontend Client
1.  Open a second terminal window and navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install all frontend dependencies:
    ```bash
    npm install
    ```
3.  Launch the Vite React development server:
    ```bash
    npm run dev
    ```
4.  Open the logged URL (usually `http://localhost:5173`) in multiple browser tabs or windows to simulate live players joining the table!

---

## ☁️ Cloud Deployment Guide

### Database (MongoDB Atlas)
1.  Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Spin up a Shared Cluster and create a database user with read/write access.
3.  Whitelist IP access (`0.0.0.0/0` for server hosts like Render/Railway).
4.  Copy your database connection URI: `mongodb+srv://<username>:<password>@cluster.mongodb.net/kazhuthai?retryWrites=true&w=majority`.

### Backend (Render / Railway / Heroku)
1.  Push your code repository to GitHub.
2.  Create a new Web Service on [Render](https://render.com) or [Railway](https://railway.app) pointing to your project.
3.  Set the **Root Directory** to `backend`.
4.  Set the **Build Command** to `npm install` and **Start Command** to `npm start`.
5.  Add the Environment Variables:
    *   `PORT` = `5000` or automatically assigned by host.
    *   `MONGO_URI` = *Your MongoDB Atlas Connection String*
    *   `JWT_SECRET` = *A strong secure random string*
6.  Once deployed, copy your backend URL (e.g. `https://kazhuthai-api.onrender.com`).

### Frontend (Vercel / Netlify)
1.  Create a new project on [Vercel](https://vercel.com).
2.  Link your GitHub repository and set the **Root Directory** to `frontend`.
3.  Set the **Build Command** to `npm run build` and **Output Directory** to `dist`.
4.  Add the Environment Variables:
    *   `VITE_API_URL` = `https://kazhuthai-api.onrender.com/api` (your backend URL + `/api`)
    *   `VITE_SOCKET_URL` = `https://kazhuthai-api.onrender.com` (your backend base URL)
5.  Deploy! Vercel compiles your static build and exposes a premium production URL.

---

## 🔒 Security & Authoritative Protections
*   ** authoritative Card State**: The server keeps the complete dealer states, distributing cards on launch and validating each card play. A client cannot "trick" the system by modifying the UI; if they play a card they do not own or try to play out-of-turn or cheat the follow-suit constraint, the backend game engine rejects the socket event and alerts the player.
*   **Lobby Protection**: Room lists and waiting spaces are handled in high-speed, thread-safe memory scopes on the server.
*   **JWT Handshake Protection**: Restricts API calls to authorized profiles.

Enjoy playing **KAZHUTHAI**! May you avoid the cards and remain SAFE! 🎉

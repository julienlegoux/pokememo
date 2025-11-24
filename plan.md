Pokémon Memory Game - Implementation Plan

Project Overview

Tech Stack: HTML5, TypeScript, Native Web Components.

Data Source: PokéAPI (via pokeapi-js-wrapper).

Backend: Vercel Serverless Functions (Node.js/Edge).

Database: Redis (Upstash) - Secure Serverless Connection.

Auth: ID-based (UUID stored in LocalStorage).

Players: 1-4 (Local multiplayer).

Phase 1: Project Initialization & Environment

Goal: Set up the project structure compatible with Vercel's automatic API detection.

Scaffold Project

Initialize with Vite: npm create vite@latest pokemon-memory -- --template vanilla-ts

Dependencies

API Wrapper: npm install pokeapi-js-wrapper

Redis Client: npm install @upstash/redis (Used only in /api folder).

UUID generator: npm install uuid (Frontend).

Project Structure

/api            (Vercel Functions - BACKEND)
leaderboard.ts
submit-score.ts
/src            (Vite App - FRONTEND)
/components
/services
main.ts


Environment Config

Local: Create .env for your secret keys (do NOT prefix with VITE_ this time, as we want them hidden from the browser).

UPSTASH_REDIS_REST_URL="[https://your-db.upstash.io](https://your-db.upstash.io)"
UPSTASH_REDIS_REST_TOKEN="your-secret-token"


Phase 2: Backend Architecture (Vercel Functions)

Goal: Create secure endpoints that talk to Redis. The browser never sees the Redis keys.

Endpoint: Get Leaderboard (/api/leaderboard.ts)

Import Redis from @upstash/redis.

Logic:

Initialize Redis using process.env.

Call redis.zrange('leaderboard', 0, 9, { rev: true, withScores: true }).

Return JSON response: 200 OK.

Endpoint: Submit Score (/api/submit-score.ts)

Method: POST.

Body: { username, score, id }.

Logic:

Validate input.

Call redis.zadd('leaderboard', { score: score, member: username }).

Return 200 OK.

Phase 3: Services Layer (Frontend)

Goal: The frontend fetches data from your own Vercel API, not Redis directly.

Pokemon Service

Setup: Instantiate Pokedex = new Pokedex.Pokedex({ cache: true }).

fetchPokemon(count):

Fetch IDs -> Get Data -> Shuffle -> Return Pairs.

Leaderboard Service (src/services/LeaderboardService.ts)

saveScore(username, score):

await fetch('/api/submit-score', { method: 'POST', body: ... })

getLeaderboard():

await fetch('/api/leaderboard')

Return the JSON array.

Phase 4: Core Game Engine (Pure TypeScript)

Goal: The game logic independent of the UI.

Data Models

IPlayer: { id: string, name: string, score: number, isActive: boolean }

ICard: { id: number, pokemonId: number, image: string, isFlipped: boolean, isMatched: boolean }

Game Controller (GameController.ts)

Properties: players[], deck[], timer.

Turn Logic:

Track currentPlayerIndex.

On match: Player gets points, goes again.

On miss: Delay 1s, next player.

End Game Logic:

When all pairs matched OR time runs out.

Call LeaderboardService.saveScore(winner.name, winner.score).

Phase 5: Web Components (The View)

Goal: Create visual elements.

Card Component (<pokemon-card>)

Attributes: pokemon-id, image-src.

CSS: CSS Grid + 3D Transform (rotateY(180deg)) for the flip effect.

Logic: Dispatch CustomEvent('card-click', { detail: { id } }).

Board Component (<game-board>)

Renders the grid.

Listens for card-click events -> calls GameController.

Leaderboard Component (<leaderboard-view>)

Fetches data from LeaderboardService on load.

Displays a simple HTML <table> of top scores.

Phase 6: Integration & Polish

Main Entry (main.ts)

Check localStorage for existing user ID/Name.

Show "Start Game" Modal.

Initialize GameController.

Multiplayer Modal

Form inputs for: "Player 1 Name", "Player 2 Name", etc.

Dropdown for "Time Limit" (60s, 120s, No Limit).

Deployment (Vercel)

Push code to GitHub.

Import project into Vercel.

Crucial: Go to Vercel Project Settings > Environment Variables.

Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.

Deploy! Vercel will automatically build the Frontend and deploy the /api folder as serverless functions.
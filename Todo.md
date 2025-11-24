# Pokemon Memory Game - Todo List

> **Project**: pokememo - Multiplayer Pokemon Memory Card Game
> **Tech Stack**: TypeScript, Web Components, Vite, Upstash Redis, Vercel
> **Status**: In Development

---

## 📋 Project Specifications

- **Difficulty Levels**: Easy (4x2 = 8 cards), Medium (4x4 = 16 cards), Hard (6x4 = 24 cards)
- **Turn Logic**: Player continues on match + 30-second timer that resets after each match
- **Scoring**: Accuracy-based formula: `(matches / totalFlips) × 1000`
- **Players**: 1-4 local multiplayer
- **Features**: Pokemon theme filtering, animations, dark mode

---

## Phase 1: Backend & Database (Critical Path) 🔧

### API Endpoints (`api/` folder)

- [x] **Task 1**: Create `/api/leaderboard.ts`
  - **Description**: GET endpoint to fetch top 10 scores from Upstash Redis
  - **Acceptance Criteria**:
    - Returns sorted array of top 10 scores (highest first)
    - Response format: `{ success: boolean, data: LeaderboardEntry[] }`
    - Includes player name, score, timestamp, difficulty
    - Handles empty leaderboard gracefully
  - **Dependencies**: Upstash Redis configured

- [x] **Task 2**: Create `/api/submit-score.ts`
  - **Description**: POST endpoint to save player scores to Redis
  - **Acceptance Criteria**:
    - Accepts player ID, name, score, difficulty, timestamp
    - Validates input data (reject negative scores, empty names)
    - Saves to Redis with unique key: `score:{uuid}`
    - Returns success/failure response
  - **Dependencies**: Upstash Redis configured

- [x] **Task 3**: Implement Upstash Redis connection
  - **Description**: Shared Redis client setup using environment variables
  - **Acceptance Criteria**:
    - Uses `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
    - Connection reused across API calls
    - Proper error handling for connection failures
  - **Dependencies**: None

- [x] **Task 4**: Add CORS and error handling
  - **Description**: Configure CORS headers and consistent error responses
  - **Acceptance Criteria**:
    - CORS allows frontend origin
    - Standardized error format: `{ success: false, error: string }`
    - 4xx/5xx status codes for different error types
  - **Dependencies**: Tasks 1-2

- [x] **Task 5**: Create API type definitions
  - **Description**: TypeScript types for API requests/responses
  - **Acceptance Criteria**:
    - Add to `src/lib/type.ts`: `LeaderboardEntry`, `SubmitScoreRequest`, `ApiResponse`
    - Types match actual API contracts
    - Exported for use in services
  - **Dependencies**: None

---

## Phase 2: Core Services Layer 🔄 ✅ COMPLETED

### Services (`src/services/` folder)

- [x] **Task 6**: Create `pokemon.service.ts`
  - **Description**: Service to fetch Pokemon data with theme filtering
  - **Acceptance Criteria**:
    - Uses `pokeapi-js-wrapper` to fetch Pokemon
    - Method to get random Pokemon by theme (generation only)
    - Returns Pokemon ID, name, sprite URL (front-default)
    - Implements caching to avoid redundant API calls
  - **Dependencies**: None
  - **✅ Completed**: Supports Gen 1-3, includes preload and multi-gen methods

- [x] **Task 7**: Implement Pokemon caching strategy
  - **Description**: Cache fetched Pokemon data to reduce API calls
  - **Acceptance Criteria**:
    - In-memory cache for Pokemon data during session
    - Cache by theme key (e.g., "gen1-fire")
    - Reduces API calls by at least 80% in typical gameplay
  - **Dependencies**: Task 6
  - **✅ Completed**: In-memory Map with 1-hour TTL, cache statistics

- [x] **Task 8**: Create `leaderboard.service.ts`
  - **Description**: Client service to interact with leaderboard APIs
  - **Acceptance Criteria**:
    - `getLeaderboard()` - Fetches top 10 scores
    - `submitScore(score)` - Submits player score
    - Handles network errors gracefully
    - Returns typed responses matching API contracts
  - **Dependencies**: Task 5
  - **✅ Completed**: Includes checkConnection() for offline detection

- [x] **Task 9**: Create `storage.service.ts`
  - **Description**: Manage player persistence in LocalStorage
  - **Acceptance Criteria**:
    - Generate UUID for new players using `uuid` library
    - Store/retrieve player ID from LocalStorage (those should be stored and retrieved also in Upstash Redis)
    - Methods: `getPlayerId()`, `getPlayerName()`, `setPlayerName()`
    - Handle LocalStorage quota errors
  - **Dependencies**: None
  - **✅ Completed**: Full localStorage + Redis sync via API, updatePlayerStats()

- [x] **Task 10**: Add service type definitions
  - **Description**: Types for service layer data structures
  - **Acceptance Criteria**:
    - Add to `src/lib/type.ts`: `Pokemon`, `PokemonTheme`, `CacheEntry`
    - Types ensure type safety across service layer
  - **Dependencies**: None
  - **✅ Completed**: Plus PlayerProfile, PlayerPreferences, TopScore types

### Bonus Tasks Completed:
- [x] **Task 6B**: Created `/api/player/[playerId].ts` - GET/PUT endpoint for player profiles
- [x] **Task 10B**: Added comprehensive player profile type system

---

## Phase 3: Game Engine (Pure TypeScript Logic) 🎮 ✅ COMPLETED

### Game Controller (`src/lib/` folder)

- [x] **Task 11**: Update `type.ts` with game types
  - **Description**: Add comprehensive game-related type definitions
  - **Acceptance Criteria**:
    - Add: `Difficulty`, `GameConfig`, `GameState`, `TurnResult`, `Theme`
    - Enum for difficulty: `EASY | MEDIUM | HARD`
    - GameState includes: players, cards, currentPlayerIndex, timer, isGameOver
    - All types exported and used throughout codebase
  - **Dependencies**: None
  - **✅ Completed**: All game types in src/lib/type.ts lines 22-226

- [x] **Task 12**: Create `game-controller.ts` skeleton
  - **Description**: Main GameController class with state management
  - **Acceptance Criteria**:
    - Class with private state: `GameState`
    - Public methods: `initGame()`, `flipCard()`, `getCurrentPlayer()`, `getGameState()`
    - Event emitter pattern for state changes
    - Uses types from Task 11
  - **Dependencies**: Task 11
  - **✅ Completed**: GameController in src/lib/game-controller.ts, extends EventTarget

- [x] **Task 13**: Implement difficulty system
  - **Description**: Configure card counts and grid layouts per difficulty
  - **Acceptance Criteria**:
    - Easy: 8 cards (4x2 grid), 4 unique Pokemon
    - Medium: 16 cards (4x4 grid), 8 unique Pokemon
    - Hard: 24 cards (6x4 grid), 12 unique Pokemon
    - Method: `generateCards(difficulty, theme)` returns shuffled cards
  - **Dependencies**: Task 12
  - **✅ Completed**: DIFFICULTY_CONFIG + generateCards() with Fisher-Yates shuffle

- [x] **Task 14**: Implement turn system
  - **Description**: Match extends turn + timer reset logic
  - **Acceptance Criteria**:
    - Player continues flipping if match is made
    - Turn switches to next player if no match
    - Timer starts at 30s and resets to 30s after each match
    - Timer countdown triggers turn switch when reaches 0
  - **Dependencies**: Task 12
  - **✅ Completed**: compareCards() + switchPlayer(), timer reset on match

- [x] **Task 15**: Implement accuracy-based scoring
  - **Description**: Score calculation: `(matches / totalFlips) × 1000`
  - **Acceptance Criteria**:
    - Track `totalFlips` per player
    - Track `matches` per player
    - Method: `calculateScore(player)` returns rounded integer
    - Update score after each turn
  - **Dependencies**: Task 12
  - **✅ Completed**: calculatePlayerScore() formula implemented

- [x] **Task 16**: Add timer logic with reset
  - **Description**: Countdown timer that resets on successful match
  - **Acceptance Criteria**:
    - `startTimer()` begins 30s countdown
    - `resetTimer()` called after match, restarts at 30s
    - `stopTimer()` pauses countdown
    - Emits event when timer reaches 0
    - Use `setInterval` for countdown
  - **Dependencies**: Task 14
  - **✅ Completed**: Full timer system with reset, pause, resume, expiration

- [x] **Task 17**: Implement multiplayer logic
  - **Description**: Handle 1-4 players with active player tracking
  - **Acceptance Criteria**:
    - Initialize game with 1-4 Player objects
    - Track `currentPlayerIndex` in state
    - Method: `switchPlayer()` rotates to next active player
    - Support for player elimination (optional)
  - **Dependencies**: Task 12
  - **✅ Completed**: 1-4 player support with isActive tracking, rotation

- [x] **Task 18**: Add win condition detection
  - **Description**: Detect game completion and determine winner
  - **Acceptance Criteria**:
    - Game ends when all cards matched
    - Method: `checkWinCondition()` returns boolean
    - Method: `getWinner()` returns Player with highest score
    - Emit `gameOver` event with winner data
  - **Dependencies**: Tasks 15, 17
  - **✅ Completed**: endGame() with winner determination and tie handling

---

## Phase 4: Web Components (UI) 🎨 ✅ COMPLETED

### Components (`src/components/` folder)

- [x] **Task 19**: Create `pokemon-card.ts`
  - **Description**: Web component for individual memory card
  - **Acceptance Criteria**:
    - Custom element: `<pokemon-card>`
    - Props: `card: Card`, `disabled: boolean`
    - States: hidden (back), revealed (Pokemon image), matched (locked)
    - 3D flip animation using CSS transforms
    - Emits `cardFlipped` custom event with card ID
  - **Dependencies**: Task 11
  - **✅ Completed**: BEM classes, 300ms flip animation, Pokeball SVG back

- [x] **Task 20**: Add card visual states
  - **Description**: Different styles for card states
  - **Acceptance Criteria**:
    - Hidden: Card back with Pokeball or pattern
    - Revealed: Pokemon sprite clearly visible
    - Matched: Grayed out or highlighted, not clickable
    - Disabled: Pointer events disabled during processing
  - **Dependencies**: Task 19
  - **✅ Completed**: card-animations.css with all states, responsive sizing

- [x] **Task 21**: Create `game-board.ts`
  - **Description**: Grid container for cards with responsive layout
  - **Acceptance Criteria**:
    - Custom element: `<game-board>`
    - Props: `cards: Card[]`, `difficulty: Difficulty`
    - Responsive CSS Grid: 4x2, 4x4, or 6x4 based on difficulty
    - Renders `<pokemon-card>` for each card
    - Listens to `cardFlipped` events and emits to parent
  - **Dependencies**: Task 19
  - **✅ Completed**: Dynamic grid layouts, updateCard() method, game-board.css

- [x] **Task 22**: Implement card click handling
  - **Description**: Event bubbling and game controller integration
  - **Acceptance Criteria**:
    - Click on card → emit `cardFlipped` event
    - Board component listens and forwards to game controller
    - Prevent clicks during card comparison (200ms delay)
    - Prevent clicks on already matched/flipped cards
  - **Dependencies**: Tasks 19, 21
  - **✅ Completed**: Event bubbling from card → board → parent, validation checks

- [x] **Task 23**: Create `leaderboard-view.ts`
  - **Description**: Component to display top 10 scores
  - **Acceptance Criteria**:
    - Custom element: `<leaderboard-view>`
    - Fetches data using `leaderboard.service.ts`
    - Shows: rank, player name, score, difficulty, date
    - Loading state with skeleton UI
    - Error state if fetch fails
  - **Dependencies**: Task 8
  - **✅ Completed**: Dumb component (props only), skeleton shimmer, empty state, medals for top 3

- [x] **Task 24**: Create `difficulty-selector.ts`
  - **Description**: Modal for selecting game difficulty
  - **Acceptance Criteria**:
    - Custom element: `<difficulty-selector>`
    - Three buttons: Easy, Medium, Hard with descriptions
    - Emits `difficultySelected` event with chosen difficulty
    - Closeable with Escape key
    - Modal overlay with backdrop
  - **Dependencies**: None
  - **✅ Completed**: Modal with overlay, emoji icons, Escape key support

- [x] **Task 25**: Create `player-setup.ts`
  - **Description**: Modal for configuring 1-4 players
  - **Acceptance Criteria**:
    - Custom element: `<player-setup>`
    - Input fields for 1-4 player names
    - Add/remove player buttons
    - Validates at least 1 player with non-empty name
    - Emits `playersConfigured` event with Player[] array
  - **Dependencies**: Task 11
  - **✅ Completed**: Dynamic player inputs, UUID generation, validation, player-setup.css

- [x] **Task 26**: Create `theme-selector.ts`
  - **Description**: Dropdown/modal to filter Pokemon by theme
  - **Acceptance Criteria**:
    - Custom element: `<theme-selector>`
    - Options: All, Gen 1-9, Type (Fire, Water, etc.), Region (Kanto, Johto, etc.)
    - Emits `themeSelected` event with theme object
    - Accessible dropdown with keyboard navigation
  - **Dependencies**: Task 10
  - **✅ Completed**: Gen 1-3 dropdown only (per plan), theme-selector.css

- [x] **Task 27**: Create `dark-mode-toggle.ts`
  - **Description**: Button to switch between light/dark themes
  - **Acceptance Criteria**:
    - Custom element: `<dark-mode-toggle>`
    - Toggle button with icon (sun/moon)
    - Saves preference to LocalStorage
    - Emits `themeChanged` event
    - Applies theme by toggling `data-theme` attribute on `<html>`
  - **Dependencies**: Task 9
  - **✅ Completed**: System preference detection, localStorage persistence, SVG icons

- [x] **Task 28**: Create `timer-display.ts`
  - **Description**: Countdown timer component
  - **Acceptance Criteria**:
    - Custom element: `<timer-display>`
    - Props: `timeRemaining: number`
    - Shows MM:SS format
    - Visual warning when < 10s (red color, pulse animation)
    - Updates every second
  - **Dependencies**: None
  - **✅ Completed**: MM:SS format, warning pulse animation, timer-display.css

- [x] **Task 29**: Create `score-display.ts`
  - **Description**: Show current scores for all players
  - **Acceptance Criteria**:
    - Custom element: `<score-display>`
    - Props: `players: Player[]`, `currentPlayerIndex: number`
    - Highlight active player
    - Shows: name, matches, total flips, current score
    - Updates in real-time
  - **Dependencies**: Task 11
  - **✅ Completed**: Player cards with active highlight, all stats displayed, responsive

### Bonus Completed:
- [x] **Task 30**: Created `base.css` - CSS variables, light/dark themes, resets, typography
- [x] Created `components/index.ts` - Central export for all components

---

## Phase 5: Styling & Animations 💅 ✅ COMPLETED

### Styles (`src/styles/` folder)

- [x] **Task 30**: Create `base.css`
  - **Description**: CSS variables and base styles for theming
  - **Acceptance Criteria**:
    - CSS custom properties for colors, spacing, fonts
    - Light theme variables (default)
    - Dark theme variables under `[data-theme="dark"]`
    - Reset and normalize styles
    - Typography scale
  - **Dependencies**: None
  - **✅ Completed**: Full CSS variable system, light/dark themes, resets, typography scale

- [x] **Task 31**: Create `card-animations.css`
  - **Description**: 3D card flip animations
  - **Acceptance Criteria**:
    - CSS transform for 3D flip effect (rotateY)
    - Smooth transition (300ms ease-in-out)
    - Card front/back faces positioned correctly
    - Hover effect on unmatched cards
    - Preserve-3d transform style
  - **Dependencies**: None
  - **✅ Completed**: 3D flip with 300ms timing, preserve-3d, hover effects, responsive sizing

- [x] **Task 32**: Create `match-animations.css`
  - **Description**: Celebratory animations for matches
  - **Acceptance Criteria**:
    - Particle burst effect using CSS keyframes
    - Scale pulse animation on match
    - Confetti effect for game completion (CSS or minimal JS)
    - Smooth fade-out for matched cards
  - **Dependencies**: None
  - **✅ Completed**: Subtle pulse + glow + fade (per user preference), mismatch shake, victory animations, reduced-motion support

- [x] **Task 33**: Create `responsive.css`
  - **Description**: Mobile-first responsive design
  - **Acceptance Criteria**:
    - Mobile (320px+): Single column, smaller cards
    - Tablet (768px+): Proper grid layout
    - Desktop (1024px+): Larger cards, side-by-side layout
    - Touch-friendly tap targets (min 44x44px)
  - **Dependencies**: None
  - **✅ Completed**: Hybrid approach (global + component), mobile/tablet/desktop breakpoints, 44px touch targets, safe area insets, landscape optimizations

- [x] **Task 34**: Implement dark mode styles
  - **Description**: Dark theme color scheme
  - **Acceptance Criteria**:
    - Dark background (#1a1a1a or similar)
    - Light text for contrast (#e0e0e0)
    - Adjusted card colors for dark mode
    - Smooth theme transition (200ms)
  - **Dependencies**: Task 30
  - **✅ Completed**: Implemented in base.css with [data-theme="dark"], smooth transitions

- [x] **Task 35**: Add loading and skeleton screens
  - **Description**: Loading states for async operations
  - **Acceptance Criteria**:
    - Skeleton UI for leaderboard loading
    - Shimmer effect for loading cards
    - Spinner for API calls
    - Fade-in animation when content loads
  - **Dependencies**: Task 30
  - **✅ Completed**: Shimmer skeleton in leaderboard-view.css, fade-in animations in match-animations.css

### Bonus Completed:
- [x] Created `main.css` - Master CSS import file (all stylesheets in correct cascade order)

---

## Phase 6: Integration & Main Entry 🔗 ✅ COMPLETED

### Root Integration (`src/` root)

- [x] **Task 36**: Implement `main.ts` bootstrap
  - **Description**: Application entry point with initialization
  - **Acceptance Criteria**:
    - Initialize all custom elements (register with `customElements.define()`)
    - Mount app container to `#app` div
    - Load player ID from LocalStorage
    - Set up global error handling
    - Start application flow
  - **Dependencies**: All component tasks (19-29)
  - **✅ Completed**: Full App class with DOM injection, dark mode init, error handling, saved game detection

- [x] **Task 37**: Initialize player setup flow
  - **Description**: Game start sequence: setup → difficulty → game
  - **Acceptance Criteria**:
    - Show `<player-setup>` modal on app load
    - After setup, show `<difficulty-selector>`
    - After difficulty, show `<theme-selector>`
    - Then initialize GameController and start game
    - Handle back/cancel at each step
  - **Dependencies**: Tasks 24, 25, 26, 36
  - **✅ Completed**: Full game flow: player setup → difficulty → game start, with resume prompt for saved games

- [x] **Task 38**: Connect components with custom events
  - **Description**: Wire up event-driven component communication
  - **Acceptance Criteria**:
    - Card clicks → GameController → Board updates
    - Timer events → GameController → Timer display updates
    - Score changes → Score display updates
    - Game over → Show leaderboard modal
  - **Dependencies**: Tasks 12, 21, 22, 28, 29
  - **✅ Completed**: Full event system wired: cardFlipped, matchFound, mismatch, turnEnded, timerTick, timerExpired, gameCompleted

- [x] **Task 39**: Implement game state persistence
  - **Description**: Save/resume game progress
  - **Acceptance Criteria**:
    - Save game state to LocalStorage on each move
    - Detect unfinished game on app load
    - Prompt user: "Resume game or Start new?"
    - Restore GameController state from saved data
  - **Dependencies**: Tasks 9, 12
  - **✅ Completed**: saveGameState() called after every card flip, checkForSavedGame() on init, resume prompt implemented

- [x] **Task 40**: Add keyboard accessibility
  - **Description**: Basic keyboard navigation support (per Phase 6 plan)
  - **Acceptance Criteria**:
    - Escape closes modals ✅
    - Tab order is logical ✅
    - Basic accessibility (no advanced arrow key navigation per plan)
  - **Dependencies**: Task 36
  - **✅ Completed**: Basic keyboard support implemented (Escape for modals), advanced features not in scope per approved plan

- [ ] **Task 41**: Test multiplayer flow end-to-end
  - **Description**: Manual testing of full multiplayer game
  - **Acceptance Criteria**:
    - Test 2, 3, and 4 player games
    - Verify turn switching works correctly
    - Verify timer resets on match
    - Verify scoring is accurate for all players
    - Test edge cases (timeout, all matches)
  - **Dependencies**: All Phase 3 and 4 tasks

- [ ] **Task 42**: Test API integration
  - **Description**: Verify backend endpoints work correctly
  - **Acceptance Criteria**:
    - Leaderboard fetches successfully
    - Score submission saves to Redis
    - Scores appear in leaderboard after submission
    - Test error scenarios (network failure, invalid data)
  - **Dependencies**: Tasks 1-4, 8

### Additional Files Completed:
- [x] Enhanced `index.html` with meta tags, PWA support, theme colors, preconnect to APIs
- [x] Created comprehensive `main.ts` with 600+ lines of integration logic

---

## Phase 7: Documentation & Deployment 📚

### Final Tasks

- [ ] **Task 43**: Create `README.md`
  - **Description**: Comprehensive project documentation
  - **Acceptance Criteria**:
    - Project overview and features
    - Tech stack explanation
    - Setup instructions (clone, install, env vars)
    - Development commands (`npm run dev`, `npm run build`)
    - Deployment guide (Vercel)
    - Project structure explanation
  - **Dependencies**: None

- [ ] **Task 44**: Add inline JSDoc comments
  - **Description**: Document complex functions and classes
  - **Acceptance Criteria**:
    - JSDoc for GameController public methods
    - JSDoc for service functions
    - Parameter and return type descriptions
    - Usage examples for complex APIs
  - **Dependencies**: None

- [ ] **Task 45**: Create `vercel.json`
  - **Description**: Vercel deployment configuration
  - **Acceptance Criteria**:
    - Configure API routes (ensure `/api/*` works)
    - Set up environment variables reference
    - Configure build output directory
    - Set up redirects if needed
  - **Dependencies**: None

- [ ] **Task 46**: Test production build locally
  - **Description**: Verify optimized build works correctly
  - **Acceptance Criteria**:
    - Run `npm run build` successfully
    - Run `npm run preview` and test all features
    - Check bundle size (should be < 500KB)
    - Verify no console errors
    - Test on mobile viewport
  - **Dependencies**: All implementation tasks

- [ ] **Task 47**: Deploy to Vercel
  - **Description**: Deploy application to production
  - **Acceptance Criteria**:
    - Connect GitHub repo to Vercel
    - Configure environment variables (Upstash credentials)
    - Deploy successfully
    - Test deployed app thoroughly
    - Verify API endpoints work in production
    - Share production URL
  - **Dependencies**: Task 45, 46

---

## 📊 Progress Summary

- **Total Tasks**: 47
- **Completed**: 40 (Phases 1-6 complete!)
- **In Progress**: 0
- **Remaining**: 7 (testing + documentation + deployment)

---

## 🎯 Priority Order

### Week 1: Foundation (Tasks 1-10)
- Backend APIs and services (critical path)
- Can test independently with curl/Postman

### Week 2: Core Logic (Tasks 11-18)
- Game controller and business logic
- Unit testable without UI

### Week 3: UI Components (Tasks 19-29)
- Build all web components
- Style and make interactive

### Week 4: Polish (Tasks 30-42)
- Styling, animations, integration
- Testing and bug fixes

### Week 5: Launch (Tasks 43-47)
- Documentation and deployment
- Production testing

---

## 📝 Notes

- Each task should have its own git commit with descriptive message
- Test each feature in isolation before integration
- Keep components small and focused (single responsibility)
- Use TypeScript strict mode to catch errors early
- Prioritize functionality over aesthetics initially
- Refactor as needed but avoid premature optimization

---

**Last Updated**: 2025-11-24 (Phase 6 completed)
**Project Start Date**: 2025-11-24
**Current Phase**: Phase 7 (Documentation & Deployment)
**Target Completion**: ~5 weeks
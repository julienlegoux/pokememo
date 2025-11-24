export interface Player {
    id: string;
    name: string;
    score: number;
    isActive: boolean;
    totalFlips?: number;    // Total card flips by this player (for scoring)
    matches?: number;       // Total matches made by this player (for scoring)
}

export interface Card {
    id: number;
    pokemonId: number;
    image: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export type PlayerList = Player[];

export type CardList = Card[];

// Difficulty levels
export enum Difficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard'
}

// Leaderboard entry stored in database
export interface LeaderboardEntry {
    id: string;           // UUID of the score entry
    playerId: string;     // UUID of the player
    playerName: string;
    score: number;        // Calculated as (matches / totalFlips) * 1000
    difficulty: Difficulty;
    timestamp: number;    // Unix timestamp in milliseconds
    totalFlips: number;
    matches: number;
}

// Request body for submitting a score
export interface SubmitScoreRequest {
    playerId: string;
    playerName: string;
    score: number;
    difficulty: Difficulty;
    totalFlips: number;
    matches: number;
}

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// Leaderboard API response
export type LeaderboardResponse = ApiResponse<LeaderboardEntry[]>;

// Submit score API response
export type SubmitScoreResponse = ApiResponse<{ id: string }>;

// =============================================================================
// POKEMON TYPES
// =============================================================================

// Pokemon generation (Gen 1-3 only: Kanto, Johto, Hoenn)
export type PokemonGeneration = 1 | 2 | 3;

// Pokemon data structure
export interface Pokemon {
    id: number;           // Pokemon ID (1-386 for Gen 1-3)
    name: string;         // Pokemon name (lowercase)
    spriteUrl: string;    // URL to front_default sprite image
}

// Pokemon theme for filtering
export interface PokemonTheme {
    generation: PokemonGeneration;
}

// Generic cache entry with timestamp
export interface CacheEntry<T> {
    data: T;
    timestamp: number;    // When cached (Unix timestamp in ms)
}

// =============================================================================
// PLAYER PROFILE TYPES
// =============================================================================

// Player preferences stored in profile
export interface PlayerPreferences {
    darkMode: boolean;
    favoriteGeneration: PokemonGeneration;
    soundEnabled: boolean;
}

// Individual top score entry
export interface TopScore {
    score: number;
    difficulty: Difficulty;
    timestamp: number;    // Unix timestamp in milliseconds
    matches: number;
    totalFlips: number;
}

// Complete player profile stored in Redis
export interface PlayerProfile {
    id: string;                    // Player UUID
    name: string;                  // Player display name
    totalGamesPlayed: number;      // Total completed games
    topScores: TopScore[];         // Top 5 scores (sorted by score desc)
    preferences: PlayerPreferences;
    createdAt: number;             // Account creation timestamp
    lastPlayedAt: number;          // Last game timestamp
}

// Request body for creating/updating player profile
export interface UpdatePlayerRequest {
    name?: string;
    totalGamesPlayed?: number;
    topScores?: TopScore[];
    preferences?: Partial<PlayerPreferences>;
}

// Player API responses
export type PlayerProfileResponse = ApiResponse<PlayerProfile>;
export type UpdatePlayerResponse = ApiResponse<{ id: string }>;

// =============================================================================
// GAME ENGINE TYPES
// =============================================================================

// Game configuration for initialization
export interface GameConfig {
    difficulty: Difficulty;
    players: Player[];             // 1-4 players
    theme: PokemonTheme;           // Pokemon generation to use
}

// Pair of cards currently revealed (for comparison)
export interface CardPair {
    first: Card;
    second: Card;
}

// Complete game state
export interface GameState {
    config: GameConfig;
    cards: Card[];
    players: Player[];
    currentPlayerIndex: number;
    revealedCards: Card[];        // Currently revealed cards (max 2)
    timeRemaining: number;        // Timer in seconds
    isPaused: boolean;
    isGameOver: boolean;
    winner: Player | null;
}

// Result of a card flip action
export enum TurnResult {
    FIRST_CARD = 'first_card',           // First card of pair revealed
    MATCH = 'match',                     // Successful match
    MISMATCH = 'mismatch',               // No match
    INVALID = 'invalid',                 // Invalid move (card already matched, etc.)
    GAME_OVER = 'game_over'              // Game completed
}

// Custom event types for GameController
export type GameEventType =
    | 'stateChange'     // Any state change
    | 'cardFlipped'     // Card was flipped
    | 'match'           // Successful match
    | 'mismatch'        // No match
    | 'turnSwitch'      // Turn switched to next player
    | 'gameOver'        // Game completed
    | 'timerTick'       // Timer countdown (every second)
    | 'timerExpired'    // Timer reached 0
    | 'gamePaused'      // Game was paused
    | 'gameResumed';    // Game was resumed

// Event detail payloads for each event type
export interface GameEventDetail {
    stateChange: { state: GameState };
    cardFlipped: { card: Card; player: Player };
    match: { cards: CardPair; player: Player };
    mismatch: { cards: CardPair; player: Player };
    turnSwitch: { fromPlayer: Player; toPlayer: Player };
    gameOver: { winner: Player | Player[]; finalScores: Player[] };
    timerTick: { timeRemaining: number };
    timerExpired: { player: Player };
    gamePaused: { reason: string };
    gameResumed: { player: Player };
}

// Grid dimensions for each difficulty
export interface GridDimensions {
    rows: number;
    cols: number;
    totalCards: number;
    uniquePokemon: number;
}

// Difficulty configurations
export const DIFFICULTY_CONFIG: Record<Difficulty, GridDimensions> = {
    [Difficulty.EASY]: {
        rows: 2,
        cols: 4,
        totalCards: 8,
        uniquePokemon: 4,
    },
    [Difficulty.MEDIUM]: {
        rows: 4,
        cols: 4,
        totalCards: 16,
        uniquePokemon: 8,
    },
    [Difficulty.HARD]: {
        rows: 4,
        cols: 6,
        totalCards: 24,
        uniquePokemon: 12,
    },
};
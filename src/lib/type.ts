export interface Player {
    id: string;
    name: string;
    score: number;
    isActive: boolean;
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
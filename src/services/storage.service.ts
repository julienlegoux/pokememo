import { v4 as uuidv4 } from 'uuid';
import type {
    PlayerProfile,
    PlayerProfileResponse,
    UpdatePlayerRequest,
    UpdatePlayerResponse,
    TopScore,
} from '../lib/type';

/**
 * Storage Service
 * Manages player data persistence across localStorage and Redis (via API)
 */
class StorageService {
    private readonly API_BASE_URL: string;
    private readonly STORAGE_KEYS = {
        PLAYER_ID: 'pokememo_player_id',
        PLAYER_NAME: 'pokememo_player_name',
        PLAYER_PROFILE: 'pokememo_player_profile',
        GAME_STATE: 'pokememo_game_state',
    };

    constructor() {
        this.API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';
    }

    // =============================================================================
    // LOCALSTORAGE METHODS
    // =============================================================================

    /**
     * Get player ID from localStorage or generate a new one
     */
    getPlayerId(): string {
        try {
            let playerId = localStorage.getItem(this.STORAGE_KEYS.PLAYER_ID);

            if (!playerId) {
                playerId = uuidv4();
                this.setPlayerId(playerId);
            }

            return playerId;
        } catch (error) {
            console.error('LocalStorage error (getPlayerId):', error);
            // Fallback: generate temp ID (won't persist across sessions)
            return uuidv4();
        }
    }

    /**
     * Save player ID to localStorage
     */
    setPlayerId(id: string): void {
        try {
            localStorage.setItem(this.STORAGE_KEYS.PLAYER_ID, id);
        } catch (error) {
            console.error('LocalStorage error (setPlayerId):', error);
            this.handleQuotaError(error);
        }
    }

    /**
     * Get player name from localStorage
     */
    getPlayerName(): string | null {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.PLAYER_NAME);
        } catch (error) {
            console.error('LocalStorage error (getPlayerName):', error);
            return null;
        }
    }

    /**
     * Save player name to localStorage
     */
    setPlayerName(name: string): void {
        try {
            localStorage.setItem(this.STORAGE_KEYS.PLAYER_NAME, name);
        } catch (error) {
            console.error('LocalStorage error (setPlayerName):', error);
            this.handleQuotaError(error);
        }
    }

    /**
     * Get cached player profile from localStorage
     */
    getCachedProfile(): PlayerProfile | null {
        try {
            const cached = localStorage.getItem(this.STORAGE_KEYS.PLAYER_PROFILE);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('LocalStorage error (getCachedProfile):', error);
            return null;
        }
    }

    /**
     * Cache player profile in localStorage
     */
    cacheProfile(profile: PlayerProfile): void {
        try {
            localStorage.setItem(this.STORAGE_KEYS.PLAYER_PROFILE, JSON.stringify(profile));
        } catch (error) {
            console.error('LocalStorage error (cacheProfile):', error);
            this.handleQuotaError(error);
        }
    }

    /**
     * Save game state to localStorage
     */
    saveGame(data: any): void {
        try {
            localStorage.setItem(this.STORAGE_KEYS.GAME_STATE, JSON.stringify(data));
        } catch (error) {
            console.error('LocalStorage error (saveGame):', error);
            this.handleQuotaError(error);
        }
    }

    /**
     * Load game state from localStorage
     */
    loadGame(): any {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.GAME_STATE);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('LocalStorage error (loadGame):', error);
            return null;
        }
    }

    /**
     * Clear saved game from localStorage
     */
    clearGame(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.GAME_STATE);
        } catch (error) {
            console.error('LocalStorage error (clearGame):', error);
        }
    }

    /**
     * Clear all player data from localStorage
     */
    clearPlayer(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.PLAYER_ID);
            localStorage.removeItem(this.STORAGE_KEYS.PLAYER_NAME);
            localStorage.removeItem(this.STORAGE_KEYS.PLAYER_PROFILE);
            localStorage.removeItem(this.STORAGE_KEYS.GAME_STATE);
        } catch (error) {
            console.error('LocalStorage error (clearPlayer):', error);
        }
    }

    /**
     * Handle localStorage quota exceeded errors
     */
    private handleQuotaError(error: unknown): void {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.warn('LocalStorage quota exceeded. Consider clearing old data.');
            // Optionally: Clear non-essential data or prompt user
        }
    }

    // =============================================================================
    // API INTEGRATION METHODS (Redis sync via backend)
    // =============================================================================

    /**
     * Fetch player profile from Redis (via API)
     * GET /api/player/:playerId
     */
    async fetchPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/player/${playerId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 404) {
                // Player doesn't exist in Redis yet
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: PlayerProfileResponse = await response.json();

            if (!data.success || !data.data) {
                throw new Error(data.error || 'Failed to fetch player profile');
            }

            // Cache the profile locally
            this.cacheProfile(data.data);

            return data.data;
        } catch (error) {
            console.error('Failed to fetch player profile:', error);

            // Return cached profile if available
            return this.getCachedProfile();
        }
    }

    /**
     * Save/update player profile to Redis (via API)
     * PUT /api/player/:playerId
     */
    async savePlayerProfile(playerId: string, updateData: UpdatePlayerRequest): Promise<boolean> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/player/${playerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: UpdatePlayerResponse = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to save player profile');
            }

            // Fetch and cache updated profile
            await this.fetchPlayerProfile(playerId);

            return true;
        } catch (error) {
            console.error('Failed to save player profile:', error);
            return false;
        }
    }

    /**
     * Sync player data between localStorage and Redis
     * Call this on app load
     */
    async syncPlayer(): Promise<PlayerProfile | null> {
        const playerId = this.getPlayerId();
        const cachedProfile = this.getCachedProfile();

        try {
            // Try to fetch from Redis
            const serverProfile = await this.fetchPlayerProfile(playerId);

            if (serverProfile) {
                // Update localStorage cache
                this.cacheProfile(serverProfile);
                return serverProfile;
            }

            // If server profile doesn't exist but we have cached data, upload it
            if (cachedProfile) {
                await this.savePlayerProfile(playerId, {
                    name: cachedProfile.name,
                    totalGamesPlayed: cachedProfile.totalGamesPlayed,
                    topScores: cachedProfile.topScores,
                    preferences: cachedProfile.preferences,
                });

                return cachedProfile;
            }

            // No profile exists anywhere - return null
            return null;
        } catch (error) {
            console.error('Failed to sync player:', error);
            // Return cached profile as fallback
            return cachedProfile;
        }
    }

    /**
     * Update player stats after a game completes
     * Increments games played and updates top 5 scores
     */
    async updatePlayerStats(newScore: TopScore): Promise<void> {
        const playerId = this.getPlayerId();
        let profile = await this.fetchPlayerProfile(playerId);

        // If no profile exists, create a default one
        if (!profile) {
            const playerName = this.getPlayerName() || 'Player';
            await this.savePlayerProfile(playerId, {
                name: playerName,
                totalGamesPlayed: 1,
                topScores: [newScore],
                preferences: {
                    darkMode: false,
                    favoriteGeneration: 1,
                    soundEnabled: true,
                },
            });
            return;
        }

        // Update stats
        const updatedTopScores = [...profile.topScores, newScore]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // Keep only top 5

        await this.savePlayerProfile(playerId, {
            totalGamesPlayed: profile.totalGamesPlayed + 1,
            topScores: updatedTopScores,
        });
    }

    /**
     * Update player preferences
     */
    async updatePreferences(preferences: Partial<PlayerProfile['preferences']>): Promise<void> {
        const playerId = this.getPlayerId();
        await this.savePlayerProfile(playerId, { preferences });
    }

    /**
     * Initialize a new player (first-time setup)
     */
    async initializePlayer(name: string): Promise<PlayerProfile | null> {
        const playerId = this.getPlayerId();
        this.setPlayerName(name);

        const success = await this.savePlayerProfile(playerId, {
            name,
            totalGamesPlayed: 0,
            topScores: [],
            preferences: {
                darkMode: false,
                favoriteGeneration: 1,
                soundEnabled: true,
            },
        });

        if (success) {
            return await this.fetchPlayerProfile(playerId);
        }

        return null;
    }
}

// Export singleton instance
export const storageService = new StorageService();

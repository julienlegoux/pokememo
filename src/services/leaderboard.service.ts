import type {
    LeaderboardEntry,
    LeaderboardResponse,
    SubmitScoreRequest,
    SubmitScoreResponse,
} from '../lib/type';

/**
 * Leaderboard Service
 * Client-side wrapper for leaderboard API endpoints
 */
class LeaderboardService {
    private readonly API_BASE_URL: string;

    constructor() {
        // In development, use localhost. In production, use relative path
        this.API_BASE_URL = import.meta.env.DEV
            ? 'http://localhost:3000'
            : '';
    }

    /**
     * Fetch top 10 scores from the leaderboard
     * GET /api/leaderboard
     */
    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/leaderboard`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: LeaderboardResponse = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch leaderboard');
            }

            return data.data || [];
        } catch (error) {
            console.error('Leaderboard fetch error:', error);

            // Return empty array on error (graceful degradation)
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.warn('Network error - you may be offline');
                return [];
            }

            throw error;
        }
    }

    /**
     * Submit a player's score to the leaderboard
     * POST /api/submit-score
     */
    async submitScore(scoreData: SubmitScoreRequest): Promise<string> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/submit-score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scoreData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: SubmitScoreResponse = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to submit score');
            }

            return data.data?.id || '';
        } catch (error) {
            console.error('Score submission error:', error);

            // Check for network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Network error - unable to submit score. Please check your connection.');
            }

            throw error;
        }
    }

    /**
     * Check if the leaderboard API is reachable
     * Useful for showing offline status
     */
    async checkConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/leaderboard`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            return response.ok;
        } catch {
            return false;
        }
    }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();

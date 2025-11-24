import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
    PlayerProfile,
    UpdatePlayerRequest,
    PlayerProfileResponse,
    UpdatePlayerResponse,
    PokemonGeneration,
} from '../../src/lib/type';

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Validates player ID format (UUID)
 */
function isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}

/**
 * Validates update request body
 */
function validateUpdateRequest(body: unknown): body is UpdatePlayerRequest {
    if (!body || typeof body !== 'object') {
        return false;
    }

    const req = body as Partial<UpdatePlayerRequest>;

    // At least one field must be present
    if (!req.name && !req.totalGamesPlayed && !req.topScores && !req.preferences) {
        return false;
    }

    // Validate name if present
    if (req.name !== undefined) {
        if (typeof req.name !== 'string' || req.name.trim().length === 0 || req.name.length > 50) {
            return false;
        }
    }

    // Validate totalGamesPlayed if present
    if (req.totalGamesPlayed !== undefined) {
        if (typeof req.totalGamesPlayed !== 'number' || req.totalGamesPlayed < 0) {
            return false;
        }
    }

    // Validate topScores if present
    if (req.topScores !== undefined) {
        if (!Array.isArray(req.topScores) || req.topScores.length > 5) {
            return false;
        }
    }

    // Validate preferences if present
    if (req.preferences !== undefined) {
        if (typeof req.preferences !== 'object') {
            return false;
        }
    }

    return true;
}

/**
 * Creates a default player profile
 */
function createDefaultProfile(playerId: string, name: string = 'Player'): PlayerProfile {
    return {
        id: playerId,
        name: name,
        totalGamesPlayed: 0,
        topScores: [],
        preferences: {
            darkMode: false,
            favoriteGeneration: 1 as PokemonGeneration,
            soundEnabled: true,
        },
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
    };
}

/**
 * GET /api/player/[playerId]
 * Fetches player profile from Redis
 *
 * PUT /api/player/[playerId]
 * Creates or updates player profile in Redis
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
    }

    // Check Redis connection
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return res.status(500).setHeader('Access-Control-Allow-Origin', '*').json({
            success: false,
            error: 'Redis configuration missing',
        });
    }

    // Extract playerId from query params
    const { playerId } = req.query;

    if (!playerId || typeof playerId !== 'string') {
        return res.status(400).setHeader('Access-Control-Allow-Origin', '*').json({
            success: false,
            error: 'Player ID is required',
        });
    }

    // Validate UUID format
    if (!isValidUUID(playerId)) {
        return res.status(400).setHeader('Access-Control-Allow-Origin', '*').json({
            success: false,
            error: 'Invalid player ID format',
        });
    }

    const key = `player:${playerId}`;

    try {
        // === GET REQUEST ===
        if (req.method === 'GET') {
            const profile = await redis.get<PlayerProfile>(key);

            if (!profile) {
                return res.status(404).setHeader('Access-Control-Allow-Origin', '*').json({
                    success: false,
                    error: 'Player profile not found',
                });
            }

            return res.status(200).setHeader('Access-Control-Allow-Origin', '*').json({
                success: true,
                data: profile,
            });
        }

        // === PUT REQUEST ===
        if (req.method === 'PUT') {
            // Validate request body
            if (!validateUpdateRequest(req.body)) {
                return res.status(400).setHeader('Access-Control-Allow-Origin', '*').json({
                    success: false,
                    error: 'Invalid request body',
                });
            }

            const updateData = req.body as UpdatePlayerRequest;

            // Fetch existing profile or create new one
            let profile = await redis.get<PlayerProfile>(key);

            if (!profile) {
                // Create new profile
                profile = createDefaultProfile(playerId, updateData.name || 'Player');
            }

            // Update fields
            if (updateData.name !== undefined) {
                profile.name = updateData.name.trim();
            }

            if (updateData.totalGamesPlayed !== undefined) {
                profile.totalGamesPlayed = updateData.totalGamesPlayed;
            }

            if (updateData.topScores !== undefined) {
                // Keep only top 5 scores, sorted by score descending
                profile.topScores = updateData.topScores
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5);
            }

            if (updateData.preferences !== undefined) {
                profile.preferences = {
                    ...profile.preferences,
                    ...updateData.preferences,
                };
            }

            // Update lastPlayedAt
            profile.lastPlayedAt = Date.now();

            // Save to Redis
            await redis.set(key, profile);

            return res.status(200).setHeader('Access-Control-Allow-Origin', '*').json({
                success: true,
                data: { id: playerId },
            });
        }

        // === METHOD NOT ALLOWED ===
        return res.status(405).setHeader('Access-Control-Allow-Origin', '*').json({
            success: false,
            error: 'Method not allowed. Use GET or PUT.',
        });

    } catch (error) {
        console.error('Player API error:', error);
        return res.status(500).setHeader('Access-Control-Allow-Origin', '*').json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
}

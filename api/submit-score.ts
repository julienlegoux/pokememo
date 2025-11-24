import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import type {
    LeaderboardEntry,
    SubmitScoreRequest,
    SubmitScoreResponse,
    Difficulty,
} from '../src/lib/type';

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Validates the score submission request body
 */
function validateRequest(body: unknown): body is SubmitScoreRequest {
    if (!body || typeof body !== 'object') {
        return false;
    }

    const req = body as Partial<SubmitScoreRequest>;

    // Check required fields
    if (!req.playerId || typeof req.playerId !== 'string') return false;
    if (!req.playerName || typeof req.playerName !== 'string') return false;
    if (typeof req.score !== 'number' || req.score < 0) return false;
    if (!req.difficulty || !['easy', 'medium', 'hard'].includes(req.difficulty)) return false;
    if (typeof req.totalFlips !== 'number' || req.totalFlips < 0) return false;
    if (typeof req.matches !== 'number' || req.matches < 0) return false;

    // Validate player name (not empty, max 50 chars)
    if (req.playerName.trim().length === 0 || req.playerName.length > 50) {
        return false;
    }

    // Validate score makes sense (matches can't exceed total flips / 2)
    if (req.matches > req.totalFlips / 2) {
        return false;
    }

    return true;
}

/**
 * POST /api/submit-score
 * Saves a player's score to Redis
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.',
        });
    }

    try {
        // Check Redis connection
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            throw new Error('Redis configuration missing');
        }

        // Validate request body
        if (!validateRequest(req.body)) {
            return res.status(400).setHeader('Access-Control-Allow-Origin', '*').json({
                success: false,
                error: 'Invalid request body. Check required fields and values.',
            });
        }

        const {
            playerId,
            playerName,
            score,
            difficulty,
            totalFlips,
            matches,
        } = req.body as SubmitScoreRequest;

        // Generate unique ID for this score entry
        const scoreId = uuidv4();

        // Create leaderboard entry
        const entry: LeaderboardEntry = {
            id: scoreId,
            playerId: playerId.trim(),
            playerName: playerName.trim(),
            score: Math.round(score), // Ensure integer
            difficulty: difficulty as Difficulty,
            timestamp: Date.now(),
            totalFlips,
            matches,
        };

        // Save to Redis with key pattern: score:{uuid}
        const key = `score:${scoreId}`;
        await redis.set(key, entry);

        // Optional: Set TTL to auto-expire old scores (e.g., 90 days)
        // await redis.expire(key, 90 * 24 * 60 * 60);

        return res.status(201).setHeader('Access-Control-Allow-Origin', '*').json({
            success: true,
            data: { id: scoreId },
        });
    } catch (error) {
        console.error('Score submission error:', error);
        return res.status(500).setHeader('Access-Control-Allow-Origin', '*').json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to submit score',
        });
    }
}
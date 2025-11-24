import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { LeaderboardEntry, LeaderboardResponse } from '../src/lib/type';

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/leaderboard
 * Fetches the top 10 scores from Redis, sorted by score (highest first)
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use GET.',
        });
    }

    try {
        // Check Redis connection
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            throw new Error('Redis configuration missing');
        }

        // Get all score keys from Redis
        const keys: string[] = await redis.keys('score:*');

        // If no scores exist, return empty array
        if (!keys || keys.length === 0) {
            return res.status(200).setHeader('Access-Control-Allow-Origin', '*').json({
                success: true,
                data: [],
            });
        }

        // Fetch all score entries
        const entries: LeaderboardEntry[] = [];
        for (const key of keys) {
            const entry = await redis.get<LeaderboardEntry>(key);
            if (entry) {
                entries.push(entry);
            }
        }

        // Sort by score (highest first), then by timestamp (earliest first for ties)
        const sortedEntries = entries
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.timestamp - b.timestamp;
            })
            .slice(0, 10); // Get top 10

        return res.status(200).setHeader('Access-Control-Allow-Origin', '*').json({
            success: true,
            data: sortedEntries,
        });
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return res.status(500).setHeader('Access-Control-Allow-Origin', '*').json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
        });
    }
}
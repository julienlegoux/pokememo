import Pokedex from 'pokeapi-js-wrapper';
import type { Pokemon, PokemonGeneration, CacheEntry } from '../lib/type';

/**
 * Pokemon Service
 * Handles fetching Pokemon data from PokeAPI with caching
 * Supports Gen 1-3 only (Kanto, Johto, Hoenn)
 */
class PokemonService {
    private pokedex: Pokedex;
    private cache: Map<string, CacheEntry<Pokemon[]>>;
    private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
    private readonly GEN_RANGES = {
        1: { start: 1, end: 151 },      // Kanto
        2: { start: 152, end: 251 },    // Johto
        3: { start: 252, end: 386 },    // Hoenn
    };

    constructor() {
        this.pokedex = new Pokedex();
        this.cache = new Map();
    }

    /**
     * Get the ID range for a specific generation
     */
    private getGenerationRange(generation: PokemonGeneration): { start: number; end: number } {
        return this.GEN_RANGES[generation];
    }

    /**
     * Check if cache entry is still valid
     */
    private isCacheValid(entry: CacheEntry<Pokemon[]>): boolean {
        return Date.now() - entry.timestamp < this.CACHE_DURATION;
    }

    /**
     * Fetch a single Pokemon by ID from PokeAPI
     */
    async getPokemonById(id: number): Promise<Pokemon> {
        try {
            const response = await this.pokedex.getPokemonByName(id);

            return {
                id: response.id,
                name: response.name,
                spriteUrl: response.sprites.front_default || '',
            };
        } catch (error) {
            console.error(`Failed to fetch Pokemon ID ${id}:`, error);
            throw new Error(`Failed to fetch Pokemon ID ${id}`);
        }
    }

    /**
     * Fetch all Pokemon for a specific generation
     * Results are cached to minimize API calls
     */
    async getPokemonByGeneration(generation: PokemonGeneration): Promise<Pokemon[]> {
        const cacheKey = `gen${generation}`;

        // Check cache first
        const cachedEntry = this.cache.get(cacheKey);
        if (cachedEntry && this.isCacheValid(cachedEntry)) {
            console.log(`Cache hit for ${cacheKey}`);
            return cachedEntry.data;
        }

        console.log(`Cache miss for ${cacheKey}, fetching from API...`);

        // Fetch from API
        const range = this.getGenerationRange(generation);
        const promises: Promise<Pokemon>[] = [];

        for (let id = range.start; id <= range.end; id++) {
            promises.push(this.getPokemonById(id));
        }

        try {
            const pokemon = await Promise.all(promises);

            // Cache the results
            this.cache.set(cacheKey, {
                data: pokemon,
                timestamp: Date.now(),
            });

            return pokemon;
        } catch (error) {
            console.error(`Failed to fetch generation ${generation}:`, error);
            throw new Error(`Failed to fetch Pokemon for generation ${generation}`);
        }
    }

    /**
     * Get random Pokemon from a specific generation
     * @param generation - Which generation (1, 2, or 3)
     * @param count - How many random Pokemon to return
     * @returns Array of unique random Pokemon
     */
    async getRandomPokemon(generation: PokemonGeneration, count: number): Promise<Pokemon[]> {
        // Fetch all Pokemon for the generation (will use cache if available)
        const allPokemon = await this.getPokemonByGeneration(generation);

        // Shuffle and return the requested count
        const shuffled = this.shuffleArray([...allPokemon]);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    /**
     * Get random Pokemon from multiple generations
     * @param generations - Array of generations to include
     * @param count - How many random Pokemon to return
     * @returns Array of unique random Pokemon
     */
    async getRandomPokemonFromMultipleGens(
        generations: PokemonGeneration[],
        count: number
    ): Promise<Pokemon[]> {
        // Fetch Pokemon from all requested generations
        const promises = generations.map(gen => this.getPokemonByGeneration(gen));
        const results = await Promise.all(promises);

        // Flatten and shuffle
        const allPokemon = results.flat();
        const shuffled = this.shuffleArray(allPokemon);

        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    /**
     * Fisher-Yates shuffle algorithm
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Pre-fetch and cache all Gen 1-3 Pokemon
     * Call this on app initialization for better performance
     */
    async preloadAllGenerations(): Promise<void> {
        console.log('Preloading Pokemon generations 1-3...');

        try {
            await Promise.all([
                this.getPokemonByGeneration(1),
                this.getPokemonByGeneration(2),
                this.getPokemonByGeneration(3),
            ]);

            console.log('All generations preloaded and cached!');
        } catch (error) {
            console.error('Failed to preload generations:', error);
        }
    }

    /**
     * Clear all cached Pokemon data
     */
    clearCache(): void {
        this.cache.clear();
        console.log('Pokemon cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

// Export singleton instance
export const pokemonService = new PokemonService();

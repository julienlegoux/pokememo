import { pokemonService } from '../services/pokemon.service';
import {
    type GameConfig,
    type GameState,
    type Card,
    type Player,
    type GameEventType,
    type GameEventDetail,
    type CardPair,
    type Difficulty, TurnResult,
} from './type';
import { DIFFICULTY_CONFIG as DiffConfig } from './type';

/**
 * GameController
 * Main game engine that manages game state, turns, scoring, and timer
 * Uses CustomEvent API for event emission
 */
export class GameController extends EventTarget {
    private state: GameState | null = null;
    private timerInterval: number | null = null;
    private comparisonTimeout: number | null = null;

    private readonly TIMER_DURATION = 30; // seconds
    private readonly CARD_REVEAL_DURATION = 1000; // ms

    constructor() {
        super();
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Initialize a new game
     */
    async initGame(config: GameConfig): Promise<void> {
        // Validate config
        if (config.players.length < 1 || config.players.length > 4) {
            throw new Error('Game requires 1-4 players');
        }

        // Generate cards based on difficulty
        const cards = await this.generateCards(config.difficulty, config.theme.generation);

        // Initialize state
        this.state = {
            config,
            cards,
            players: config.players.map((player, index) => ({
                ...player,
                score: 0,
                totalFlips: 0,
                matches: 0,
                isActive: index === 0, // First player is active
            })),
            currentPlayerIndex: 0,
            revealedCards: [],
            timeRemaining: this.TIMER_DURATION,
            isPaused: true, // Start paused until startGame() is called
            isGameOver: false,
            winner: null,
        };

        this.emitEvent('stateChange', { state: this.state });
    }

    /**
     * Start the game (begins timer and gameplay)
     */
    startGame(): void {
        if (!this.state) {
            throw new Error('Game not initialized. Call initGame() first.');
        }

        if (this.state.isGameOver) {
            throw new Error('Game is already over');
        }

        this.state.isPaused = false;
        this.startTimer();
        this.emitEvent('gameResumed', { player: this.getCurrentPlayer() });
    }

    /**
     * Pause the game
     */
    pauseGame(): void {
        if (!this.state || this.state.isGameOver) return;

        this.state.isPaused = true;
        this.stopTimer();
        this.emitEvent('gamePaused', { reason: 'manual' });
    }

    /**
     * Resume the game
     */
    resumeGame(): void {
        if (!this.state || this.state.isGameOver) return;

        this.state.isPaused = false;
        this.startTimer();
        this.emitEvent('gameResumed', { player: this.getCurrentPlayer() });
    }

    /**
     * Flip a card (main game action)
     */
    flipCard(cardId: number): TurnResult {
        if (!this.state) {
            throw new Error('Game not initialized');
        }

        if (this.state.isPaused) {
            return TurnResult.INVALID;
        }

        if (this.state.isGameOver) {
            return TurnResult.GAME_OVER;
        }

        // Find the card
        const card = this.state.cards.find(c => c.id === cardId);
        if (!card) {
            return TurnResult.INVALID;
        }

        // Check if card is already matched or flipped
        if (card.isMatched || card.isFlipped) {
            return TurnResult.INVALID;
        }

        // Check if already two cards revealed
        if (this.state.revealedCards.length >= 2) {
            return TurnResult.INVALID;
        }

        // Flip the card
        card.isFlipped = true;
        this.state.revealedCards.push(card);

        const currentPlayer = this.getCurrentPlayer();

        // Increment totalFlips for current player
        const playerInState = this.state.players[this.state.currentPlayerIndex];
        playerInState.totalFlips = (playerInState.totalFlips || 0) + 1;

        this.emitEvent('cardFlipped', { card, player: currentPlayer });

        // If this is the first card, just wait for second
        if (this.state.revealedCards.length === 1) {
            return TurnResult.FIRST_CARD;
        }

        // Two cards revealed - compare them
        this.compareCards();

        return TurnResult.FIRST_CARD;
    }

    /**
     * Get current player
     */
    getCurrentPlayer(): Player {
        if (!this.state) {
            throw new Error('Game not initialized');
        }

        return this.state.players[this.state.currentPlayerIndex];
    }

    /**
     * Get current game state (readonly snapshot)
     */
    getGameState(): Readonly<GameState> | null {
        return this.state ? { ...this.state } : null;
    }

    // =========================================================================
    // PRIVATE METHODS - CARD GENERATION
    // =========================================================================

    /**
     * Generate shuffled cards based on difficulty
     */
    private async generateCards(difficulty: Difficulty, generation: number): Promise<Card[]> {
        const config = DiffConfig[difficulty];
        const uniqueCount = config.uniquePokemon;

        // Fetch random Pokemon
        const pokemon = await pokemonService.getRandomPokemon(generation as 1 | 2 | 3, uniqueCount);

        // Create pairs
        const cards: Card[] = [];
        let cardId = 0;

        pokemon.forEach(poke => {
            // Create two cards for each Pokemon (a pair)
            cards.push({
                id: cardId++,
                pokemonId: poke.id,
                image: poke.spriteUrl,
                isFlipped: false,
                isMatched: false,
            });

            cards.push({
                id: cardId++,
                pokemonId: poke.id,
                image: poke.spriteUrl,
                isFlipped: false,
                isMatched: false,
            });
        });

        // Shuffle using Fisher-Yates
        return this.shuffleArray(cards);
    }

    /**
     * Fisher-Yates shuffle
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // =========================================================================
    // PRIVATE METHODS - TURN LOGIC
    // =========================================================================

    /**
     * Compare two revealed cards
     */
    private compareCards(): void {
        if (!this.state || this.state.revealedCards.length !== 2) return;

        const [first, second] = this.state.revealedCards;
        const currentPlayer = this.getCurrentPlayer();

        // Clear revealed cards immediately to allow new flips
        // (we saved references to first/second above)
        this.state.revealedCards = [];

        // Pause game during comparison
        this.pauseTimer();

        // Wait for visual reveal (1000ms)
        this.comparisonTimeout = window.setTimeout(() => {
            if (!this.state) return;

            const pair: CardPair = { first, second };

            // Check if match
            if (first.pokemonId === second.pokemonId) {
                // MATCH!
                first.isMatched = true;
                second.isMatched = true;

                // Update player stats
                this.incrementPlayerMatches();

                this.emitEvent('match', { cards: pair, player: currentPlayer });

                // Player continues turn - reset timer
                this.resetTimer();
                this.resumeTimer();

                // Check win condition
                if (this.checkWinCondition()) {
                    this.endGame();
                }
            } else {
                // MISMATCH
                first.isFlipped = false;
                second.isFlipped = false;

                this.emitEvent('mismatch', { cards: pair, player: currentPlayer });

                // Switch to next player
                this.switchPlayer();
            }

            this.comparisonTimeout = null;
        }, this.CARD_REVEAL_DURATION);
    }

    /**
     * Switch to next player
     */
    private switchPlayer(): void {
        if (!this.state) return;

        const fromPlayer = this.getCurrentPlayer();

        // Move to next player
        this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;

        // Update isActive flags
        this.state.players.forEach((player, index) => {
            player.isActive = index === this.state!.currentPlayerIndex;
        });

        const toPlayer = this.getCurrentPlayer();

        // Reset timer for new player
        this.resetTimer();

        // Auto-pause between turns
        this.state.isPaused = true;
        this.stopTimer();

        this.emitEvent('turnSwitch', { fromPlayer, toPlayer });
        this.emitEvent('gamePaused', { reason: 'turn_switch' });
    }

    // =========================================================================
    // PRIVATE METHODS - TIMER
    // =========================================================================

    /**
     * Start/resume the timer
     */
    private startTimer(): void {
        if (this.timerInterval !== null) return;

        this.timerInterval = window.setInterval(() => {
            if (!this.state || this.state.isPaused) return;

            this.state.timeRemaining--;
            this.emitEvent('timerTick', { timeRemaining: this.state.timeRemaining });

            if (this.state.timeRemaining <= 0) {
                this.onTimerExpired();
            }
        }, 1000);
    }

    /**
     * Stop the timer
     */
    private stopTimer(): void {
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Pause timer (without clearing interval)
     */
    private pauseTimer(): void {
        // Timer will naturally pause because we don't decrement when isPaused is true
        // This is handled in the setInterval callback
    }

    /**
     * Resume timer
     */
    private resumeTimer(): void {
        // Timer will naturally resume when isPaused is false
    }

    /**
     * Reset timer to full duration
     */
    private resetTimer(): void {
        if (!this.state) return;
        this.state.timeRemaining = this.TIMER_DURATION;
    }

    /**
     * Handle timer expiration
     */
    private onTimerExpired(): void {
        if (!this.state) return;

        const currentPlayer = this.getCurrentPlayer();
        this.emitEvent('timerExpired', { player: currentPlayer });

        // Flip back any revealed unmatched cards
        this.state.revealedCards.forEach(card => {
            if (!card.isMatched) {
                card.isFlipped = false;
            }
        });
        this.state.revealedCards = [];

        // Switch to next player
        this.switchPlayer();
    }

    // =========================================================================
    // PRIVATE METHODS - SCORING
    // =========================================================================

    /**
     * Increment matches for current player and update score
     */
    private incrementPlayerMatches(): void {
        if (!this.state) return;

        const player = this.state.players[this.state.currentPlayerIndex];
        player.matches = (player.matches || 0) + 1;

        // Recalculate score immediately
        player.score = this.calculatePlayerScore(player.matches, player.totalFlips || 0);
    }

    /**
     * Calculate accuracy-based score for a player
     * Formula: (matches / totalFlips) × 1000
     */
    private calculatePlayerScore(matches: number, totalFlips: number): number {
        if (totalFlips === 0) return 0;
        return Math.round((matches / totalFlips) * 1000);
    }

    /**
     * Recalculate scores for all players
     */
    private recalculateAllScores(): void {
        if (!this.state) return;

        this.state.players.forEach(player => {
            player.score = this.calculatePlayerScore(
                player.matches || 0,
                player.totalFlips || 0
            );
        });
    }

    // =========================================================================
    // PRIVATE METHODS - GAME END
    // =========================================================================

    /**
     * Check if all cards are matched
     */
    private checkWinCondition(): boolean {
        if (!this.state) return false;
        return this.state.cards.every(card => card.isMatched);
    }

    /**
     * End the game and determine winner
     */
    private endGame(): void {
        if (!this.state) return;

        this.stopTimer();
        this.state.isGameOver = true;
        this.state.isPaused = true;

        // Recalculate all final scores
        this.recalculateAllScores();

        // Sort players by score (highest first)
        const finalScores = [...this.state.players].sort((a, b) => b.score - a.score);
        const highestScore = finalScores[0].score;

        // Check for ties
        const winners = finalScores.filter(p => p.score === highestScore);

        this.state.winner = winners.length === 1 ? winners[0] : null;

        this.emitEvent('gameOver', {
            winner: winners.length === 1 ? winners[0] : winners,
            finalScores,
        });
    }

    // =========================================================================
    // PRIVATE METHODS - EVENTS
    // =========================================================================

    /**
     * Emit a custom event
     */
    private emitEvent<T extends GameEventType>(
        type: T,
        detail: GameEventDetail[T]
    ): void {
        const event = new CustomEvent(type, { detail });
        this.dispatchEvent(event);
    }

    // =========================================================================
    // CLEANUP
    // =========================================================================

    /**
     * Destroy the game controller and clean up
     */
    destroy(): void {
        this.stopTimer();
        if (this.comparisonTimeout !== null) {
            clearTimeout(this.comparisonTimeout);
        }
        this.state = null;
    }
}

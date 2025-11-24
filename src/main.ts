/**
 * Main Application Entry Point
 * Bootstraps the Pokemon Memory Game application
 */

import './styles/main.css';
import { GameController } from './lib/game-controller';
import { storageService } from './services/storage.service';
import { leaderboardService } from './services/leaderboard.service';
import type { GameConfig, Player, Difficulty, PokemonGeneration, Card } from './lib/type';

// Import components (triggers custom element registration)
import './components/index';

/**
 * Main Application Class
 * Manages game lifecycle and component coordination
 */
class App {
    private gameController: GameController | null = null;
    private currentConfig: Partial<GameConfig> = {
        difficulty: 'medium' as Difficulty,
        generation: 1 as PokemonGeneration,
    };

    // DOM element references
    private playerSetupModal!: HTMLElement;
    private difficultySelectorModal!: HTMLElement;
    private themeSelectorEl!: HTMLElement;
    private gameBoardEl!: HTMLElement;
    private scoreDisplayEl!: HTMLElement;
    private timerDisplayEl!: HTMLElement;
    private leaderboardViewEl!: HTMLElement;
    private darkModeToggleEl!: HTMLElement;
    private gameContainer!: HTMLElement;
    private leaderboardContainer!: HTMLElement;

    /**
     * Initialize application
     */
    async init() {
        console.log('<� Initializing Pokemon Memory Game...');

        // 1. Setup DOM structure
        this.setupDOMStructure();

        // 2. Initialize dark mode
        this.initializeDarkMode();

        // 3. Setup global error handling
        this.setupErrorHandling();

        // 4. Register component event listeners
        this.registerEventListeners();

        // 5. Check for saved game
        const savedGame = await this.checkForSavedGame();

        // 6. Start game flow
        if (savedGame) {
            await this.showResumeGamePrompt(savedGame);
        } else {
            this.startGameFlow();
        }

        console.log(' Application initialized');
    }

    /**
     * Setup DOM structure for the application
     */
    private setupDOMStructure() {
        const app = document.querySelector('#app');
        if (!app) {
            throw new Error('App root element not found');
        }

        app.innerHTML = `
            <!-- Application Header -->
            <header class="app__header">
                <div class="app__header-left">
                    <h1 class="app__title"><� PokeMemo</h1>
                </div>
                <div class="app__header-right">
                    <dark-mode-toggle></dark-mode-toggle>
                </div>
            </header>

            <!-- Main Content Area -->
            <main class="app__main">
                <!-- Game Container (hidden initially) -->
                <div id="game-container" class="game-container game-container--with-sidebar" style="display: none;">
                    <!-- Game Header -->
                    <div class="game-container__header">
                        <div class="game-container__controls">
                            <theme-selector></theme-selector>
                            <timer-display></timer-display>
                            <button id="new-game-btn" class="btn btn--secondary">New Game</button>
                            <button id="view-leaderboard-btn" class="btn btn--secondary">Leaderboard</button>
                        </div>
                    </div>

                    <!-- Game Board -->
                    <div class="game-container__board">
                        <game-board></game-board>
                    </div>

                    <!-- Sidebar with Scores -->
                    <div class="game-container__sidebar">
                        <score-display></score-display>
                    </div>
                </div>

                <!-- Leaderboard Container (shown after game) -->
                <div id="leaderboard-container" class="leaderboard-container" style="display: none;">
                    <div class="leaderboard-container__header">
                        <h2><� Top Scores</h2>
                        <button id="close-leaderboard-btn" class="btn btn--secondary">Close</button>
                    </div>
                    <leaderboard-view></leaderboard-view>
                </div>
            </main>

            <!-- Footer -->
            <footer class="app__footer">
                <p>Built with d using TypeScript, Vite, and PokeAPI</p>
            </footer>

            <!-- Modals -->
            <player-setup id="player-setup-modal"></player-setup>
            <difficulty-selector id="difficulty-selector-modal"></difficulty-selector>
        `;

        // Cache DOM references
        this.playerSetupModal = document.querySelector('#player-setup-modal')!;
        this.difficultySelectorModal = document.querySelector('#difficulty-selector-modal')!;
        this.themeSelectorEl = document.querySelector('theme-selector')!;
        this.gameBoardEl = document.querySelector('game-board')!;
        this.scoreDisplayEl = document.querySelector('score-display')!;
        this.timerDisplayEl = document.querySelector('timer-display')!;
        this.leaderboardViewEl = document.querySelector('leaderboard-view')!;
        this.darkModeToggleEl = document.querySelector('dark-mode-toggle')!;
        this.gameContainer = document.querySelector('#game-container')!;
        this.leaderboardContainer = document.querySelector('#leaderboard-container')!;
    }

    /**
     * Initialize dark mode from localStorage
     */
    private initializeDarkMode() {
        // Dark mode toggle handles this automatically via its constructor
        console.log('< Dark mode initialized');
    }

    /**
     * Setup global error handling
     */
    private setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showErrorMessage('An unexpected error occurred. Please refresh the page.');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showErrorMessage('An unexpected error occurred. Please refresh the page.');
        });
    }

    /**
     * Register all event listeners
     */
    private registerEventListeners() {
        // Player setup modal events
        this.playerSetupModal.addEventListener('playersconfigured', ((event: CustomEvent) => {
            const players = event.detail.players as Player[];
            this.onPlayersConfigured(players);
        }) as EventListener);

        // Difficulty selector events
        this.difficultySelectorModal.addEventListener('difficultyselected', ((event: CustomEvent) => {
            const difficulty = event.detail.difficulty as Difficulty;
            this.onDifficultySelected(difficulty);
        }) as EventListener);

        // Theme selector events
        this.themeSelectorEl.addEventListener('themeselected', ((event: CustomEvent) => {
            const generation = event.detail.generation as PokemonGeneration;
            this.onThemeSelected(generation);
        }) as EventListener);

        // Game board card flip events
        this.gameBoardEl.addEventListener('cardflip', ((event: CustomEvent) => {
            const cardId = event.detail.cardId as number;
            this.onCardFlipped(cardId);
        }) as EventListener);

        // New game button
        document.querySelector('#new-game-btn')?.addEventListener('click', () => {
            this.startNewGame();
        });

        // View leaderboard button
        document.querySelector('#view-leaderboard-btn')?.addEventListener('click', () => {
            this.showLeaderboard();
        });

        // Close leaderboard button
        document.querySelector('#close-leaderboard-btn')?.addEventListener('click', () => {
            this.hideLeaderboard();
        });
    }

    /**
     * Check for saved game in localStorage
     */
    private async checkForSavedGame(): Promise<any | null> {
        try {
            const savedGame = await storageService.loadGame();
            if (savedGame && savedGame.state?.cards?.length > 0) {
                console.log('=� Found saved game');
                return savedGame;
            }
            return null;
        } catch (error) {
            console.error('Error loading saved game:', error);
            return null;
        }
    }

    /**
     * Show prompt to resume saved game
     */
    private async showResumeGamePrompt(savedGame: any) {
        const resume = confirm(
            'You have a game in progress. Would you like to resume it?'
        );

        if (resume) {
            await this.resumeGame(savedGame);
        } else {
            await storageService.clearGame();
            this.startGameFlow();
        }
    }

    /**
     * Resume saved game
     */
    private async resumeGame(savedGame: any) {
        try {
            console.log('� Resuming saved game');

            // Extract saved configuration
            this.currentConfig = {
                difficulty: savedGame.config.difficulty,
                generation: savedGame.config.generation,
            };

            // Initialize game controller with saved state
            this.gameController = new GameController({
                ...savedGame.config,
            });

            // Register game controller events
            this.registerGameControllerEvents();

            // Restore game state
            // Note: GameController would need a restoreState method for full restoration
            // For now, we'll start a new game with the same config

            // Show game UI
            this.showGameUI();

            // Start new game with same config
            await this.initializeGame(savedGame.config.players);

        } catch (error) {
            console.error('Error resuming game:', error);
            this.showErrorMessage('Failed to resume game. Starting new game...');
            await storageService.clearGame();
            this.startGameFlow();
        }
    }

    /**
     * Start the game flow (show player setup)
     */
    private startGameFlow() {
        console.log('<� Starting game flow');
        (this.playerSetupModal as any).open();
    }

    /**
     * Start a new game
     */
    private startNewGame() {
        const confirmNew = confirm(
            'Are you sure you want to start a new game? Current progress will be lost.'
        );

        if (confirmNew) {
            this.gameController = null;
            storageService.clearGame();
            this.hideGameUI();
            this.startGameFlow();
        }
    }

    /**
     * Handle players configured event
     */
    private onPlayersConfigured(players: Player[]) {
        console.log('=e Players configured:', players);
        this.currentConfig.players = players;

        // Show difficulty selector
        (this.difficultySelectorModal as any).open();
    }

    /**
     * Handle difficulty selected event
     */
    private async onDifficultySelected(difficulty: Difficulty) {
        console.log('<� Difficulty selected:', difficulty);
        this.currentConfig.difficulty = difficulty;

        // Initialize and start the game
        await this.initializeGame(this.currentConfig.players!);
    }

    /**
     * Handle theme selected event
     */
    private onThemeSelected(generation: PokemonGeneration) {
        console.log('<� Theme selected:', generation);
        this.currentConfig.generation = generation;

        // Restart game with new theme
        if (this.gameController) {
            const confirmRestart = confirm(
                'Changing theme will restart the game. Continue?'
            );

            if (confirmRestart) {
                this.initializeGame(this.currentConfig.players!);
            }
        }
    }

    /**
     * Initialize and start a new game
     */
    private async initializeGame(players: Player[]) {
        try {
            console.log('<� Initializing game...');

            // Create game controller
            const config: GameConfig = {
                players,
                difficulty: this.currentConfig.difficulty as Difficulty,
                generation: this.currentConfig.generation as PokemonGeneration,
            };

            this.gameController = new GameController(config);

            // Register game controller events
            this.registerGameControllerEvents();

            // Initialize the game (fetches Pokemon, creates cards, shuffles)
            await this.gameController.initGame();

            // Show game UI
            this.showGameUI();

            // Update UI with initial state
            this.updateUI();

            console.log(' Game initialized');

        } catch (error) {
            console.error('Error initializing game:', error);
            this.showErrorMessage('Failed to initialize game. Please try again.');
            this.hideGameUI();
            this.startGameFlow();
        }
    }

    /**
     * Register GameController event listeners
     */
    private registerGameControllerEvents() {
        if (!this.gameController) return;

        // Card flipped event
        this.gameController.addEventListener('cardFlipped', ((event: CustomEvent) => {
            const { cardId } = event.detail;
            this.onCardFlippedByController(cardId);
        }) as EventListener);

        // Match found event
        this.gameController.addEventListener('matchFound', ((event: CustomEvent) => {
            const { cardIds, playerId } = event.detail;
            this.onMatchFound(cardIds, playerId);
        }) as EventListener);

        // Mismatch event
        this.gameController.addEventListener('mismatch', ((event: CustomEvent) => {
            const { cardIds } = event.detail;
            this.onMismatch(cardIds);
        }) as EventListener);

        // Turn ended event
        this.gameController.addEventListener('turnEnded', ((event: CustomEvent) => {
            this.onTurnEnded();
        }) as EventListener);

        // Timer tick event
        this.gameController.addEventListener('timerTick', ((event: CustomEvent) => {
            const { timeRemaining } = event.detail;
            this.onTimerTick(timeRemaining);
        }) as EventListener);

        // Timer expired event
        this.gameController.addEventListener('timerExpired', ((event: CustomEvent) => {
            this.onTimerExpired();
        }) as EventListener);

        // Game completed event
        this.gameController.addEventListener('gameCompleted', ((event: CustomEvent) => {
            const { winners, players } = event.detail;
            this.onGameCompleted(winners, players);
        }) as EventListener);
    }

    /**
     * Handle card flipped by user
     */
    private async onCardFlipped(cardId: number) {
        if (!this.gameController) return;

        try {
            await this.gameController.flipCard(cardId);

            // Save game state after every flip
            await this.saveGameState();

        } catch (error) {
            console.error('Error flipping card:', error);
        }
    }

    /**
     * Handle card flipped event from controller
     */
    private onCardFlippedByController(cardId: number) {
        const state = this.gameController?.getState();
        if (!state) return;

        const card = state.cards.find(c => c.id === cardId);
        if (card) {
            (this.gameBoardEl as any).updateCard(cardId, { isFlipped: true });
        }
    }

    /**
     * Handle match found
     */
    private onMatchFound(cardIds: number[], playerId: string) {
        console.log(' Match found:', cardIds, 'by player:', playerId);

        // Update cards to matched state
        cardIds.forEach(cardId => {
            (this.gameBoardEl as any).updateCard(cardId, { isMatched: true });
        });

        // Update score display
        this.updateScoreDisplay();
    }

    /**
     * Handle mismatch
     */
    private onMismatch(cardIds: number[]) {
        console.log('L Mismatch:', cardIds);

        // Add mismatch animation class
        cardIds.forEach(cardId => {
            const cardElement = this.gameBoardEl.querySelector(`[data-card-id="${cardId}"]`);
            cardElement?.classList.add('pokemon-card--mismatch');

            // Remove class after animation
            setTimeout(() => {
                cardElement?.classList.remove('pokemon-card--mismatch');
            }, 300);
        });
    }

    /**
     * Handle turn ended
     */
    private onTurnEnded() {
        console.log('= Turn ended');

        // Update UI to show next player
        this.updateScoreDisplay();

        // Show turn resume button if multiplayer
        const state = this.gameController?.getState();
        if (state && state.players.length > 1) {
            this.showTurnResumePrompt();
        }
    }

    /**
     * Show turn resume prompt for multiplayer
     */
    private showTurnResumePrompt() {
        const state = this.gameController?.getState();
        if (!state) return;

        const currentPlayer = state.players[state.currentPlayerIndex];

        alert(`${currentPlayer.name}'s turn. Click OK to continue.`);
    }

    /**
     * Handle timer tick
     */
    private onTimerTick(timeRemaining: number) {
        (this.timerDisplayEl as any).setTime(timeRemaining);
    }

    /**
     * Handle timer expired
     */
    private onTimerExpired() {
        console.log('� Timer expired');

        alert('Time expired! Turn automatically ended.');

        // Controller already switched player, just update UI
        this.updateScoreDisplay();
    }

    /**
     * Handle game completed
     */
    private async onGameCompleted(winners: Player[], players: Player[]) {
        console.log('<� Game completed!', winners);

        // Save final scores to leaderboard
        await this.saveScoresToLeaderboard(players);

        // Clear saved game
        await storageService.clearGame();

        // Show completion message
        const winnerNames = winners.map(w => w.name).join(', ');
        const message = winners.length > 1
            ? `<� Tie game! Winners: ${winnerNames}`
            : `<� ${winnerNames} wins!`;

        alert(message);

        // Auto-show leaderboard
        await this.showLeaderboard();
    }

    /**
     * Save scores to leaderboard
     */
    private async saveScoresToLeaderboard(players: Player[]) {
        try {
            const difficulty = this.currentConfig.difficulty as Difficulty;

            for (const player of players) {
                await leaderboardService.submitScore({
                    playerName: player.name,
                    score: player.score,
                    difficulty,
                    matches: player.matches,
                    totalFlips: player.totalFlips,
                });
            }

            console.log('=� Scores saved to leaderboard');
        } catch (error) {
            console.error('Error saving scores:', error);
        }
    }

    /**
     * Save current game state
     */
    private async saveGameState() {
        if (!this.gameController) return;

        try {
            const state = this.gameController.getState();
            const config = {
                players: state.players,
                difficulty: this.currentConfig.difficulty,
                generation: this.currentConfig.generation,
            };

            await storageService.saveGame({ config, state });
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    /**
     * Update all UI components
     */
    private updateUI() {
        const state = this.gameController?.getState();
        if (!state) return;

        // Update game board
        (this.gameBoardEl as any).setCards(state.cards, this.currentConfig.difficulty);

        // Update score display
        this.updateScoreDisplay();

        // Update timer
        (this.timerDisplayEl as any).setTime(state.timeRemaining);

        // Update theme selector
        (this.themeSelectorEl as any).setGeneration(this.currentConfig.generation);
    }

    /**
     * Update score display
     */
    private updateScoreDisplay() {
        const state = this.gameController?.getState();
        if (!state) return;

        (this.scoreDisplayEl as any).updatePlayers(
            state.players,
            state.currentPlayerIndex
        );
    }

    /**
     * Show game UI
     */
    private showGameUI() {
        this.gameContainer.style.display = 'flex';
        this.leaderboardContainer.style.display = 'none';
    }

    /**
     * Hide game UI
     */
    private hideGameUI() {
        this.gameContainer.style.display = 'none';
    }

    /**
     * Show leaderboard
     */
    private async showLeaderboard() {
        try {
            console.log('<� Loading leaderboard...');

            // Set loading state
            (this.leaderboardViewEl as any).setLoading(true);

            // Hide game UI
            this.gameContainer.style.display = 'none';
            this.leaderboardContainer.style.display = 'block';

            // Fetch leaderboard data
            const entries = await leaderboardService.getTopScores(10);

            // Update leaderboard view
            (this.leaderboardViewEl as any).setEntries(entries);
            (this.leaderboardViewEl as any).setLoading(false);

        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showErrorMessage('Failed to load leaderboard');
            (this.leaderboardViewEl as any).setLoading(false);
        }
    }

    /**
     * Hide leaderboard
     */
    private hideLeaderboard() {
        this.leaderboardContainer.style.display = 'none';

        // Show game UI if game exists, otherwise start new game flow
        if (this.gameController) {
            this.showGameUI();
        } else {
            this.startGameFlow();
        }
    }

    /**
     * Show error message to user
     */
    private showErrorMessage(message: string) {
        alert(`L ${message}`);
    }
}

// Bootstrap application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}

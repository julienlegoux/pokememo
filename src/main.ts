/**
 * Main Application Entry Point
 * Bootstraps the Pokemon Memory Game application
 */

import './styles/main.css';
import { GameController } from './lib/game-controller';
import { storageService } from './services/storage.service';
import { leaderboardService } from './services/leaderboard.service';
import type { GameConfig, Player, Difficulty, PokemonGeneration } from './lib/type';

// Import components (triggers custom element registration)
import './components/index';
import { PlayerSetup } from './components';
import { DifficultySelector } from './components';
import { ThemeSelector } from './components';
import { GameBoard } from './components';
import { ScoreDisplay } from './components';
import { TimerDisplay } from './components';
import { LeaderboardView } from './components';
import { DarkModeToggle } from './components';

/**
 * Main Application Class
 * Manages game lifecycle and component coordination
 */
class App {
    private gameController: GameController | null = null;
    private currentConfig: Partial<GameConfig> = {
        difficulty: 'medium' as Difficulty,
        theme: { generation: 1 as PokemonGeneration },
    };

    // DOM element references
    private playerSetupModal!: PlayerSetup;
    private difficultySelectorModal!: DifficultySelector;
    private themeSelectorEl!: ThemeSelector;
    private gameBoardEl!: GameBoard;
    private scoreDisplayEl!: ScoreDisplay;
    private timerDisplayEl!: TimerDisplay;
    private leaderboardViewEl!: LeaderboardView;
    private darkModeToggleEl!: DarkModeToggle;
    private gameContainer!: HTMLElement;
    private leaderboardContainer!: HTMLElement;

    /**
     * Initialize application
     */
    async init() {
        console.log('🎮 Initializing Pokemon Memory Game...');

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

        console.log('✅ Application initialized');
    }

    /**
     * Setup DOM structure for the application
     */
    private setupDOMStructure() {
        const app = document.querySelector('#app');
        if (!app) {
            throw new Error('App root element not found');
        }

        // Add the 'app' class to ensure responsive.css styles apply correctly
        app.classList.add('app');

        app.innerHTML = `
            <header class="app__header">
                <div class="app__header-left">
                    <h1 class="app__title">🎮 PokeMemo</h1>
                </div>
                <div class="app__header-right">
                    <dark-mode-toggle></dark-mode-toggle>
                </div>
            </header>

            <main class="app__main">
                <div id="game-container" class="game-container game-container--with-sidebar" style="display: none;">
                    <div class="game-container__header">
                        <div class="game-container__controls">
                            <theme-selector></theme-selector>
                            <timer-display></timer-display>
                            <button id="new-game-btn" class="btn btn--secondary">New Game</button>
                            <button id="view-leaderboard-btn" class="btn btn--secondary">Leaderboard</button>
                        </div>
                    </div>

                    <div class="game-container__board">
                        <game-board></game-board>
                    </div>

                    <div class="game-container__sidebar">
                        <score-display></score-display>
                    </div>
                </div>

                <div id="leaderboard-container" class="leaderboard-container" style="display: none;">
                    <div class="leaderboard-container__header">
                        <h2>🏆 Top Scores</h2>
                        <button id="close-leaderboard-btn" class="btn btn--secondary">Close</button>
                    </div>
                    <leaderboard-view></leaderboard-view>
                </div>
            </main>

            <footer class="app__footer">
                <p>Built with ❤️ using TypeScript, Vite, and PokeAPI</p>
            </footer>

            <player-setup id="player-setup-modal"></player-setup>
            <difficulty-selector id="difficulty-selector-modal"></difficulty-selector>
        `;

        // Cache DOM references and cast to specific component types
        this.playerSetupModal = document.querySelector('#player-setup-modal') as PlayerSetup;
        this.difficultySelectorModal = document.querySelector('#difficulty-selector-modal') as DifficultySelector;
        this.themeSelectorEl = document.querySelector('theme-selector') as ThemeSelector;
        this.gameBoardEl = document.querySelector('game-board') as GameBoard;
        this.scoreDisplayEl = document.querySelector('score-display') as ScoreDisplay;
        this.timerDisplayEl = document.querySelector('timer-display') as TimerDisplay;
        this.leaderboardViewEl = document.querySelector('leaderboard-view') as LeaderboardView;
        this.darkModeToggleEl = document.querySelector('dark-mode-toggle') as DarkModeToggle;

        // Standard HTML elements
        this.gameContainer = document.querySelector('#game-container') as HTMLElement;
        this.leaderboardContainer = document.querySelector('#leaderboard-container') as HTMLElement;
    }

    /**
     * Initialize dark mode from localStorage
     */
    private initializeDarkMode() {
        // Dark mode toggle handles this automatically via its constructor
        console.log('🌙 Dark mode initialized');
    }

    /**
     * Setup global error handling
     */
    private setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            // this.showErrorMessage('An unexpected error occurred. Please refresh the page.');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            // this.showErrorMessage('An unexpected error occurred. Please refresh the page.');
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
            const savedGame = storageService.loadGame();
            if (savedGame && savedGame.state?.cards?.length > 0) {
                console.log('💾 Found saved game');
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
            storageService.clearGame();
            this.startGameFlow();
        }
    }

    /**
     * Resume saved game
     */
    private async resumeGame(savedGame: any) {
        try {
            console.log('▶️ Resuming saved game');

            // Extract saved configuration
            this.currentConfig = {
                difficulty: savedGame.config.difficulty,
                theme: savedGame.config.theme,
            };

            // Initialize game controller with saved state
            this.gameController = new GameController();

            // Register game controller events
            this.registerGameControllerEvents();

            // Show game UI
            this.showGameUI();

            // Start new game with same config
            await this.initializeGame(savedGame.config.players);

        } catch (error) {
            console.error('Error resuming game:', error);
            this.showErrorMessage('Failed to resume game. Starting new game...');
            storageService.clearGame();
            this.startGameFlow();
        }
    }

    /**
     * Start the game flow (show player setup)
     */
    private startGameFlow() {
        console.log('🎬 Starting game flow');
        if (this.playerSetupModal && typeof this.playerSetupModal.open === 'function') {
            this.playerSetupModal.open();
        } else {
            console.error('Player setup modal not ready');
        }
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
        console.log('👥 Players configured:', players);
        this.currentConfig.players = players;

        // Show difficulty selector
        if (this.difficultySelectorModal && typeof this.difficultySelectorModal.open === 'function') {
            this.difficultySelectorModal.open();
        }
    }

    /**
     * Handle difficulty selected event
     */
    private async onDifficultySelected(difficulty: Difficulty) {
        console.log('🎯 Difficulty selected:', difficulty);
        this.currentConfig.difficulty = difficulty;

        // Initialize and start the game
        await this.initializeGame(this.currentConfig.players!);
    }

    /**
     * Handle theme selected event
     */
    private onThemeSelected(generation: PokemonGeneration) {
        console.log('🎨 Theme selected:', generation);
        this.currentConfig.theme = { generation };

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
            console.log('🎮 Initializing game...');

            // Create game controller
            this.gameController = new GameController();

            // Register game controller events
            this.registerGameControllerEvents();

            const config: GameConfig = {
                players,
                difficulty: this.currentConfig.difficulty as Difficulty,
                theme: this.currentConfig.theme || { generation: 1 },
            };

            // Initialize the game (fetches Pokemon, creates cards, shuffles)
            await this.gameController.initGame(config);
            this.gameController.startGame();

            // Show game UI
            this.showGameUI();

            // Update UI with initial state
            this.updateUI();

            console.log('✅ Game initialized');

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
        this.gameController.addEventListener('match', ((event: CustomEvent) => {
            const { cards, player } = event.detail;
            // Convert Card objects to IDs
            const cardIds = [cards.first.id, cards.second.id];
            this.onMatchFound(cardIds, player.id);
        }) as EventListener);

        // Mismatch event
        this.gameController.addEventListener('mismatch', ((event: CustomEvent) => {
            const { cards } = event.detail;
            const cardIds = [cards.first.id, cards.second.id];
            this.onMismatch(cardIds);
        }) as EventListener);

        // Turn ended / switched event
        this.gameController.addEventListener('turnSwitch', ((event: CustomEvent) => {
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
        this.gameController.addEventListener('gameOver', ((event: CustomEvent) => {
            const { winner, finalScores } = event.detail;
            // Handle single winner or array of winners (ties)
            const winners = Array.isArray(winner) ? winner : (winner ? [winner] : []);
            this.onGameCompleted(winners, finalScores);
        }) as EventListener);
    }

    /**
     * Handle card flipped by user
     */
    private async onCardFlipped(cardId: number) {
        if (!this.gameController) return;

        try {
            this.gameController.flipCard(cardId);

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
        const state = this.gameController?.getGameState();
        if (!state) return;

        const card = state.cards.find(c => c.id === cardId);
        if (card) {
            this.gameBoardEl.updateCard(cardId, { isFlipped: true });
        }
    }

    /**
     * Handle match found
     */
    private onMatchFound(cardIds: number[], playerId: string) {
        console.log('✅ Match found:', cardIds, 'by player:', playerId);

        // Update cards to matched state
        cardIds.forEach(cardId => {
            this.gameBoardEl.updateCard(cardId, { isMatched: true });
        });

        // Update score display
        this.updateScoreDisplay();
    }

    /**
     * Handle mismatch
     */
    private onMismatch(cardIds: number[]) {
        console.log('❌ Mismatch:', cardIds);

        // Add mismatch animation class
        cardIds.forEach(cardId => {
            const cardElement = this.gameBoardEl.querySelector(`pokemon-card[card-data*='"id":${cardId}']`);
            if (cardElement) {
                cardElement.classList.add('pokemon-card--mismatch');
                setTimeout(() => {
                    cardElement.classList.remove('pokemon-card--mismatch');
                    // The controller handles flipping them back in state,
                    // but we need to sync the visual state when that happens
                    this.updateUI();
                }, 1000);
            }
        });
    }

    /**
     * Handle turn ended
     */
    private onTurnEnded() {
        console.log('🔄 Turn ended');

        // Update UI to show next player
        this.updateScoreDisplay();

        // Show turn resume button if multiplayer
        const state = this.gameController?.getGameState();
        if (state && state.players.length > 1) {
            this.showTurnResumePrompt();
        } else if (state) {
            // Single player, just resume
            this.gameController?.resumeGame();
        }
    }

    /**
     * Show turn resume prompt for multiplayer
     */
    private showTurnResumePrompt() {
        const state = this.gameController?.getGameState();
        if (!state) return;

        const currentPlayer = state.players[state.currentPlayerIndex];

        // In a real app, use a custom modal. Using alert/confirm blocks execution which is handy here.
        setTimeout(() => {
            alert(`${currentPlayer.name}'s turn. Click OK to continue.`);
            this.gameController?.resumeGame();
        }, 100);
    }

    /**
     * Handle timer tick
     */
    private onTimerTick(timeRemaining: number) {
        this.timerDisplayEl.updateTime(timeRemaining);
    }

    /**
     * Handle timer expired
     */
    private onTimerExpired() {
        console.log('⏰ Timer expired');
        alert('Time expired! Turn automatically ended.');
        this.updateScoreDisplay();
    }

    /**
     * Handle game completed
     */
    private async onGameCompleted(winners: Player[], players: Player[]) {
        console.log('🎉 Game completed!', winners);

        // Save final scores to leaderboard
        await this.saveScoresToLeaderboard(players);

        // Clear saved game
        storageService.clearGame();

        // Show completion message
        const winnerNames = winners.map(w => w.name).join(', ');
        const message = winners.length > 1
            ? `🎉 Tie game! Winners: ${winnerNames}`
            : `🎉 ${winnerNames} wins!`;

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
                    playerId: player.id,
                    playerName: player.name,
                    score: player.score,
                    difficulty,
                    matches: player.matches || 0,
                    totalFlips: player.totalFlips || 0,
                });
            }

            console.log('💾 Scores saved to leaderboard');
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
            const state = this.gameController.getGameState();
            if (!state) return;

            const config = {
                players: state.players,
                difficulty: this.currentConfig.difficulty,
                theme: this.currentConfig.theme,
            };

            storageService.saveGame({ config, state });
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    /**
     * Update all UI components
     */
    private updateUI() {
        const state = this.gameController?.getGameState();
        if (!state) return;

        // Update game board
        this.gameBoardEl.updateCards(state.cards);

        // Update score display
        this.updateScoreDisplay();

        // Update timer
        this.timerDisplayEl.updateTime(state.timeRemaining);

        // Update theme selector
        if (this.currentConfig.theme?.generation) {
            this.themeSelectorEl.setGeneration(this.currentConfig.theme.generation);
        }
    }

    /**
     * Update score display
     */
    private updateScoreDisplay() {
        const state = this.gameController?.getGameState();
        if (!state) return;

        this.scoreDisplayEl.updatePlayers(
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
            console.log('🏆 Loading leaderboard...');

            // Set loading state
            this.leaderboardViewEl.setLoading(true);

            // Hide game UI
            this.gameContainer.style.display = 'none';
            this.leaderboardContainer.style.display = 'block';

            // Fetch leaderboard data
            const entries = await leaderboardService.getLeaderboard();

            // Update leaderboard view
            this.leaderboardViewEl.updateEntries(entries);
            this.leaderboardViewEl.setLoading(false);

        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showErrorMessage('Failed to load leaderboard');
            this.leaderboardViewEl.setLoading(false);
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
        alert(`❌ Error: ${message}`);
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

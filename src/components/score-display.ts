import type { Player } from '../lib/type';

/**
 * ScoreDisplay Web Component
 * Shows all player scores with active player highlight
 *
 * Usage:
 *   const scoreDisplay = document.createElement('score-display');
 *   scoreDisplay.setAttribute('players-data', JSON.stringify(playersArray));
 *   scoreDisplay.setAttribute('current-player-index', '0');
 */
export class ScoreDisplay extends HTMLElement {
    private players: Player[] = [];
    private currentPlayerIndex: number = 0;

    static get observedAttributes() {
        return ['players-data', 'current-player-index'];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === 'players-data' && newValue) {
            try {
                this.players = JSON.parse(newValue);
                this.render();
            } catch (e) {
                console.error('Invalid players data:', e);
            }
        }

        if (name === 'current-player-index') {
            this.currentPlayerIndex = parseInt(newValue, 10) || 0;
            this.render();
        }
    }

    private render() {
        this.className = 'score-display';

        const playersHTML = this.players.map((player, index) => {
            const isActive = index === this.currentPlayerIndex;
            const cardClass = [
                'player-card',
                isActive ? 'player-card--active' : '',
            ].filter(Boolean).join(' ');

            return `
                <div class="${cardClass}">
                    <div class="player-card__header">
                        <h3 class="player-card__name">${player.name}</h3>
                        ${isActive ? '<span class="player-card__badge">Active</span>' : ''}
                    </div>
                    <div class="player-card__stats">
                        <div class="player-card__stat">
                            <span class="player-card__stat-label">Score</span>
                            <span class="player-card__stat-value player-card__stat-value--primary">${player.score}</span>
                        </div>
                        <div class="player-card__stat">
                            <span class="player-card__stat-label">Matches</span>
                            <span class="player-card__stat-value">${player.matches || 0}</span>
                        </div>
                        <div class="player-card__stat">
                            <span class="player-card__stat-label">Flips</span>
                            <span class="player-card__stat-value">${player.totalFlips || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.innerHTML = `
            <div class="score-display__container">
                ${playersHTML}
            </div>
        `;
    }

    // Public method to update players
    public updatePlayers(players: Player[], currentPlayerIndex: number) {
        this.players = players;
        this.currentPlayerIndex = currentPlayerIndex;
        this.render();
    }
}

// Register custom element
if (!customElements.get('score-display')) {
    customElements.define('score-display', ScoreDisplay);
}

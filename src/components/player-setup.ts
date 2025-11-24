import { v4 as uuidv4 } from 'uuid';
import type { Player } from '../lib/type';

/**
 * PlayerSetup Web Component
 * Modal for configuring 1-4 players
 *
 * Usage:
 *   const setup = document.createElement('player-setup');
 *   setup.addEventListener('playersconfigured', (e) => {
 *     console.log(e.detail.players);
 *   });
 *   setup.open();
 */
export class PlayerSetup extends HTMLElement {
    private isOpen: boolean = false;
    private playerNames: string[] = ['Player 1'];

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    private render() {
        this.className = 'player-setup';

        const canAddMore = this.playerNames.length < 4;
        const canRemove = this.playerNames.length > 1;

        const playersHTML = this.playerNames.map((name, index) => `
            <div class="player-input">
                <label class="player-input__label" for="player-${index}">
                    Player ${index + 1}
                </label>
                <div class="player-input__group">
                    <input
                        type="text"
                        id="player-${index}"
                        class="player-input__field"
                        value="${name}"
                        placeholder="Enter player name"
                        maxlength="50"
                        data-index="${index}"
                    />
                    ${canRemove ? `
                        <button
                            class="player-input__remove"
                            data-index="${index}"
                            aria-label="Remove player ${index + 1}"
                        >
                            ×
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        this.innerHTML = `
            <div class="modal-overlay ${this.isOpen ? 'modal-overlay--visible' : ''}">
                <div class="modal">
                    <div class="modal__header">
                        <h2 class="modal__title">Setup Players</h2>
                        <button class="modal__close" aria-label="Close modal">×</button>
                    </div>

                    <div class="modal__content">
                        <div class="player-inputs">
                            ${playersHTML}
                        </div>

                        <div class="player-setup__actions">
                            ${canAddMore ? `
                                <button class="btn btn--secondary player-setup__add">
                                    + Add Player
                                </button>
                            ` : ''}
                            <button class="btn btn--primary player-setup__start">
                                Start Game
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private attachEventListeners() {
        // Close button
        const closeBtn = this.querySelector('.modal__close');
        closeBtn?.addEventListener('click', () => this.close());

        // Overlay click
        const overlay = this.querySelector('.modal-overlay');
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        // Input changes
        const inputs = this.querySelectorAll('.player-input__field');
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                this.playerNames[index] = target.value;
            });
        });

        // Remove player buttons
        const removeBtns = this.querySelectorAll('.player-input__remove');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt((e.target as HTMLButtonElement).getAttribute('data-index') || '0');
                this.removePlayer(index);
            });
        });

        // Add player button
        const addBtn = this.querySelector('.player-setup__add');
        addBtn?.addEventListener('click', () => this.addPlayer());

        // Start game button
        const startBtn = this.querySelector('.player-setup__start');
        startBtn?.addEventListener('click', () => this.startGame());

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    private addPlayer() {
        if (this.playerNames.length < 4) {
            this.playerNames.push(`Player ${this.playerNames.length + 1}`);
            this.render();
            this.attachEventListeners();
        }
    }

    private removePlayer(index: number) {
        if (this.playerNames.length > 1) {
            this.playerNames.splice(index, 1);
            this.render();
            this.attachEventListeners();
        }
    }

    private startGame() {
        // Validate: at least one player with non-empty name
        const validNames = this.playerNames.filter(name => name.trim().length > 0);

        if (validNames.length === 0) {
            alert('Please enter at least one player name');
            return;
        }

        // Create Player objects
        const players: Player[] = validNames.map((name, index) => ({
            id: uuidv4(),
            name: name.trim(),
            score: 0,
            isActive: index === 0,
            totalFlips: 0,
            matches: 0,
        }));

        // Emit event
        const event = new CustomEvent('playersconfigured', {
            detail: { players },
            bubbles: true,
            composed: true,
        });

        this.dispatchEvent(event);
        this.close();
    }

    // Public methods
    public open() {
        this.isOpen = true;
        this.render();
        this.attachEventListeners();
        document.body.style.overflow = 'hidden';
    }

    public close() {
        this.isOpen = false;
        this.render();
        document.body.style.overflow = '';
    }
}

// Register custom element
if (!customElements.get('player-setup')) {
    customElements.define('player-setup', PlayerSetup);
}

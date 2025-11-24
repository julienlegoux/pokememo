import { Difficulty } from '../lib/type';

/**
 * DifficultySelector Web Component
 * Modal for choosing game difficulty
 *
 * Usage:
 *   const selector = document.createElement('difficulty-selector');
 *   selector.addEventListener('difficultyselected', (e) => {
 *     console.log(e.detail.difficulty);
 *   });
 *   selector.open();
 */
export class DifficultySelector extends HTMLElement {
    private isOpen: boolean = false;

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    private render() {
        this.className = 'difficulty-selector';

        this.innerHTML = `
            <div class="modal-overlay ${this.isOpen ? 'modal-overlay--visible' : ''}">
                <div class="modal">
                    <div class="modal__header">
                        <h2 class="modal__title">Choose Difficulty</h2>
                        <button class="modal__close" aria-label="Close modal">×</button>
                    </div>

                    <div class="modal__content">
                        <div class="difficulty-options">
                            <button class="difficulty-option difficulty-option--easy" data-difficulty="easy">
                                <div class="difficulty-option__icon">🌱</div>
                                <h3 class="difficulty-option__title">Easy</h3>
                                <p class="difficulty-option__description">4×2 grid • 8 cards • 4 Pokemon</p>
                            </button>

                            <button class="difficulty-option difficulty-option--medium" data-difficulty="medium">
                                <div class="difficulty-option__icon">🔥</div>
                                <h3 class="difficulty-option__title">Medium</h3>
                                <p class="difficulty-option__description">4×4 grid • 16 cards • 8 Pokemon</p>
                            </button>

                            <button class="difficulty-option difficulty-option--hard" data-difficulty="hard">
                                <div class="difficulty-option__icon">⚡</div>
                                <h3 class="difficulty-option__title">Hard</h3>
                                <p class="difficulty-option__description">6×4 grid • 24 cards • 12 Pokemon</p>
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

        // Overlay click (close on backdrop click)
        const overlay = this.querySelector('.modal-overlay');
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        // Difficulty buttons
        const difficultyBtns = this.querySelectorAll('.difficulty-option');
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.getAttribute('data-difficulty') as Difficulty;
                this.selectDifficulty(difficulty);
            });
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    private selectDifficulty(difficulty: Difficulty) {
        // Emit custom event
        const event = new CustomEvent('difficultyselected', {
            detail: { difficulty },
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
if (!customElements.get('difficulty-selector')) {
    customElements.define('difficulty-selector', DifficultySelector);
}

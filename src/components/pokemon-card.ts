import type { Card } from '../lib/type';

/**
 * PokemonCard Web Component
 * Represents a single memory card with flip animation
 *
 * Usage:
 *   const card = document.createElement('pokemon-card');
 *   card.setAttribute('card-data', JSON.stringify(cardObj));
 *   card.setAttribute('disabled', 'false');
 *   card.addEventListener('cardflip', (e) => console.log(e.detail.cardId));
 */
export class PokemonCard extends HTMLElement {
    private card: Card | null = null;
    private disabled: boolean = false;

    // Observed attributes for reactivity
    static get observedAttributes() {
        return ['card-data', 'disabled'];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === 'card-data' && newValue) {
            try {
                this.card = JSON.parse(newValue);
                this.render();
            } catch (e) {
                console.error('Invalid card data:', e);
            }
        }

        if (name === 'disabled') {
            this.disabled = newValue === 'true';
            this.render();
        }
    }

    private render() {
        if (!this.card) {
            this.innerHTML = '';
            return;
        }

        const isFlipped = this.card.isFlipped;
        const isMatched = this.card.isMatched;
        const isDisabled = this.disabled || isMatched;

        // BEM class names
        const cardClass = [
            'pokemon-card',
            isFlipped ? 'pokemon-card--flipped' : '',
            isMatched ? 'pokemon-card--matched' : '',
            isDisabled ? 'pokemon-card--disabled' : '',
        ].filter(Boolean).join(' ');

        this.className = cardClass;

        this.innerHTML = `
            <div class="pokemon-card__inner">
                <div class="pokemon-card__front">
                    <img
                        src="${this.card.image}"
                        alt="Pokemon ${this.card.pokemonId}"
                        class="pokemon-card__image"
                        loading="lazy"
                    />
                </div>
                <div class="pokemon-card__back">
                    <div class="pokemon-card__pokeball">
                        <!-- Pokeball SVG -->
                        <svg viewBox="0 0 100 100" class="pokemon-card__pokeball-svg">
                            <circle cx="50" cy="50" r="48" fill="#f2f2f2" stroke="#333" stroke-width="2"/>
                            <circle cx="50" cy="50" r="12" fill="#333" stroke="#fff" stroke-width="3"/>
                            <line x1="10" y1="50" x2="38" y2="50" stroke="#333" stroke-width="2"/>
                            <line x1="62" y1="50" x2="90" y2="50" stroke="#333" stroke-width="2"/>
                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="#e74c3c" stroke="#333" stroke-width="2"/>
                            <path d="M 10 50 A 40 40 0 0 0 90 50" fill="#fff" stroke="#333" stroke-width="2"/>
                        </svg>
                    </div>
                </div>
            </div>
        `;
    }

    private attachEventListeners() {
        this.addEventListener('click', this.handleClick.bind(this));
    }

    private handleClick() {
        if (!this.card || this.disabled || this.card.isMatched || this.card.isFlipped) {
            return;
        }

        // Emit custom event with card ID
        const event = new CustomEvent('cardflip', {
            detail: { cardId: this.card.id },
            bubbles: true,
            composed: true, // Allows event to pass through shadow DOM boundaries if needed
        });

        this.dispatchEvent(event);
    }

    // Public method to update card state
    public updateCard(card: Card) {
        this.card = card;
        this.render();
    }
}

// Register custom element
if (!customElements.get('pokemon-card')) {
    customElements.define('pokemon-card', PokemonCard);
}

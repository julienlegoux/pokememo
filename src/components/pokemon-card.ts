import type { Card } from '../lib/type';

export class PokemonCard extends HTMLElement {
    private card: Card | null = null;
    private disabled: boolean = false;
    private listenerAttached: boolean = false;
    private renderedCardId: number | null = null; // Track rendered ID

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
            this.renderedCardId = null;
            return;
        }

        const isFlipped = this.card.isFlipped;
        const isMatched = this.card.isMatched;
        const isDisabled = this.disabled || isMatched;

        // Apply classes for animation (this triggers the CSS transition)
        this.classList.toggle('pokemon-card--flipped', !!isFlipped);
        this.classList.toggle('pokemon-card--matched', !!isMatched);
        this.classList.toggle('pokemon-card--disabled', !!isDisabled);

        // Ensure base class exists
        if (!this.classList.contains('pokemon-card')) {
            this.classList.add('pokemon-card');
        }

        // Only rebuild DOM if the card identity matches changed (e.g. new game)
        // This PRESERVES the .pokemon-card__inner element during flips
        if (this.renderedCardId !== this.card.id) {
            this.renderedCardId = this.card.id;

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
    }

    private attachEventListeners() {
        if (!this.listenerAttached) {
            this.addEventListener('click', this.handleClick.bind(this));
            this.listenerAttached = true;
        }
    }

    private handleClick() {
        if (!this.card || this.disabled || this.card.isMatched || this.card.isFlipped) {
            return;
        }

        const event = new CustomEvent('cardflip', {
            detail: { cardId: this.card.id },
            bubbles: true,
            composed: true,
        });

        this.dispatchEvent(event);
    }
}

if (!customElements.get('pokemon-card')) {
    customElements.define('pokemon-card', PokemonCard);
}
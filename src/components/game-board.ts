import type { Card, Difficulty } from '../lib/type';
import { PokemonCard } from './pokemon-card';

/**
 * GameBoard Web Component
 * Grid container for memory cards with responsive layout
 * Renders cards and manages event bubbling to parent
 *
 * Usage:
 *   const board = document.createElement('game-board');
 *   board.setAttribute('cards-data', JSON.stringify(cardsArray));
 *   board.setAttribute('difficulty', 'medium');
 *   board.addEventListener('cardflip', (e) => console.log(e.detail.cardId));
 */
export class GameBoard extends HTMLElement {
    private cards: Card[] = [];
    private difficulty: Difficulty = 'medium' as Difficulty;

    static get observedAttributes() {
        return ['cards-data', 'difficulty'];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === 'cards-data' && newValue) {
            try {
                this.cards = JSON.parse(newValue);
                this.render();
            } catch (e) {
                console.error('Invalid cards data:', e);
            }
        }

        if (name === 'difficulty' && newValue) {
            this.difficulty = newValue as Difficulty;
            this.render();
        }
    }

    private render() {
        // Apply BEM class for difficulty-specific grid
        const boardClass = [
            'game-board',
            `game-board--${this.difficulty}`,
        ].join(' ');

        this.className = boardClass;

        // Clear existing cards
        this.innerHTML = '';

        // Create card elements
        this.cards.forEach((card) => {
            const cardElement = document.createElement('pokemon-card') as PokemonCard;
            cardElement.setAttribute('card-data', JSON.stringify(card));
            cardElement.setAttribute('disabled', 'false');
            this.appendChild(cardElement);
        });
    }

    private attachEventListeners() {
        // Listen for card flip events from children and bubble them up
        this.addEventListener('cardflip', this.handleCardFlip.bind(this));
    }

    private handleCardFlip(event: Event) {
        const customEvent = event as CustomEvent;

        // Re-emit event to parent (main.ts will listen)
        const bubbledEvent = new CustomEvent('cardflip', {
            detail: customEvent.detail,
            bubbles: true,
            composed: true,
        });

        this.dispatchEvent(bubbledEvent);
    }

    // Public method to update cards
    public updateCards(cards: Card[]) {
        this.cards = cards;
        this.render();
    }

    // Public method to update single card state
    public updateCard(cardId: number, updates: Partial<Card>) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;

        Object.assign(card, updates);

        // Find and update the specific card element
        const cardElements = this.querySelectorAll('pokemon-card');
        cardElements.forEach((element) => {
            const cardElement = element as PokemonCard;
            const cardData = JSON.parse(element.getAttribute('card-data') || '{}');

            if (cardData.id === cardId) {
                cardElement.setAttribute('card-data', JSON.stringify(card));
            }
        });
    }
}

// Register custom element
if (!customElements.get('game-board')) {
    customElements.define('game-board', GameBoard);
}

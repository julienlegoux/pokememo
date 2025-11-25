import type { Card, Difficulty } from '../lib/type';
import { PokemonCard } from './pokemon-card';

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
                const newCards = JSON.parse(newValue);
                // Full re-render only if card count changes (new game)
                if (newCards.length !== this.cards.length) {
                    this.cards = newCards;
                    this.render();
                } else {
                    // Otherwise just update data
                    this.cards = newCards;
                    this.updateCardsInPlace();
                }
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
        const boardClass = [
            'game-board',
            `game-board--${this.difficulty}`,
        ].join(' ');

        this.className = boardClass;
        this.innerHTML = '';

        this.cards.forEach((card) => {
            const cardElement = document.createElement('pokemon-card') as PokemonCard;
            // IMPORTANT: Set data-id for fast lookup
            cardElement.dataset.id = card.id.toString();
            cardElement.setAttribute('card-data', JSON.stringify(card));
            cardElement.setAttribute('disabled', 'false');
            this.appendChild(cardElement);
        });
    }

    private attachEventListeners() {
        this.addEventListener('cardflip', this.handleCardFlip.bind(this));
    }

    private handleCardFlip(event: Event) {
        const customEvent = event as CustomEvent;
        if (event.target === this) return;
        event.stopPropagation();

        const bubbledEvent = new CustomEvent('cardflip', {
            detail: customEvent.detail,
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(bubbledEvent);
    }

    private updateCardsInPlace() {
        const cardElements = this.querySelectorAll('pokemon-card');
        this.cards.forEach((card, index) => {
            const cardElement = cardElements[index] as PokemonCard;
            if (cardElement) {
                // Only update if state actually changed to avoid DOM thrashing
                const currentData = cardElement.getAttribute('card-data');
                const newData = JSON.stringify(card);
                if (currentData !== newData) {
                    cardElement.setAttribute('card-data', newData);
                }
            }
        });
    }

    public updateCards(cards: Card[]) {
        if (cards.length !== this.cards.length) {
            this.cards = cards;
            this.render();
        } else {
            this.cards = cards;
            this.updateCardsInPlace();
        }
    }

    public updateCard(cardId: number, updates: Partial<Card>) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;

        Object.assign(card, updates);

        // FAST UPDATE: Use dataset lookup instead of parsing JSON
        const cardElement = this.querySelector(`pokemon-card[data-id="${cardId}"]`);
        if (cardElement) {
            cardElement.setAttribute('card-data', JSON.stringify(card));
        }
    }
}

if (!customElements.get('game-board')) {
    customElements.define('game-board', GameBoard);
}
import type { PokemonGeneration } from '../lib/type';

/**
 * ThemeSelector Web Component
 * Dropdown for selecting Pokemon generation (Gen 1-3)
 *
 * Usage:
 *   const selector = document.createElement('theme-selector');
 *   selector.addEventListener('themeselected', (e) => {
 *     console.log(e.detail.generation);
 *   });
 */
export class ThemeSelector extends HTMLElement {
    private selectedGeneration: PokemonGeneration = 1;

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    private render() {
        this.className = 'theme-selector';

        this.innerHTML = `
            <div class="theme-selector__container">
                <label class="theme-selector__label" for="generation-select">
                    Pokemon Generation
                </label>
                <select
                    id="generation-select"
                    class="theme-selector__select"
                >
                    <option value="1" ${this.selectedGeneration === 1 ? 'selected' : ''}>
                        Gen 1 - Kanto (Bulbasaur - Mew)
                    </option>
                    <option value="2" ${this.selectedGeneration === 2 ? 'selected' : ''}>
                        Gen 2 - Johto (Chikorita - Celebi)
                    </option>
                    <option value="3" ${this.selectedGeneration === 3 ? 'selected' : ''}>
                        Gen 3 - Hoenn (Treecko - Deoxys)
                    </option>
                </select>
            </div>
        `;
    }

    private attachEventListeners() {
        const select = this.querySelector('.theme-selector__select') as HTMLSelectElement;

        select?.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            this.selectedGeneration = parseInt(target.value, 10) as PokemonGeneration;

            // Emit custom event
            const event = new CustomEvent('themeselected', {
                detail: { generation: this.selectedGeneration },
                bubbles: true,
                composed: true,
            });

            this.dispatchEvent(event);
        });
    }

    // Public method to set generation
    public setGeneration(generation: PokemonGeneration) {
        this.selectedGeneration = generation;
        this.render();
        this.attachEventListeners();
    }

    // Public method to get current generation
    public getGeneration(): PokemonGeneration {
        return this.selectedGeneration;
    }
}

// Register custom element
if (!customElements.get('theme-selector')) {
    customElements.define('theme-selector', ThemeSelector);
}

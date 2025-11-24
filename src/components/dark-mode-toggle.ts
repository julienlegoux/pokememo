/**
 * DarkModeToggle Web Component
 * Button to switch between light/dark themes
 * Saves preference to localStorage
 *
 * Usage:
 *   const toggle = document.createElement('dark-mode-toggle');
 *   toggle.addEventListener('themechanged', (e) => {
 *     console.log(e.detail.isDark);
 *   });
 */
export class DarkModeToggle extends HTMLElement {
    private isDark: boolean = false;
    private readonly STORAGE_KEY = 'pokememo_theme';

    constructor() {
        super();
    }

    connectedCallback() {
        this.loadTheme();
        this.render();
        this.attachEventListeners();
        this.applyTheme();
    }

    private loadTheme() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        if (savedTheme === 'dark') {
            this.isDark = true;
        } else if (savedTheme === 'light') {
            this.isDark = false;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.isDark = prefersDark;
        }
    }

    private saveTheme() {
        localStorage.setItem(this.STORAGE_KEY, this.isDark ? 'dark' : 'light');
    }

    private applyTheme() {
        if (this.isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    private render() {
        this.className = 'dark-mode-toggle';

        const icon = this.isDark
            ? `<svg viewBox="0 0 24 24" fill="currentColor" class="dark-mode-toggle__icon">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
               </svg>`
            : `<svg viewBox="0 0 24 24" fill="currentColor" class="dark-mode-toggle__icon">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
               </svg>`;

        this.innerHTML = `
            <button class="dark-mode-toggle__button" aria-label="Toggle dark mode">
                ${icon}
            </button>
        `;
    }

    private attachEventListeners() {
        const button = this.querySelector('.dark-mode-toggle__button');
        button?.addEventListener('click', () => this.toggle());
    }

    private toggle() {
        this.isDark = !this.isDark;
        this.saveTheme();
        this.applyTheme();
        this.render();
        this.attachEventListeners();

        // Emit custom event
        const event = new CustomEvent('themechanged', {
            detail: { isDark: this.isDark },
            bubbles: true,
            composed: true,
        });

        this.dispatchEvent(event);
    }

    // Public method to set theme
    public setTheme(isDark: boolean) {
        this.isDark = isDark;
        this.saveTheme();
        this.applyTheme();
        this.render();
        this.attachEventListeners();
    }
}

// Register custom element
if (!customElements.get('dark-mode-toggle')) {
    customElements.define('dark-mode-toggle', DarkModeToggle);
}

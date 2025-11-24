/**
 * TimerDisplay Web Component
 * Shows countdown timer in MM:SS format
 * Warning state when < 10 seconds
 *
 * Usage:
 *   const timer = document.createElement('timer-display');
 *   timer.setAttribute('time', '30');
 */
export class TimerDisplay extends HTMLElement {
    private timeRemaining: number = 30;

    static get observedAttributes() {
        return ['time'];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === 'time') {
            this.timeRemaining = parseInt(newValue, 10) || 0;
            this.render();
        }
    }

    private render() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const isWarning = this.timeRemaining < 10;

        const timerClass = [
            'timer-display',
            isWarning ? 'timer-display--warning' : '',
        ].filter(Boolean).join(' ');

        this.className = timerClass;

        this.innerHTML = `
            <div class="timer-display__container">
                <svg class="timer-display__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke-width="2"/>
                    <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span class="timer-display__time">${formattedTime}</span>
            </div>
        `;
    }

    // Public method to update time
    public updateTime(seconds: number) {
        this.timeRemaining = seconds;
        this.render();
    }
}

// Register custom element
if (!customElements.get('timer-display')) {
    customElements.define('timer-display', TimerDisplay);
}

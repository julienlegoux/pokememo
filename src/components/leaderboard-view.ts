import type { LeaderboardEntry } from '../lib/type';

/**
 * LeaderboardView Web Component
 * Displays top 10 scores (data passed as prop)
 *
 * Usage:
 *   const leaderboard = document.createElement('leaderboard-view');
 *   leaderboard.setAttribute('entries-data', JSON.stringify(entriesArray));
 *   leaderboard.setAttribute('loading', 'false');
 */
export class LeaderboardView extends HTMLElement {
    private entries: LeaderboardEntry[] = [];
    private loading: boolean = false;

    static get observedAttributes() {
        return ['entries-data', 'loading'];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === 'entries-data' && newValue) {
            try {
                this.entries = JSON.parse(newValue);
                this.render();
            } catch (e) {
                console.error('Invalid entries data:', e);
            }
        }

        if (name === 'loading') {
            this.loading = newValue === 'true';
            this.render();
        }
    }

    private render() {
        this.className = 'leaderboard-view';

        if (this.loading) {
            this.innerHTML = this.renderLoading();
            return;
        }

        if (this.entries.length === 0) {
            this.innerHTML = this.renderEmpty();
            return;
        }

        this.innerHTML = this.renderEntries();
    }

    private renderLoading(): string {
        const skeletons = Array.from({ length: 5 }, (_) => `
            <div class="leaderboard__skeleton-row">
                <div class="leaderboard__skeleton-rank"></div>
                <div class="leaderboard__skeleton-name"></div>
                <div class="leaderboard__skeleton-score"></div>
                <div class="leaderboard__skeleton-difficulty"></div>
            </div>
        `).join('');

        return `
            <div class="leaderboard__container">
                <h2 class="leaderboard__title">Top 10 Scores</h2>
                <div class="leaderboard__list">
                    ${skeletons}
                </div>
            </div>
        `;
    }

    private renderEmpty(): string {
        return `
            <div class="leaderboard__container">
                <h2 class="leaderboard__title">Top 10 Scores</h2>
                <div class="leaderboard__empty">
                    <div class="leaderboard__empty-icon">🏆</div>
                    <p class="leaderboard__empty-text">No scores yet!</p>
                    <p class="leaderboard__empty-subtext">Be the first to complete a game.</p>
                </div>
            </div>
        `;
    }

    private renderEntries(): string {
        const entriesHTML = this.entries.map((entry, index) => {
            const rank = index + 1;
            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });

            const difficultyClass = `leaderboard__difficulty--${entry.difficulty}`;

            return `
                <div class="leaderboard__row">
                    <div class="leaderboard__rank ${rank <= 3 ? `leaderboard__rank--top${rank}` : ''}">
                        ${rank <= 3 ? this.getRankEmoji(rank) : rank}
                    </div>
                    <div class="leaderboard__player">
                        <span class="leaderboard__player-name">${entry.playerName}</span>
                        <span class="leaderboard__player-date">${formattedDate}</span>
                    </div>
                    <div class="leaderboard__score">${entry.score}</div>
                    <div class="leaderboard__difficulty ${difficultyClass}">
                        ${entry.difficulty}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="leaderboard__container">
                <h2 class="leaderboard__title">Top 10 Scores</h2>
                <div class="leaderboard__list">
                    ${entriesHTML}
                </div>
            </div>
        `;
    }

    private getRankEmoji(rank: number): string {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return rank.toString();
        }
    }

    // Public method to update entries
    public updateEntries(entries: LeaderboardEntry[]) {
        this.entries = entries;
        this.loading = false;
        this.render();
    }

    // Public method to set loading state
    public setLoading(loading: boolean) {
        this.loading = loading;
        this.render();
    }
}

// Register custom element
if (!customElements.get('leaderboard-view')) {
    customElements.define('leaderboard-view', LeaderboardView);
}

const STORAGE_KEY = 'terraform_campaign_v1';

const JOBS = [
    { id: 1, title: 'Clear the Highway', objective: 'Clear the rubble from the highway and load it into the blue truck.', loads: 3, timeLimit: 150, reward: 150, tip: 'Scoop dirt and dump it into the truck.' },
    { id: 2, title: 'Bridge Approach', objective: 'Clear the debris blocking the bridge approach.', loads: 3, timeLimit: 140, reward: 180, tip: 'Keep the bucket low while driving.' },
    { id: 3, title: 'Park Foundation', objective: 'Haul away the soil from the park foundation site.', loads: 3, timeLimit: 130, reward: 220, tip: 'Plan your path to save time.' },
    { id: 4, title: 'Harbor Cleanup', objective: 'Remove the mud piled up near the harbor.', loads: 3, timeLimit: 120, reward: 260, tip: 'Use the camera to line up your dumps.' },
    { id: 5, title: 'Rush Hour', objective: 'Clear the road quickly before traffic returns.', loads: 3, timeLimit: 110, reward: 300, tip: 'Smooth driving beats fast cornering.' },
    { id: 6, title: 'Grand Finale', objective: 'Finish the last cleanup and load the final truck.', loads: 3, timeLimit: 100, reward: 400, tip: 'Stay calm and beat the clock.' }
];

export default class Campaign {
    constructor() {
        this._state = { index: 0, completed: 0, bestStars: {}, lastDaily: '', streak: 0 };
        this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && typeof data === 'object') {
                    this._state.index = typeof data.index === 'number' ? data.index : 0;
                    this._state.completed = typeof data.completed === 'number' ? data.completed : 0;
                    this._state.bestStars = data.bestStars && typeof data.bestStars === 'object' ? data.bestStars : {};
                    this._state.lastDaily = typeof data.lastDaily === 'string' ? data.lastDaily : '';
                    this._state.streak = typeof data.streak === 'number' ? data.streak : 0;
                }
            }
        } catch (e) {}
        this._clampIndex();
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
        } catch (e) {}
    }

    _clampIndex() {
        if (this._state.index < 0) this._state.index = 0;
        if (this._state.index > JOBS.length - 1) this._state.index = JOBS.length - 1;
    }

    _today() {
        try {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return y + '-' + m + '-' + day;
        } catch (e) {
            return '';
        }
    }

    _yesterday() {
        try {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return y + '-' + m + '-' + day;
        } catch (e) {
            return '';
        }
    }

    current() {
        this._clampIndex();
        return JOBS[this._state.index];
    }

    get number() {
        this._clampIndex();
        return this._state.index + 1;
    }

    total() {
        return JOBS.length;
    }

    completeJob(stars) {
        this._clampIndex();
        let s = Math.floor(Number(stars));
        if (!isFinite(s)) s = 1;
        if (s < 1) s = 1;
        if (s > 3) s = 3;

        const job = JOBS[this._state.index];
        const reward = job.reward;
        const starBonus = 25 * (s - 1);
        const total = reward + starBonus;

        const key = String(job.id);
        const prevBest = typeof this._state.bestStars[key] === 'number' ? this._state.bestStars[key] : 0;
        if (s > prevBest) this._state.bestStars[key] = s;

        let finished = false;
        if (this._state.index >= JOBS.length - 1) {
            finished = true;
            this._state.completed = JOBS.length;
        } else {
            this._state.index += 1;
            this._state.completed = this._state.index;
        }
        this._clampIndex();
        this._save();

        return { reward, starBonus, total, finished };
    }

    reset() {
        this._state.index = 0;
        this._state.completed = 0;
        this._state.bestStars = {};
        this._state.lastDaily = '';
        this._state.streak = 0;
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    peekDaily() {
        const today = this._today();
        if (!today) return false;
        return this._state.lastDaily !== today;
    }

    claimDaily() {
        const today = this._today();
        if (!today) return null;
        if (this._state.lastDaily === today) return null;

        const yesterday = this._yesterday();
        if (yesterday && this._state.lastDaily === yesterday) {
            this._state.streak = this._state.streak + 1;
        } else {
            this._state.streak = 1;
        }
        this._state.lastDaily = today;
        const streak = this._state.streak;
        const amount = 50 * Math.min(streak, 7);
        this._save();
        return { amount, streak };
    }
}

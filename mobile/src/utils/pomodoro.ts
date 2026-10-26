import { dayKey } from './studyProgress';

// Pure Pomodoro state machine. No timers or storage here: the study progress context
// calls these with Date.now() so the maths can be tested on its own.
//
// Study time rule: every millisecond spent in a RUNNING STUDY phase is credited to the
// local day it happened on (split at midnight). Paused time and break time are never
// credited. A Pomodoro counts as "completed" only when a study phase runs to its end.

export type Phase = 'idle' | 'study' | 'break';
export type BreakKind = 'short' | 'long' | 'custom';

export interface PomodoroSettings {
    studyMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakEvery: number; // a long break after every N completed study sessions
    askBeforeBreak: boolean; // false = start the break automatically
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
    studyMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakEvery: 4,
    askBeforeBreak: true,
};

export const SETTING_LIMITS = {
    studyMinutes: [5, 120],
    shortBreakMinutes: [1, 30],
    longBreakMinutes: [5, 60],
    longBreakEvery: [2, 8],
} as const;

export interface TimerState {
    phase: Phase;
    paused: boolean;
    sessionId: string | null; // unique per phase; guards against counting a session twice
    phaseMs: number; // full length of the current phase
    endsAt: number | null; // wall-clock end while running
    remainingMs: number | null; // frozen remainder while paused
    creditedUntil: number | null; // study time is credited up to here (running study only)
    breakKind: BreakKind | null;
    cycle: number; // completed study sessions since the last long break
    pendingBreak: { sessionId: string; suggested: Exclude<BreakKind, 'custom'> } | null;
    lastCompletedId: string | null;
}

export const IDLE_TIMER: TimerState = {
    phase: 'idle',
    paused: false,
    sessionId: null,
    phaseMs: 0,
    endsAt: null,
    remainingMs: null,
    creditedUntil: null,
    breakKind: null,
    cycle: 0,
    pendingBreak: null,
    lastCompletedId: null,
};

export interface Ledger {
    days: Record<string, number>; // study ms per local day
    sessions: Record<string, number>; // completed Pomodoros per local day
}

export type TimerEvent = 'studyCompleted' | 'breakCompleted' | 'breakStarted';

const newId = (now: number) => `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function clampSettings(input: Partial<PomodoroSettings>, base: PomodoroSettings = DEFAULT_SETTINGS): PomodoroSettings {
    const out = { ...base };
    (Object.keys(SETTING_LIMITS) as (keyof typeof SETTING_LIMITS)[]).forEach((k) => {
        const v = input[k];
        if (typeof v === 'number' && Number.isFinite(v)) {
            const [min, max] = SETTING_LIMITS[k];
            out[k] = Math.round(Math.min(max, Math.max(min, v)));
        }
    });
    if (typeof input.askBeforeBreak === 'boolean') out.askBeforeBreak = input.askBeforeBreak;
    return out;
}

// Add [from, to) to the per-day totals, split at local midnight
export function creditTime(days: Record<string, number>, from: number, to: number): Record<string, number> {
    if (to <= from) return days;
    const next = { ...days };
    let cursor = from;
    while (cursor < to) {
        const date = new Date(cursor);
        const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
        const end = Math.min(to, midnight);
        const key = dayKey(date);
        next[key] = (next[key] || 0) + end - cursor;
        cursor = end;
    }
    return next;
}

// Bring the timer up to `now`: credit study time, and finish phases whose end has passed.
// Safe to call any number of times (each millisecond is credited once).
export function advance(
    timer: TimerState,
    ledger: Ledger,
    now: number,
    settings: PomodoroSettings
): { timer: TimerState; ledger: Ledger; events: TimerEvent[] } {
    const events: TimerEvent[] = [];
    let t = timer;
    let l = ledger;

    if (t.phase === 'study' && !t.paused && t.endsAt !== null && t.creditedUntil !== null) {
        const endsAt = t.endsAt;
        const until = Math.min(now, endsAt);
        l = { ...l, days: creditTime(l.days, t.creditedUntil, until) };
        t = { ...t, creditedUntil: until };

        if (now >= endsAt && t.sessionId && t.lastCompletedId !== t.sessionId) {
            const key = dayKey(new Date(endsAt - 1));
            l = { ...l, sessions: { ...l.sessions, [key]: (l.sessions[key] || 0) + 1 } };
            const cycle = t.cycle + 1;
            const suggested = cycle >= settings.longBreakEvery ? 'long' : 'short';
            const finishedId = t.sessionId;
            events.push('studyCompleted');
            t = { ...IDLE_TIMER, cycle, lastCompletedId: finishedId, pendingBreak: { sessionId: finishedId, suggested } };
            if (!settings.askBeforeBreak) {
                // Automatic flow: go straight into the suggested break, starting when the study phase ended
                const started = startBreak(t, settings, suggested, endsAt);
                t = advance(started, l, now, settings).timer;
                events.push('breakStarted');
                if (t.phase === 'idle') events.push('breakCompleted');
            }
        }
    } else if (t.phase === 'break' && !t.paused && t.endsAt !== null && now >= t.endsAt) {
        events.push('breakCompleted');
        t = { ...IDLE_TIMER, cycle: t.cycle, lastCompletedId: t.lastCompletedId };
    }

    return { timer: t, ledger: l, events };
}

export function startStudy(timer: TimerState, settings: PomodoroSettings, now: number): TimerState {
    if (timer.phase !== 'idle') return timer;
    const phaseMs = settings.studyMinutes * 60000;
    return {
        ...IDLE_TIMER,
        cycle: timer.cycle,
        lastCompletedId: timer.lastCompletedId,
        phase: 'study',
        sessionId: newId(now),
        phaseMs,
        endsAt: now + phaseMs,
        creditedUntil: now,
    };
}

export function startBreak(
    timer: TimerState,
    settings: PomodoroSettings,
    kind: BreakKind,
    now: number,
    customMinutes?: number
): TimerState {
    if (timer.phase !== 'idle' || !timer.pendingBreak) return timer;
    const minutes =
        kind === 'long' ? settings.longBreakMinutes
            : kind === 'short' ? settings.shortBreakMinutes
                : Math.round(Math.min(60, Math.max(1, customMinutes || settings.shortBreakMinutes)));
    const phaseMs = minutes * 60000;
    return {
        ...IDLE_TIMER,
        // A long break resets the cycle
        cycle: kind === 'long' ? 0 : timer.cycle,
        lastCompletedId: timer.lastCompletedId,
        phase: 'break',
        breakKind: kind,
        sessionId: newId(now),
        phaseMs,
        endsAt: now + phaseMs,
    };
}

// Take a short break straight from "ready to focus" (no study session needed first).
// Break time is never credited, and the session cycle is left unchanged.
export function startBreakNow(timer: TimerState, settings: PomodoroSettings, now: number): TimerState {
    if (timer.phase !== 'idle') return timer;
    const phaseMs = settings.shortBreakMinutes * 60000;
    return {
        ...IDLE_TIMER,
        cycle: timer.cycle,
        lastCompletedId: timer.lastCompletedId,
        phase: 'break',
        breakKind: 'short',
        sessionId: newId(now),
        phaseMs,
        endsAt: now + phaseMs,
    };
}

export function skipBreak(timer: TimerState): TimerState {
    if (!timer.pendingBreak) return timer;
    return { ...timer, pendingBreak: null };
}

export function pause(timer: TimerState, now: number): TimerState {
    if (timer.phase === 'idle' || timer.paused || timer.endsAt === null) return timer;
    return { ...timer, paused: true, remainingMs: Math.max(0, timer.endsAt - now), endsAt: null, creditedUntil: null };
}

export function resume(timer: TimerState, now: number): TimerState {
    if (timer.phase === 'idle' || !timer.paused || timer.remainingMs === null) return timer;
    return {
        ...timer,
        paused: false,
        endsAt: now + timer.remainingMs,
        remainingMs: null,
        creditedUntil: timer.phase === 'study' ? now : null,
    };
}

// Stop the current phase early. Study time already credited stays (it was really studied),
// but the session does not count as a completed Pomodoro.
export function reset(timer: TimerState): TimerState {
    return { ...IDLE_TIMER, cycle: timer.cycle, lastCompletedId: timer.lastCompletedId };
}

export function remainingMs(timer: TimerState, now: number): number {
    if (timer.phase === 'idle') return 0;
    if (timer.paused) return timer.remainingMs ?? 0;
    return Math.max(0, (timer.endsAt ?? now) - now);
}

// Validate a timer loaded from storage; anything malformed falls back to idle
export function restoreTimer(raw: any): TimerState {
    if (!raw || typeof raw !== 'object' || !['idle', 'study', 'break'].includes(raw.phase)) return IDLE_TIMER;
    const num = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    const t: TimerState = {
        phase: raw.phase,
        paused: raw.paused === true,
        sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : null,
        phaseMs: num(raw.phaseMs) ?? 0,
        endsAt: num(raw.endsAt),
        remainingMs: num(raw.remainingMs),
        creditedUntil: num(raw.creditedUntil),
        breakKind: ['short', 'long', 'custom'].includes(raw.breakKind) ? raw.breakKind : null,
        cycle: num(raw.cycle) ?? 0,
        pendingBreak:
            raw.pendingBreak && typeof raw.pendingBreak.sessionId === 'string' && ['short', 'long'].includes(raw.pendingBreak.suggested)
                ? { sessionId: raw.pendingBreak.sessionId, suggested: raw.pendingBreak.suggested }
                : null,
        lastCompletedId: typeof raw.lastCompletedId === 'string' ? raw.lastCompletedId : null,
    };
    if (t.phase !== 'idle') {
        const consistent = t.sessionId && t.phaseMs > 0 && (t.paused ? t.remainingMs !== null : t.endsAt !== null);
        if (!consistent || (t.phase === 'study' && !t.paused && t.creditedUntil === null)) {
            return { ...IDLE_TIMER, cycle: t.cycle, lastCompletedId: t.lastCompletedId };
        }
    }
    return t;
}

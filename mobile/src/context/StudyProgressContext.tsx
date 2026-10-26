import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { dayKey, weeklyMilliseconds } from '../utils/studyProgress';
import {
    advance,
    BreakKind,
    clampSettings,
    DEFAULT_SETTINGS,
    IDLE_TIMER,
    pause as pauseTimer,
    PomodoroSettings,
    remainingMs,
    reset as resetTimer,
    restoreTimer,
    resume as resumeTimer,
    skipBreak as skipBreakTimer,
    startBreak,
    startBreakNow,
    startStudy,
    TimerState,
} from '../utils/pomodoro';

// days: study milliseconds per local day ("YYYY-MM-DD"); sessions: completed Pomodoros per day.
// timer: the Pomodoro, persisted so it survives tab changes, reloads and app restarts.
// (Older saves only had days + goalHours; the other fields default when missing.)
type Progress = { days: Record<string, number>; goalHours: number; sessions: Record<string, number>; timer: TimerState };

export type TimerView = {
    phase: TimerState['phase'];
    paused: boolean;
    breakKind: TimerState['breakKind'];
    remainingMs: number;
    phaseMs: number;
    cycle: number;
};

type StudyProgress = {
    milliseconds: number;
    days: Record<string, number>;
    sessions: Record<string, number>;
    goalHours: number;
    running: boolean; // a study phase is actively counting
    ready: boolean;
    error: string;
    toggle: () => void; // start / pause / resume, as the old Start-Pause button did
    setGoal: (hours: number) => void;
    // Pomodoro
    timer: TimerView;
    pendingBreak: TimerState['pendingBreak'];
    settings: PomodoroSettings;
    updateSettings: (change: Partial<PomodoroSettings>) => void;
    start: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
    takeBreak: (kind: BreakKind, customMinutes?: number) => void;
    breakNow: () => void; // short break straight from "ready to focus"
    skipBreak: () => void;
    celebrating: boolean; // a study session just finished (drives the Studying Buddy)
};
// Keep enough history for streaks, not just the current week (~25 bytes/day, well inside SecureStore limits)
const HISTORY_DAYS = 60;
const CELEBRATE_MS = 1500;
const Context = createContext<StudyProgress | null>(null);

const readStore = async (key: string) =>
    Platform.OS === 'web' ? globalThis.localStorage.getItem(key) : await SecureStore.getItemAsync(key);
const writeStore = async (key: string, value: string) => {
    if (Platform.OS === 'web') globalThis.localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
};

const validCounts = (raw: any) => {
    const out: Record<string, number> = {};
    if (raw && typeof raw === 'object') {
        for (const [day, value] of Object.entries(raw)) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(day) && typeof value === 'number' && Number.isFinite(value) && value >= 0) out[day] = value;
        }
    }
    return out;
};

export function StudyProgressProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
    const safeId = encodeURIComponent(userId).replace(/%/g, '_');
    const key = `study_progress_${safeId}`;
    const settingsKey = `pomodoro_settings_${safeId}`;
    const data = useRef<Progress>({ days: {}, goalHours: 10, sessions: {}, timer: IDLE_TIMER });
    const settingsRef = useRef<PomodoroSettings>(DEFAULT_SETTINGS);
    const queue = useRef(Promise.resolve());
    const loaded = useRef(false);
    const [, redraw] = useState(0);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [celebrateUntil, setCelebrateUntil] = useState(0);

    const save = () => {
        if (!loaded.current) return; // never overwrite saved data before it has been read
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - HISTORY_DAYS);
        const earliestDay = dayKey(cutoff);
        const keep = (map: Record<string, number>) => Object.fromEntries(Object.entries(map).filter(([day]) => day >= earliestDay));
        data.current.days = keep(data.current.days);
        data.current.sessions = keep(data.current.sessions);
        const value = JSON.stringify(data.current);
        // Writes are queued so an older snapshot can never land after a newer one
        queue.current = queue.current.then(async () => {
            await writeStore(key, value);
            setError('');
        }).catch(() => setError('Progress could not be saved on this device.'));
    };

    const saveSettings = () => {
        const value = JSON.stringify(settingsRef.current);
        queue.current = queue.current.then(() => writeStore(settingsKey, value))
            .catch(() => setError('Timer settings could not be saved on this device.'));
    };

    // Bring the timer and study totals up to now; returns whether anything phase-related happened
    const sync = () => {
        const { timer, ledger, events } = advance(
            data.current.timer,
            { days: data.current.days, sessions: data.current.sessions },
            Date.now(),
            settingsRef.current
        );
        data.current = { ...data.current, timer, days: ledger.days, sessions: ledger.sessions };
        if (events.includes('studyCompleted')) setCelebrateUntil(Date.now() + CELEBRATE_MS);
        return events.length > 0;
    };

    // Apply a timer transition: credit time up to now first, then switch, then save
    const transition = (fn: (timer: TimerState, now: number) => TimerState) => {
        if (!ready) return;
        sync();
        data.current = { ...data.current, timer: fn(data.current.timer, Date.now()) };
        save();
        redraw(n => n + 1);
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [value, settingsValue] = await Promise.all([readStore(key), readStore(settingsKey)]);
                if (value) {
                    const parsed = JSON.parse(value);
                    if (!parsed.days || typeof parsed.days !== 'object' || !Number.isFinite(parsed.goalHours) || parsed.goalHours < 1 || parsed.goalHours > 40) throw new Error('Invalid progress');
                    if (mounted) {
                        data.current = {
                            days: validCounts(parsed.days),
                            goalHours: parsed.goalHours,
                            sessions: validCounts(parsed.sessions),
                            timer: restoreTimer(parsed.timer),
                        };
                    }
                }
                if (settingsValue && mounted) settingsRef.current = clampSettings(JSON.parse(settingsValue));
            } catch {
                if (mounted) setError('Saved progress could not be loaded.');
            } finally {
                if (mounted) {
                    loaded.current = true;
                    // Catch up on time that passed while the app was closed
                    if (sync()) save();
                    setReady(true);
                }
            }
        })();
        let displayedDay = dayKey(new Date());
        let lastSave = Date.now();
        // The only interval: it re-renders the countdown and catches phase ends.
        // Time itself always comes from timestamps, so a throttled or sleeping JS thread can't drift it.
        const interval = setInterval(() => {
            if (!loaded.current) return;
            const changed = sync();
            const active = data.current.timer.phase !== 'idle' && !data.current.timer.paused;
            if (changed || (active && Date.now() - lastSave >= 15000)) {
                save();
                lastSave = Date.now();
            }
            const today = dayKey(new Date());
            if (active || changed || today !== displayedDay) {
                displayedDay = today;
                redraw(n => n + 1);
            }
        }, 1000);
        // The Pomodoro keeps running in the background (it is driven by its end time);
        // on the way out we just record progress so far.
        const subscription = AppState.addEventListener('change', state => {
            if (!loaded.current) return;
            sync();
            if (state !== 'active') save();
            redraw(n => n + 1);
        });
        const onHide = () => {
            if (!loaded.current) return;
            sync();
            save();
        };
        if (Platform.OS === 'web') globalThis.addEventListener('pagehide', onHide);
        return () => {
            mounted = false;
            clearInterval(interval);
            subscription.remove();
            if (Platform.OS === 'web') globalThis.removeEventListener('pagehide', onHide);
            if (loaded.current) { sync(); save(); }
        };
    }, [key, settingsKey]);

    // Clear the celebration after it plays
    useEffect(() => {
        if (!celebrateUntil) return;
        const timeout = setTimeout(() => setCelebrateUntil(0), Math.max(0, celebrateUntil - Date.now()));
        return () => clearTimeout(timeout);
    }, [celebrateUntil]);

    const start = () => transition((t, now) => startStudy(t, settingsRef.current, now));
    const pause = () => transition((t, now) => pauseTimer(t, now));
    const resume = () => transition((t, now) => resumeTimer(t, now));
    const reset = () => transition((t) => resetTimer(t));
    const takeBreak = (kind: BreakKind, customMinutes?: number) =>
        transition((t, now) => startBreak(t, settingsRef.current, kind, now, customMinutes));
    const breakNow = () => transition((t, now) => startBreakNow(t, settingsRef.current, now));
    const skipBreak = () => transition((t) => skipBreakTimer(t));

    // Same single button as before: start when idle, otherwise pause/resume
    const toggle = () => {
        const t = data.current.timer;
        if (t.phase === 'idle') start();
        else if (t.paused) resume();
        else pause();
    };

    const setGoal = (goalHours: number) => {
        if (!ready || !Number.isFinite(goalHours) || goalHours < 1 || goalHours > 40) return;
        data.current.goalHours = goalHours;
        save();
        redraw(n => n + 1);
    };

    // New settings apply from the next phase; the running one keeps its own length
    const updateSettings = (change: Partial<PomodoroSettings>) => {
        if (!ready) return;
        settingsRef.current = clampSettings(change, settingsRef.current);
        saveSettings();
        redraw(n => n + 1);
    };

    const t = data.current.timer;
    const now = Date.now();
    const value: StudyProgress = {
        milliseconds: weeklyMilliseconds(data.current.days),
        days: { ...data.current.days },
        sessions: { ...data.current.sessions },
        goalHours: data.current.goalHours,
        running: t.phase === 'study' && !t.paused,
        ready,
        error,
        toggle,
        setGoal,
        timer: { phase: t.phase, paused: t.paused, breakKind: t.breakKind, remainingMs: remainingMs(t, now), phaseMs: t.phaseMs, cycle: t.cycle },
        pendingBreak: t.pendingBreak,
        settings: settingsRef.current,
        updateSettings,
        start,
        pause,
        resume,
        reset,
        takeBreak,
        breakNow,
        skipBreak,
        celebrating: celebrateUntil > now,
    };
    return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useStudyProgress() {
    const value = useContext(Context);
    if (!value) throw new Error('Study progress requires StudyProgressProvider');
    return value;
}

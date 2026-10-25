import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { dayKey, weeklyMilliseconds } from '../utils/studyProgress';

type Progress = { days: Record<string, number>; goalHours: number };
type StudyProgress = { milliseconds: number; goalHours: number; running: boolean; ready: boolean; error: string; toggle: () => void; setGoal: (hours: number) => void };
const Context = createContext<StudyProgress | null>(null);

export function StudyProgressProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
    const key = `study_progress_${encodeURIComponent(userId).replace(/%/g, '_')}`;
    const data = useRef<Progress>({ days: {}, goalHours: 10 });
    const startedAt = useRef<number | null>(null);
    const queue = useRef(Promise.resolve());
    const [, redraw] = useState(0);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');

    const save = () => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const earliestDay = dayKey(cutoff);
        data.current.days = Object.fromEntries(Object.entries(data.current.days).filter(([day]) => day >= earliestDay));
        const value = JSON.stringify(data.current);
        queue.current = queue.current.then(async () => {
            if (Platform.OS === 'web') globalThis.localStorage.setItem(key, value);
            else await SecureStore.setItemAsync(key, value);
            setError('');
        }).catch(() => setError('Progress could not be saved on this device.'));
    };

    // Split elapsed time at local midnight so sessions crossing a week boundary stay accurate.
    const tick = () => {
        const now = Date.now();
        let cursor = startedAt.current;
        if (cursor === null) return;
        while (cursor < now) {
            const date = new Date(cursor);
            const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
            const end = Math.min(now, midnight);
            const day = dayKey(date);
            data.current.days[day] = (data.current.days[day] || 0) + end - cursor;
            cursor = end;
        }
        startedAt.current = now;
        redraw(n => n + 1);
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const value = Platform.OS === 'web' ? globalThis.localStorage.getItem(key) : await SecureStore.getItemAsync(key);
                if (value) {
                    const parsed = JSON.parse(value);
                    if (!parsed.days || typeof parsed.days !== 'object' || !Number.isFinite(parsed.goalHours) || parsed.goalHours < 1 || parsed.goalHours > 40) throw new Error('Invalid progress');
                    const days: Record<string, number> = {};
                    for (const [day, milliseconds] of Object.entries(parsed.days)) {
                        if (/^\d{4}-\d{2}-\d{2}$/.test(day) && typeof milliseconds === 'number' && Number.isFinite(milliseconds) && milliseconds >= 0) days[day] = milliseconds;
                    }
                    if (mounted) data.current = { days, goalHours: parsed.goalHours };
                }
            } catch {
                if (mounted) setError('Saved progress could not be loaded.');
            } finally {
                if (mounted) setReady(true);
            }
        })();
        let displayedDay = dayKey(new Date());
        const interval = setInterval(() => {
            tick();
            const today = dayKey(new Date());
            if (today !== displayedDay) {
                displayedDay = today;
                redraw(n => n + 1);
            }
            // Persist each minute while studying; pausing also saves immediately.
            if (startedAt.current !== null && new Date().getSeconds() === 0) save();
        }, 1000);
        const subscription = AppState.addEventListener('change', state => {
            if (state !== 'active' && startedAt.current !== null) {
                tick();
                startedAt.current = null;
                redraw(n => n + 1);
                save();
            }
        });
        const onHide = () => {
            if (startedAt.current !== null) {
                tick();
                startedAt.current = null;
                save();
                redraw(n => n + 1);
            }
        };
        if (Platform.OS === 'web') globalThis.addEventListener('pagehide', onHide);
        return () => {
            mounted = false;
            clearInterval(interval);
            subscription.remove();
            if (Platform.OS === 'web') globalThis.removeEventListener('pagehide', onHide);
            if (startedAt.current !== null) { tick(); startedAt.current = null; save(); }
        };
    }, [key]);

    const toggle = () => {
        if (!ready) return;
        if (startedAt.current !== null) { tick(); startedAt.current = null; save(); }
        else startedAt.current = Date.now();
        redraw(n => n + 1);
    };
    const setGoal = (goalHours: number) => {
        if (!ready || !Number.isFinite(goalHours) || goalHours < 1 || goalHours > 40) return;
        data.current.goalHours = goalHours;
        save();
        redraw(n => n + 1);
    };
    return <Context.Provider value={{ milliseconds: weeklyMilliseconds(data.current.days), goalHours: data.current.goalHours, running: startedAt.current !== null, ready, error, toggle, setGoal }}>{children}</Context.Provider>;
}

export function useStudyProgress() {
    const value = useContext(Context);
    if (!value) throw new Error('Study progress requires StudyProgressProvider');
    return value;
}

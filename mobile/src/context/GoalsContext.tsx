import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import GoalService, { StudyGoal } from '../services/GoalService';
import { getErrorMessage } from '../services/DocumentService';
import { addDays, dayKey, weekStart } from '../utils/studyProgress';

// A goal as the screens see it; `pending` while its create is still in flight
export type DailyGoal = StudyGoal & { pending?: boolean };

interface GoalsContextType {
  today: string;
  goalsFor: (date: string) => DailyGoal[];
  // Load the Mon-Sun week containing `date` (no-op when already loaded)
  loadWeek: (date: string) => Promise<void>;
  isWeekLoading: (date: string) => boolean;
  weekError: (date: string) => string | null;
  addGoal: (date: string, text: string) => Promise<void>;
  editGoal: (id: string, text: string) => Promise<void>;
  toggleGoal: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

// Single source of truth for daily study goals, shared by Home and Track.
// Server data is fetched per week; every change is applied immediately and rolled back
// (with an error thrown to the caller) if the save fails.
export const GoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Record<string, DailyGoal>>({});
  const [weekState, setWeekState] = useState<Record<string, 'loading' | 'loaded' | string>>({});
  const [today, setToday] = useState(() => dayKey(new Date()));
  const weekStateRef = useRef(weekState);
  weekStateRef.current = weekState;
  const goalsRef = useRef(goals);
  goalsRef.current = goals;

  // Latest local change per goal; a reply for an older change is ignored so stale data never wins
  const versions = useRef<Record<string, number>>({});
  const bump = (id: string) => (versions.current[id] = (versions.current[id] || 0) + 1);

  // "Today" follows the clock, so yesterday's goals never show as today's after midnight
  useEffect(() => {
    const timer = setInterval(() => {
      const now = dayKey(new Date());
      setToday((prev) => (prev === now ? prev : now));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadWeek = useCallback(async (date: string) => {
    const from = weekStart(date);
    const state = weekStateRef.current[from];
    if (state === 'loading' || state === 'loaded') return;

    setWeekState((prev) => ({ ...prev, [from]: 'loading' }));
    try {
      const list = await GoalService.list(from, addDays(from, 6));
      setGoals((prev) => {
        const next = { ...prev };
        // Replace that week's goals with the server's copy, keeping any local change still in flight
        for (const [id, goal] of Object.entries(next)) {
          if (goal.date >= from && goal.date <= addDays(from, 6) && !goal.pending && !versions.current[id]) delete next[id];
        }
        for (const goal of list) {
          if (!versions.current[goal._id]) next[goal._id] = goal;
        }
        return next;
      });
      setWeekState((prev) => ({ ...prev, [from]: 'loaded' }));
    } catch (err) {
      setWeekState((prev) => ({ ...prev, [from]: getErrorMessage(err, 'Could not load goals.') }));
    }
  }, []);

  // Today's week is always needed (Home)
  useEffect(() => {
    loadWeek(today);
  }, [today, loadWeek]);

  const addGoal = useCallback(async (date: string, text: string) => {
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    setGoals((prev) => ({
      ...prev,
      [tempId]: { _id: tempId, date, text: text.trim(), completed: false, createdAt: now, updatedAt: now, pending: true },
    }));
    try {
      const saved = await GoalService.create(date, text);
      setGoals((prev) => {
        const next = { ...prev };
        delete next[tempId];
        next[saved._id] = saved;
        return next;
      });
    } catch (err) {
      setGoals((prev) => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      throw new Error(getErrorMessage(err, 'Could not save the goal.'));
    }
  }, []);

  // Apply a change locally, save it, and roll back only if no newer change has happened since
  const mutate = useCallback(async (id: string, change: Partial<DailyGoal>, save: () => Promise<StudyGoal>, original?: DailyGoal) => {
    // `original` = the state to restore on failure, when the caller already updated goalsRef
    const before = original ?? goalsRef.current[id];
    if (!before || before.pending) return;
    const version = bump(id);
    setGoals((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...change } } : prev));
    try {
      const saved = await save();
      if (versions.current[id] === version) {
        setGoals((prev) => (prev[id] ? { ...prev, [id]: saved } : prev));
        delete versions.current[id];
      }
    } catch (err) {
      if (versions.current[id] === version) {
        setGoals((prev) => (prev[id] ? { ...prev, [id]: before } : prev));
        delete versions.current[id];
      }
      throw new Error(getErrorMessage(err, 'Could not update the goal.'));
    }
  }, []);

  const editGoal = useCallback(
    (id: string, text: string) => mutate(id, { text: text.trim() }, () => GoalService.update(id, { text })),
    [mutate]
  );

  const toggleGoal = useCallback(async (id: string) => {
    const goal = goalsRef.current[id];
    if (!goal) return;
    const completed = !goal.completed;
    // Keep the ref current so a quick second tap toggles back instead of repeating
    goalsRef.current = { ...goalsRef.current, [id]: { ...goal, completed } };
    await mutate(id, { completed }, () => GoalService.update(id, { completed }), goal);
  }, [mutate]);

  const deleteGoal = useCallback(async (id: string) => {
    const removed = goalsRef.current[id];
    if (!removed || removed.pending) return;
    bump(id);
    setGoals((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      await GoalService.remove(id);
      delete versions.current[id];
    } catch (err) {
      delete versions.current[id];
      setGoals((prev) => (removed ? { ...prev, [id]: removed } : prev));
      throw new Error(getErrorMessage(err, 'Could not delete the goal.'));
    }
  }, []);

  const byDate = useMemo(() => {
    const map: Record<string, DailyGoal[]> = {};
    for (const goal of Object.values(goals)) {
      (map[goal.date] ||= []).push(goal);
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return map;
  }, [goals]);

  const value = useMemo<GoalsContextType>(() => ({
    today,
    goalsFor: (date) => byDate[date] || [],
    loadWeek,
    isWeekLoading: (date) => weekState[weekStart(date)] === 'loading' || weekState[weekStart(date)] === undefined,
    weekError: (date) => {
      const state = weekState[weekStart(date)];
      return state && state !== 'loading' && state !== 'loaded' ? state : null;
    },
    addGoal,
    editGoal,
    toggleGoal,
    deleteGoal,
  }), [today, byDate, loadWeek, weekState, addGoal, editGoal, toggleGoal, deleteGoal]);

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
};

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
};

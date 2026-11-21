import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LayerId, TopicStatus } from '@/data/geography';
import {
  buildReviewItem,
  localDayKey,
  PersistedStudyData,
  STUDY_STORE_VERSION,
  sanitizePersistedStudy,
} from '@/utils/study';

export type StudyNote = {
  id: string;
  title: string;
  body: string;
  category: string;
  updatedAt: number;
  relatedItemId?: string;
  relatedItemName?: string;
};

export type StudyReviewItem = {
  id: string;
  layer: LayerId;
  targetId: string;
  targetName: string;
  dueAt: number;
  intervalDays: number;
  successStreak: number;
  attempts: number;
  lastCorrect: boolean;
};

export type QuizAnswerRecord = {
  layer: LayerId;
  targetId: string;
  targetName: string;
  isCorrect: boolean;
};

type StudyContextValue = PersistedStudyData & {
  hydrated: boolean;
  setTopicStatus: (topicId: string, status: TopicStatus) => void;
  saveNote: (note: StudyNote) => void;
  deleteNote: (noteId: string) => void;
  recordQuizAnswer: (answer: QuizAnswerRecord) => void;
  toggleProCandidate: (candidateId: string) => void;
  setDailyGoal: (goal: number) => void;
  toggleProgramTask: (taskId: string) => void;
  addProgramTask: (title: string) => void;
  removeProgramTask: (taskId: string) => void;
  claimProgramBonus: () => void;
  importStudyData: (data: unknown) => boolean;
  resetStudyData: () => void;
};

const STORAGE_KEY = 'geokpss-study-v1';
const initialState: PersistedStudyData = {
  notes: [],
  topicStatuses: {},
  reviewItems: [],
  answered: 0,
  correct: 0,
  proCandidates: [],
  dailyActivity: {},
  dailyGoal: 10,
  program: {},
  xp: 0,
};

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedStudyData>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!active || !saved) return;
        try {
          setState({ ...initialState, ...sanitizePersistedStudy(JSON.parse(saved)) });
        } catch {
          // Corrupt payloads are ignored; the app starts with a clean slate.
        }
      })
      .catch(() => {
        // The app remains usable if the device's local store is unavailable.
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const commit = (next: PersistedStudyData) => {
    setState(next);
    void AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...next, version: STUDY_STORE_VERSION }),
    );
  };

  const value = useMemo<StudyContextValue>(
    () => ({
      ...state,
      hydrated,
      setTopicStatus: (topicId, status) =>
        commit({ ...state, topicStatuses: { ...state.topicStatuses, [topicId]: status } }),
      saveNote: (note) => {
        const exists = state.notes.some((entry) => entry.id === note.id);
        const notes = exists
          ? state.notes.map((entry) => (entry.id === note.id ? note : entry))
          : [note, ...state.notes];
        commit({ ...state, notes });
      },
      deleteNote: (noteId) =>
        commit({ ...state, notes: state.notes.filter((note) => note.id !== noteId) }),
      recordQuizAnswer: (answer) => {
        const id = `${answer.layer}:${answer.targetId}`;
        const existing = state.reviewItems.find((item) => item.id === id);
        const reviewItem = buildReviewItem(answer, existing);
        const topicStatus = state.topicStatuses[answer.layer] ?? 'new';
        let topicStatuses = state.topicStatuses;
        if (topicStatus !== 'done') {
          if (!answer.isCorrect) {
            topicStatuses = { ...state.topicStatuses, [answer.layer]: 'weak' as TopicStatus };
          } else if (topicStatus === 'new') {
            topicStatuses = { ...state.topicStatuses, [answer.layer]: 'studying' as TopicStatus };
          } else if (topicStatus === 'weak') {
            topicStatuses = { ...state.topicStatuses, [answer.layer]: 'review' as TopicStatus };
          }
        }
        const dayKey = localDayKey();
        const day = state.dailyActivity[dayKey] ?? { answered: 0, correct: 0 };
        commit({
          ...state,
          answered: state.answered + 1,
          correct: state.correct + (answer.isCorrect ? 1 : 0),
          topicStatuses,
          xp: state.xp + (answer.isCorrect ? 10 : 3),
          dailyActivity: {
            ...state.dailyActivity,
            [dayKey]: { answered: day.answered + 1, correct: day.correct + (answer.isCorrect ? 1 : 0) },
          },
          reviewItems: [reviewItem, ...state.reviewItems.filter((item) => item.id !== id)],
        });
      },
      toggleProCandidate: (candidateId) =>
        commit({
          ...state,
          proCandidates: state.proCandidates.includes(candidateId)
            ? state.proCandidates.filter((id) => id !== candidateId)
            : [...state.proCandidates, candidateId],
        }),
      setDailyGoal: (goal) =>
        commit({ ...state, dailyGoal: Math.min(200, Math.max(1, Math.round(goal))) }),
      toggleProgramTask: (taskId) => {
        const dayKey = localDayKey();
        const day = state.program[dayKey] ?? { done: [], custom: [] };
        const markingDone = !day.done.includes(taskId);
        const done = markingDone
          ? [...day.done, taskId]
          : day.done.filter((id) => id !== taskId);
        const program = { ...state.program, [dayKey]: { ...day, done } };
        commit({
          ...state,
          program,
          xp: markingDone ? state.xp + 25 : Math.max(0, state.xp - 25),
        });
      },
      addProgramTask: (title) => {
        const trimmed = title.trim().slice(0, 80);
        if (!trimmed) return;
        const dayKey = localDayKey();
        const day = state.program[dayKey] ?? { done: [], custom: [] };
        if (day.custom.length >= 30) return;
        const task = { id: `c${Date.now().toString(36)}`, title: trimmed };
        commit({
          ...state,
          program: { ...state.program, [dayKey]: { ...day, custom: [...day.custom, task] } },
        });
      },
      removeProgramTask: (taskId) => {
        const dayKey = localDayKey();
        const day = state.program[dayKey];
        if (!day) return;
        const customId = taskId.startsWith('custom:') ? taskId.slice(7) : null;
        const custom = customId ? day.custom.filter((task) => task.id !== customId) : day.custom;
        const done = customId ? day.done.filter((id) => id !== taskId) : day.done;
        commit({
          ...state,
          program: { ...state.program, [dayKey]: { ...day, done, custom } },
        });
      },
      claimProgramBonus: () => {
        const dayKey = localDayKey();
        const day = state.program[dayKey];
        if (!day || day.bonus) return;
        commit({
          ...state,
          xp: state.xp + 50,
          program: { ...state.program, [dayKey]: { ...day, bonus: true } },
        });
      },
      importStudyData: (data) => {
        try {
          const parsed: unknown = typeof data === 'string' ? JSON.parse(data) : data;
          const payload = isRecord(parsed) && isRecord(parsed.study) ? parsed.study : parsed;
          const clean = sanitizePersistedStudy(payload);
          const hasContent =
            clean.notes.length > 0 ||
            clean.reviewItems.length > 0 ||
            Object.keys(clean.topicStatuses).length > 0 ||
            clean.answered > 0 ||
            clean.proCandidates.length > 0;
          if (!hasContent) return false;
          commit({ ...initialState, ...clean });
          return true;
        } catch {
          return false;
        }
      },
      resetStudyData: () => {
        commit(initialState);
      },
    }),
    [state, hydrated],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function useStudy() {
  const value = useContext(StudyContext);
  if (!value) throw new Error('useStudy must be used inside StudyProvider');
  return value;
}

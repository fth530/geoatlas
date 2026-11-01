import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LayerId, TopicStatus } from '@/data/geography';

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

type PersistedStudy = {
  notes: StudyNote[];
  topicStatuses: Record<string, TopicStatus>;
  reviewItems: StudyReviewItem[];
  answered: number;
  correct: number;
  proCandidates: string[];
};

type StudyContextValue = PersistedStudy & {
  hydrated: boolean;
  setTopicStatus: (topicId: string, status: TopicStatus) => void;
  saveNote: (note: StudyNote) => void;
  deleteNote: (noteId: string) => void;
  recordQuizAnswer: (answer: QuizAnswerRecord) => void;
  toggleProCandidate: (candidateId: string) => void;
};

const STORAGE_KEY = 'geokpss-study-v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const initialState: PersistedStudy = {
  notes: [],
  topicStatuses: {},
  reviewItems: [],
  answered: 0,
  correct: 0,
  proCandidates: [],
};

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedStudy>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!active) return;
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<PersistedStudy>;
          setState({ ...initialState, ...parsed });
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

  const commit = (next: PersistedStudy) => {
    setState(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
        const successStreak = answer.isCorrect ? (existing?.successStreak ?? 0) + 1 : 0;
        const intervalDays = answer.isCorrect
          ? REVIEW_INTERVALS[Math.min(existing?.successStreak ?? 0, REVIEW_INTERVALS.length - 1)]
          : 1;
        const reviewItem: StudyReviewItem = {
          id,
          layer: answer.layer,
          targetId: answer.targetId,
          targetName: answer.targetName,
          dueAt: Date.now() + intervalDays * DAY_MS,
          intervalDays,
          successStreak,
          attempts: (existing?.attempts ?? 0) + 1,
          lastCorrect: answer.isCorrect,
        };
        const topicStatus = state.topicStatuses[answer.layer] ?? 'new';
        const topicStatuses = {
          ...state.topicStatuses,
          ...(answer.isCorrect
            ? topicStatus === 'new' ? { [answer.layer]: 'studying' as TopicStatus } : {}
            : { [answer.layer]: 'weak' as TopicStatus }),
        };
        commit({
          ...state,
          answered: state.answered + 1,
          correct: state.correct + (answer.isCorrect ? 1 : 0),
          topicStatuses,
          reviewItems: [
            reviewItem,
            ...state.reviewItems.filter((item) => item.id !== id),
          ],
        });
      },
      toggleProCandidate: (candidateId) =>
        commit({
          ...state,
          proCandidates: state.proCandidates.includes(candidateId)
            ? state.proCandidates.filter((id) => id !== candidateId)
            : [...state.proCandidates, candidateId],
        }),
    }),
    [state, hydrated],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const value = useContext(StudyContext);
  if (!value) throw new Error('useStudy must be used inside StudyProvider');
  return value;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LayerId, TopicStatus } from '@/data/geography';
import {
  buildReviewItem,
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
        commit({
          ...state,
          answered: state.answered + 1,
          correct: state.correct + (answer.isCorrect ? 1 : 0),
          topicStatuses,
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

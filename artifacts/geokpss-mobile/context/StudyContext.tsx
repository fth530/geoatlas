import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { TopicStatus } from '@/data/geography';

export type StudyNote = {
  id: string;
  title: string;
  body: string;
  category: string;
  updatedAt: number;
};

type PersistedStudy = {
  notes: StudyNote[];
  topicStatuses: Record<string, TopicStatus>;
  answered: number;
  correct: number;
  proCandidates: string[];
};

type StudyContextValue = PersistedStudy & {
  hydrated: boolean;
  setTopicStatus: (topicId: string, status: TopicStatus) => void;
  saveNote: (note: StudyNote) => void;
  deleteNote: (noteId: string) => void;
  recordQuizAnswer: (isCorrect: boolean) => void;
  toggleProCandidate: (candidateId: string) => void;
};

const STORAGE_KEY = 'geokpss-study-v1';
const initialState: PersistedStudy = {
  notes: [],
  topicStatuses: {},
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
      recordQuizAnswer: (isCorrect) =>
        commit({
          ...state,
          answered: state.answered + 1,
          correct: state.correct + (isCorrect ? 1 : 0),
        }),
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

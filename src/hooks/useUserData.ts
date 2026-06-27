import { useState, useCallback } from 'react';
import type { UserData } from '../types';

const STORAGE_KEY = 'history-db-user-data';

function loadUserData(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { notes: {}, favorites: [], nodeOrder: [] };
}

function saveUserData(data: UserData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData>(loadUserData);

  const saveNote = useCallback((nodeId: string, text: string) => {
    setUserData((prev) => {
      const next: UserData = {
        ...prev,
        notes: {
          ...prev.notes,
          [nodeId]: { nodeId, text, updatedAt: Date.now() },
        },
      };
      saveUserData(next);
      return next;
    });
  }, []);

  const deleteNote = useCallback((nodeId: string) => {
    setUserData((prev) => {
      const next = { ...prev, notes: { ...prev.notes } };
      delete next.notes[nodeId];
      saveUserData(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((nodeId: string) => {
    setUserData((prev) => {
      const next: UserData = {
        ...prev,
        favorites: prev.favorites.includes(nodeId)
          ? prev.favorites.filter((id) => id !== nodeId)
          : [...prev.favorites, nodeId],
      };
      saveUserData(next);
      return next;
    });
  }, []);

  const saveNodeOrder = useCallback((order: string[]) => {
    setUserData((prev) => {
      const next: UserData = { ...prev, nodeOrder: order };
      saveUserData(next);
      return next;
    });
  }, []);

  return {
    userData,
    saveNote,
    deleteNote,
    toggleFavorite,
    saveNodeOrder,
  };
}

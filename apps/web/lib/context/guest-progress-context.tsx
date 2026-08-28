'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  GuestProgressState,
  GuestProfile,
  GuestSessionRecord,
} from '../gamification/guest-progress.schema';
import { StorageManager } from '../storage/storage-manager';

interface GuestProgressContextValue {
  state: GuestProgressState | null;
  isLoading: boolean;
  isPrivateMode: boolean;
  updateProfile: (profile: Partial<GuestProfile>) => Promise<void>;
  recordCompletedSession: (session: GuestSessionRecord) => Promise<void>;
  clearState: () => Promise<void>;
  refreshState: () => Promise<void>;
}

const GuestProgressContext = createContext<GuestProgressContextValue | null>(null);

export const GuestProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GuestProgressState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPrivateMode, setIsPrivateMode] = useState<boolean>(false);

  const loadState = useCallback(async () => {
    try {
      setIsLoading(true);
      const manager = StorageManager.getInstance();
      const loaded = await manager.getState();
      setState(loaded);
      setIsPrivateMode(manager.isPrivateMode());
    } catch (err) {
      console.error('Failed to load guest progress state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const updateProfile = useCallback(async (profile: Partial<GuestProfile>) => {
    const manager = StorageManager.getInstance();
    const updated = await manager.updateProfile(profile);
    setState(updated);
  }, []);

  const recordCompletedSession = useCallback(async (session: GuestSessionRecord) => {
    const manager = StorageManager.getInstance();
    const updated = await manager.recordCompletedSession(session);
    setState(updated);
  }, []);

  const clearState = useCallback(async () => {
    const manager = StorageManager.getInstance();
    await manager.clearState();
    const fresh = await manager.getState();
    setState(fresh);
  }, []);

  const refreshState = useCallback(async () => {
    await loadState();
  }, [loadState]);

  return (
    <GuestProgressContext.Provider
      value={{
        state,
        isLoading,
        isPrivateMode,
        updateProfile,
        recordCompletedSession,
        clearState,
        refreshState,
      }}
    >
      {children}
    </GuestProgressContext.Provider>
  );
};

export const useGuestProgress = (): GuestProgressContextValue => {
  const context = useContext(GuestProgressContext);
  if (!context) {
    throw new Error('useGuestProgress must be used within a GuestProgressProvider');
  }
  return context;
};

'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPreferences } from '@/types';
import { logger } from '../production-logger';

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

const defaultPreferences: Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  language: 'en',
  currency: 'USD',
  notifications: {
    email: true,
    sms: false,
    push: true,
    marketing: false,
  },
  searchPreferences: {
    preferredCategories: [],
    sortBy: 'popularity',
  },
  privacy: {
    profileVisible: true,
    showReviews: true,
    allowMessages: true,
  },
};

export function useUserPreferences(userId: string): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    if (userId) {
      loadPreferences();
    }
  }, [userId]);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/preferences?userId=${userId}`);
      
      if (response.status === 404) {
        // No preferences found, create default ones
        await createDefaultPreferences();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...defaultPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create default preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create preferences');
    }
  };

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    setError(null);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    }
  }, [userId]);

  const resetPreferences = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...defaultPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset preferences');
      throw err;
    }
  }, [userId]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    resetPreferences,
  };
}

// Hook for getting preferences without user ID (uses local storage fallback)
export function useGuestPreferences() {
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>(defaultPreferences);

  useEffect(() => {
    // Load from local storage
    const stored = localStorage.getItem('guestPreferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        logger.error('Failed to parse guest preferences:', error);
      }
    }
  }, []);

  const updateGuestPreferences = useCallback((updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    localStorage.setItem('guestPreferences', JSON.stringify(newPreferences));
  }, [preferences]);

  const clearGuestPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('guestPreferences');
  }, []);

  return {
    preferences,
    updatePreferences: updateGuestPreferences,
    clearPreferences: clearGuestPreferences,
  };
}

// Hook for syncing guest preferences with user account on login
export function usePreferenceSync() {
  const syncGuestPreferences = useCallback(async (userId: string) => {
    try {
      const guestPreferences = localStorage.getItem('guestPreferences');
      
      if (!guestPreferences) {
        return;
      }

      const parsed = JSON.parse(guestPreferences);
      
      // Send guest preferences to server
      const response = await fetch('/api/user/preferences/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          guestPreferences: parsed,
        }),
      });

      if (response.ok) {
        // Clear local storage after successful sync
        localStorage.removeItem('guestPreferences');
      }
    } catch (error) {
      logger.error('Failed to sync guest preferences:', error);
    }
  }, []);

  return { syncGuestPreferences };
}

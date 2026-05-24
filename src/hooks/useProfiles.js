import { useState, useCallback } from 'react'
import { DEV_SEED_PROFILES } from '../devSeed.js'

const STORAGE_KEY = 'coqtale_profiles'
const DEV_SEED = import.meta.env.VITE_DEV_SEED === 'true'

const DEFAULT_PROFILES = {
  me: {
    id: 'me',
    name: 'Me',
    onboardingComplete: false,
    fingerprint: null,
    preferences: null,
    ratingCount: 0,
  },
  partner: {
    id: 'partner',
    name: 'Partner',
    onboardingComplete: false,
    fingerprint: null,
    preferences: null,
    ratingCount: 0,
  },
}

export { DEFAULT_PROFILES }

function loadProfiles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        me:      { ...DEFAULT_PROFILES.me,      ...parsed.me },
        partner: { ...DEFAULT_PROFILES.partner, ...parsed.partner },
      }
    }
  } catch (e) {
    console.error('Failed to read profiles', e)
  }

  // Nothing in storage — use dev seed if enabled, otherwise defaults
  if (DEV_SEED) {
    console.info('[DEV] Loading seed profiles')
    return DEV_SEED_PROFILES
  }

  return DEFAULT_PROFILES
}

export function useProfiles() {
  const [profiles, setProfilesState] = useState(loadProfiles)

  const updateProfile = useCallback((profileId, patch) => {
    setProfilesState(prev => {
      const updated = {
        ...prev,
        [profileId]: { ...prev[profileId], ...patch },
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save profiles', e)
      }
      return updated
    })
  }, [])

  const getProfile = useCallback((profileId) => {
    return profiles[profileId] || null
  }, [profiles])

  return { profiles, updateProfile, getProfile }
}
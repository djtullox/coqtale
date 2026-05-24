import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'coqtale_profiles'

const DEFAULT_PROFILES = {
  me: {
    id: 'me',
    name: 'Me',
    onboardingComplete: false,
    fingerprint: null,      // computed flavor string, stored after onboarding
    preferences: null,      // raw wizard answers
    ratingCount: 0,
  },
  partner: {
    id: 'partner',
    name: 'Partner',
    onboardingComplete: false,
    fingerprint: null,
    preferences: null,
    ratingCount: 0,
  }
}

export { DEFAULT_PROFILES }

export function useProfiles() {
  const [profiles, setProfilesState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle schema additions
        return {
          me:      { ...DEFAULT_PROFILES.me,      ...parsed.me },
          partner: { ...DEFAULT_PROFILES.partner, ...parsed.partner },
        }
      }
    } catch (e) {
      console.error('Failed to read profiles', e)
    }
    return DEFAULT_PROFILES
  })

  const saveProfiles = useCallback((updated) => {
    setProfilesState(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to save profiles', e)
    }
  }, [])

  const updateProfile = useCallback((profileId, patch) => {
    setProfilesState(prev => {
      const updated = {
        ...prev,
        [profileId]: { ...prev[profileId], ...patch }
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

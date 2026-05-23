import React, { createContext, useContext, useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomeScreen from './screens/HomeScreen.jsx'
import OnboardingScreen from './screens/OnboardingScreen.jsx'
import ScanScreen from './screens/ScanScreen.jsx'
import ResultsScreen from './screens/ResultsScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'
import AppShell from './components/AppShell.jsx'

// Profile context — active profile for the session
export const ProfileContext = createContext(null)
export const useProfile = () => useContext(ProfileContext)

export default function App() {
  // 'me' | 'partner' | null
  const [activeProfile, setActiveProfile] = useState(null)

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile }}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/onboarding/:profileId" element={<OnboardingScreen />} />
        <Route element={<AppShell />}>
          <Route path="/scan" element={<ScanScreen />} />
          <Route path="/results/:visitId" element={<ResultsScreen />} />
          <Route path="/profile/:profileId" element={<ProfileScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProfileContext.Provider>
  )
}

import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useProfile } from '../App.jsx'
import styles from './AppShell.module.css'

const THREE_HOURS_MS = 3 * 60 * 60 * 1000

export default function AppShell() {
  const { activeProfile } = useProfile()
  const navigate = useNavigate()
  const [activeVisit, setActiveVisit] = useState(null)

  useEffect(() => {
    async function checkActiveVisit() {
      try {
        const res = await fetch('/api/visits', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const now = Date.now()
        const recent = (data.visits || []).find(v => now - v.scannedAt < THREE_HOURS_MS)
        setActiveVisit(recent || null)
      } catch (err) {
        console.warn('Could not check for active visit', err)
      }
    }
    checkActiveVisit()
  }, [])

  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.nav}>
        <NavLink to="/scan" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
          <ScanIcon />
          <span>Scan</span>
        </NavLink>

        {activeVisit && (
          <button
            className={styles.navItemTonight}
            onClick={() => navigate(`/results/${activeVisit.visitId}`)}
          >
            <TonightIcon />
            <span>Tonight</span>
          </button>
        )}

        <NavLink
          to={`/profile/${activeProfile || 'me'}`}
          className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}
        >
          <ProfileIcon />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}

function ScanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="16" y="3" width="5" height="5" rx="1" />
      <rect x="3" y="16" width="5" height="5" rx="1" />
      <line x1="13" y1="5" x2="13" y2="5.01" strokeWidth="2.5" />
      <line x1="13" y1="9" x2="21" y2="9" />
      <line x1="13" y1="13" x2="21" y2="13" />
      <line x1="13" y1="17" x2="21" y2="17" />
      <line x1="13" y1="21" x2="21" y2="21" />
    </svg>
  )
}

function TonightIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.4-9.6A9.07 9.07 0 0 0 12 2z" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

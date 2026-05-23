import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useProfile } from '../App.jsx'
import styles from './AppShell.module.css'

export default function AppShell() {
  const { activeProfile } = useProfile()
  const navigate = useNavigate()

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

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

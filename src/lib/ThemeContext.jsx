import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DARK, LIGHT } from '../theme.js'
import { supabase } from './supabase.js'
import { getProfile, updateUserSettings } from '../utils/db.js'

const ThemeCtx = createContext(null)
const FONT_SIZES = { sm: 90, md: 100, lg: 115, xl: 130 }
const DEFAULT_FONT = 'md'
const DEFAULT_THEME = 'dark'

function applyBodyTheme(isDark, fontSizeId) {
  const theme = isDark ? DARK : LIGHT
  document.body.style.background = theme.bg
  document.body.style.color = theme.t
  document.body.style.transition = 'background 0.3s, color 0.3s'
  document.body.style.zoom = String((FONT_SIZES[fontSizeId] || FONT_SIZES[DEFAULT_FONT]) / 100)
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true)
  const [fontSize, setFontSizeState] = useState(DEFAULT_FONT)
  const [userId, setUserId] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true

    const loadFromProfile = async (uid) => {
      const profile = await getProfile(uid)
      if (!alive) return
      const nextTheme = profile?.theme_mode === 'light' ? 'light' : DEFAULT_THEME
      const nextFont = Object.prototype.hasOwnProperty.call(FONT_SIZES, profile?.font_size) ? profile.font_size : DEFAULT_FONT
      setIsDark(nextTheme !== 'light')
      setFontSizeState(nextFont)
      setReady(true)
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!alive) return
      if (session?.user?.id) {
        setUserId(session.user.id)
        await loadFromProfile(session.user.id)
      } else {
        setUserId(null)
        setIsDark(true)
        setFontSizeState(DEFAULT_FONT)
        setReady(true)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return
      if (session?.user?.id) {
        setUserId(session.user.id)
        await loadFromProfile(session.user.id)
      } else {
        setUserId(null)
        setIsDark(true)
        setFontSizeState(DEFAULT_FONT)
        setReady(true)
      }
    })

    init()
    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    applyBodyTheme(isDark, fontSize)
  }, [isDark, fontSize, ready])

  const persist = async (patch) => {
    if (!userId) return
    await updateUserSettings(userId, patch)
  }

  const toggle = () => {
    setIsDark(current => {
      const next = !current
      void persist({ theme_mode: next ? 'dark' : 'light' })
      return next
    })
  }

  const setFontSize = (nextFontSize) => {
    if (!Object.prototype.hasOwnProperty.call(FONT_SIZES, nextFontSize)) return
    setFontSizeState(nextFontSize)
    void persist({ font_size: nextFontSize })
  }

  const C = useMemo(() => (isDark ? DARK : LIGHT), [isDark])

  const gls = (extra = {}) => ({
    background: isDark ? 'rgba(13,18,36,0.72)' : 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${C.bdL}`,
    borderRadius: 16,
    ...extra,
  })

  return <ThemeCtx.Provider value={{ C, gls, isDark, toggle, fontSize, setFontSize }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)

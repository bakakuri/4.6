import { createContext, useContext, useState, useEffect } from 'react'
import { DARK, LIGHT } from '../theme.js'

const ThemeCtx = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('lm_theme') !== 'light'
  )

  useEffect(() => {
    document.body.style.background = isDark ? DARK.bg : LIGHT.bg
    document.body.style.transition = 'background 0.3s'
  }, [isDark])

  const toggle = () => setIsDark(d => {
    const next = !d
    localStorage.setItem('lm_theme', next ? 'dark' : 'light')
    return next
  })

  const C = isDark ? DARK : LIGHT

  const gls = (extra = {}) => ({
    background: isDark ? 'rgba(13,18,36,0.72)' : 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${C.bdL}`,
    borderRadius: 16,
    ...extra,
  })

  return (
    <ThemeCtx.Provider value={{ C, gls, isDark, toggle }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)

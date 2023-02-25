'use client'
import { useState, useEffect } from 'react'
import { Switch } from '@headlessui/react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (import.meta.env.SSR) return undefined
    return document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  })
  const enabled = theme == 'light' ? false : true

  useEffect(() => {
    const root = document.documentElement
    const themeColorMetaTag = document.head.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    )
    if (theme === 'light') {
      root.classList.remove('dark')
      // root.classList.add('light')
      themeColorMetaTag && (themeColorMetaTag.content = '#ffffff')
    } else {
      // root.classList.remove('light')
      root.classList.add('dark')
      themeColorMetaTag && (themeColorMetaTag.content = '#0f172a')
    }
  }, [theme])

  const handleThemeChange = (checked: boolean) => {
    const root = document.documentElement
    if (checked) {
      setTheme('dark')
      root.classList.add('dark')
      sessionStorage.setItem('theme', 'dark')
    } else {
      setTheme('light')
      root.classList.remove('dark')
      sessionStorage.setItem('theme', 'light')
    }
  }

  return (
    <Switch
      checked={enabled}
      onChange={handleThemeChange}
      className="ml-4 inline-flex h-6 w-11 items-center justify-self-end rounded-full bg-black dark:bg-white"
    >
      <span className="sr-only">Toggle dark mode</span>
      <span
        className={`inline-block h-4 w-4 translate-x-1 rounded-full bg-primary-yellow bg-gradient-to-tr duration-300 dark:translate-x-6 dark:bg-primary-blue`}
      >
        <span className="absolute top-0 right-0 h-[10px] w-[10px] scale-[0] rounded-full bg-gray-700"></span>
      </span>
    </Switch>
  )
}

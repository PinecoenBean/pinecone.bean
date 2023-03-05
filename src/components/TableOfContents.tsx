import type { MarkdownHeading } from 'astro'
import { useEffect } from 'react'

export interface Props {
  headings: MarkdownHeading[]
  className?: string
}

const depthClassNames = [
  'pl-[0em]',
  'pl-[1em]',
  'pl-[2em]',
  'pl-[3em]',
  'pl-[4em]',
  'pl-[5em]',
]

function isWindowBetween(element: Element): boolean {
  return element.getBoundingClientRect().top >= 20
}

function getTocId(slug: string) {
  return `toc-item-${slug}`
}

function getCurrentIndex(headings: MarkdownHeading[], hash: string) {
  if (hash === '') {
    return 0
  }
  for (let i = 0; i < headings.length; i++) {
    if (headings[i].slug == hash) {
      return i
    }
  }
  return 0
}

export default function TableOfContents({ headings, className }: Props) {
  useEffect(() => {
    const tocItems = headings.map((h) => document.getElementById(getTocId(h.slug))!)
    let currentIndex = getCurrentIndex(headings, window.location.hash.slice(1))
    
    const setActiveH = (index: number) => {
      tocItems[currentIndex].classList.remove('active-header')
      tocItems[index].classList.add('active-header')
      currentIndex = index
    }
    
    setActiveH(currentIndex)
    
    const onScroll = () => {
      for (let i = 0; i < headings.length - 1; i++) {
        const nextElement = document.getElementById(headings[i + 1].slug)!
        if (isWindowBetween(nextElement)) {
          setActiveH(i)
          return
        }
      }
      setActiveH(headings.length - 1)
    }
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [headings])

  return (
    <ul className={`unset ${className || ''}`}>
      {headings.map((h) => (
        <li key={h.slug} className={depthClassNames[h.depth - 2]}>
          <a
            id={getTocId(h.slug)}
            className="unset hover:text-text-link"
            href={`#${h.slug}`}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

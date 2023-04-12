import type { MarkdownHeading } from 'astro'
import type { HTMLAttributes } from 'astro/types'

export interface FrontMatter {
  tags: string[]
  title: string
  pubDate: Date
  description?: string
  // author: string
  // image: {
  //   url: string
  //   alt: string
  // }
}

export interface LinkAttributes extends HTMLAttributes<'a'> {
  active: boolean
}

export interface TocItem extends MarkdownHeading {
  children: TocItem[]
}

export interface SearchItem {
  title: string
  description: string
  tags: string[]
  id: string
  slug: string
}
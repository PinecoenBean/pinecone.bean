import type { HTMLAttributes } from 'astro/types'

export interface FrontMatter {
  tags: string[]
  title: string
  pubDate: string
  description: string
  author: string
  image: {
    url: string
    alt: string
  }
}


export interface LinkAttributes extends HTMLAttributes<'a'> {
  active: boolean
}
import mdx from '@astrojs/mdx'
import tailwind from '@astrojs/tailwind'
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// https://astro.build/config
export default defineConfig({
  site: 'https://pinecone-bean.me',
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    mdx(),
    react(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [
        rehypeKatex,
        {
          // Katex plugin options
        },
      ],
    ],
  },
})

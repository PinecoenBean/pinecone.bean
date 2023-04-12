import type { MarkdownHeading } from 'astro'
import type { TocItem } from '@types'
import { assert } from 'console'

function checkHeadings(headings: MarkdownHeading[]) {
  if (headings.length > 1 && headings[1].depth !== 2) {
    throw new Error(
      `the first heading after overview (${headings[0].text}) should be an <h2>`
    )
  }
  for (let i = 1; i < headings.length; i++) {
    const currH = headings[i]
    const prevH = headings[i - 1]
    if (currH.depth - prevH.depth > 1) {
      throw new Error(
        `heading ${currH.text} and heading ${prevH.text} are not valid, their depth should be within 1`
      )
    }
  }
}

function collapse(stack: TocItem[], targetDepth: number): void {
  if (targetDepth < 2) {
    throw new Error('taget depth should >= 2')
  }
  let lastItem = stack[stack.length - 1]
  let currDepth = lastItem.depth
  if (currDepth == targetDepth) {
    return
  }

  while (stack.length > 0 && currDepth > targetDepth) {
    const currChildren: TocItem[] = []
    while (stack.length > 0 && lastItem.depth === currDepth) {
      currChildren.push(stack.pop()!)
      lastItem = stack[stack.length - 1]
    }
    lastItem.children = currChildren.reverse()
    assert(currDepth - lastItem.depth === 1)
    currDepth = lastItem.depth
  }
}

//**  reference: withastro/astro.build */
export function generateToc(
  headings: MarkdownHeading[],
  maxDepth = 4
): TocItem[] {
  const overview = {
    depth: 2,
    slug: 'overview',
    text: 'Overview',
    children: [],
  }
  const headingsToShow: TocItem[] = [
    overview,
    ...headings
      .filter((h) => h.depth > 1 && h.depth <= maxDepth)
      .map((h) => ({ ...h, children: [] })),
  ]

  if (headingsToShow.length == 1) {
    return headingsToShow
  }

  checkHeadings(headingsToShow)

  const stack: TocItem[] = headingsToShow.slice(2)
  for (let i = 2; i < headingsToShow.length; i++) {
    const currItem: TocItem = headingsToShow[i]
    if (currItem.depth > stack[stack.length - 1].depth) {
      collapse(stack, currItem.depth)
    }
    stack.push(currItem)
  }
  collapse(stack, 2)
  return stack
}

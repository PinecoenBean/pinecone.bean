import type { SearchItem } from '@types'
import Fuse from 'fuse.js'
import { useEffect, useRef, useState } from 'react'
// reference: astro-paper
const BlogItem = ({ item: { title, slug } }: { item: SearchItem }) => {
  return (
    <div>
      <div className="title">
        <a
          href={`/blog/${slug}`}
          className="unset bg-gradient-to-r from-text-link to-text-link bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 hover:bg-[length:100%_2px] dark:from-text-link dark:to-text-link dark:bg-[length:0%_2px] hover:dark:bg-[length:100%_2px]"
        >
          {title}
        </a>
      </div>
    </div>
  )
}

export default function SearchPanel({
  searchItems,
}: {
  searchItems: SearchItem[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [searchKey, setSearchKey] = useState('')
  const [searchResult, setSearchResult] = useState<
    Fuse.FuseResult<SearchItem>[]
  >([])

  useEffect(() => {
    const fuse = new Fuse(searchItems, {
      keys: ['title', 'description', 'tags'],
      minMatchCharLength: 2,
      threshold: 0.6,
    })

    if (searchKey.length > 1) {
      setSearchResult(fuse.search(searchKey))
    } else {
      setSearchResult([])
    }
  }, [searchKey])

  return (
    <>
      <label className="relative block">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-75">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-6 w-6 fill-text-body"
          >
            <path d="M19.023 16.977a35.13 35.13 0 0 1-1.367-1.384c-.372-.378-.596-.653-.596-.653l-2.8-1.337A6.962 6.962 0 0 0 16 9c0-3.859-3.14-7-7-7S2 5.141 2 9s3.14 7 7 7c1.763 0 3.37-.66 4.603-1.739l1.337 2.8s.275.224.653.596c.387.363.896.854 1.384 1.367l1.358 1.392.604.646 2.121-2.121-.646-.604c-.379-.372-.885-.866-1.391-1.36zM9 14c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"></path>
          </svg>
        </span>
        <input
          className="block w-full rounded border border-border-base border-opacity-40 bg-bg-body py-1 pl-8 pr-3 placeholder:italic placeholder:text-opacity-75 focus:border-border-base focus:outline-none"
          placeholder="Search for blog posts"
          type="text"
          name="search"
          value={searchKey}
          onChange={(e) => setSearchKey(e.currentTarget.value)}
          autoComplete="off"
          autoFocus
          ref={inputRef}
        />
      </label>
      <div className="mt-2">
        <ul>
          {searchResult.map((item) => (
            <li key={item.item.id}>
              <BlogItem item={item.item} />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

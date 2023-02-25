import { navLinks } from '@config'
import classNames from 'classnames'
import { Popover } from '@headlessui/react'
import type { AnchorHTMLAttributes } from 'react'

function HeaderLink({
  href,
  className,
  children,
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const path = (() => {
    if (import.meta.env.SSR) {
      return undefined
    } else {
      return window.location.pathname
    }
  })()
  const isHome = href === '/' && path === '/'
  const isOtherPages =
    typeof href === 'string' && href.length > 1
      ? path?.substring(1).startsWith(href.substring(1))
      : false
  const isActive = isHome || isOtherPages
  const classList = classNames([
    className,
    { show: isActive },
    'unset animated-link',
  ])
  return (
    <a href={href} className={classList}>
      {children}
    </a>
  )
}

export default function Nav() {
  const headerLinks = navLinks.map(({ name, href }) => (
    <li key={name}>
      <HeaderLink href={href}>{name}</HeaderLink>
    </li>
  ))

  return (
    <>
      <nav className="hidden md:inline">
        <section className="text-text-bold">
          <ul className="unset flex gap-4 [&>li]:p-0">{headerLinks}</ul>
        </section>
      </nav>
      <nav className="md:hidden">
        <Popover>
          <Popover.Button>
            <i
              className="fa-solid fa-bars"
              aria-hidden="true"
              title="Open mobile menu"
            ></i>
            <span className="fa-sr-only">Open mobile menu</span>
          </Popover.Button>
          <Popover.Panel>
            <section
              id="mobile-menu"
              className="hide-menu fixed top-0 left-0 z-10 h-full w-full border-primary-blue bg-black/75 transition-transform"
            >
              <div className="h-full w-[75%] bg-bg-body drop-shadow-2xl">
                <button
                  id="mobile-menu-close"
                  className="xml-[1px] h-[5rem] px-6 text-lg"
                >
                  <i
                    className="fa-solid fa-xmark"
                    aria-hidden="true"
                    title="Close mobile menu"
                  ></i>
                  <span className="fa-sr-only">Close mobile menu</span>
                </button>
                <ul className="unset flex flex-col gap-4 px-6 text-text-bold [&>li]:p-0">
                  {headerLinks}
                </ul>
              </div>
            </section>
          </Popover.Panel>
        </Popover>
      </nav>
    </>
  )
}

import { useEffect, useState } from 'react'
import { FaGithub, FaLinkedin } from 'react-icons/fa'
import type { Resume } from '../../types/resume'

// Section anchors for the in-page nav.
const NAV_LINKS = [
  { label: 'Experience', href: '#experience' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Under the Hood', href: '#under-the-hood' },
]

export function Nav({ resume }: { resume: Resume }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { name, social } = resume.personal

  // Nav has no bottom border at the top of the page; once content scrolls under
  // it, a border fades in via CSS transition (CLAUDE.md → Scroll Behavior #4).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll() // set initial state (e.g. on reload mid-page)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-bg transition-colors duration-200 ${
        scrolled ? 'border-line' : 'border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <a href="#top" className="text-[17px] font-medium text-text-primary">
          {name}
        </a>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Section links — desktop only (hamburger on mobile) */}
          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Social links — always visible; text labels collapse to icons on mobile */}
          <div className="flex items-center gap-4">
            <a
              href={social.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Repository"
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <FaGithub className="h-4 w-4" />
              <span className="hidden sm:inline">Repo</span>
            </a>
            <a
              href={social.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="LinkedIn"
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <FaLinkedin className="h-4 w-4" />
              <span className="hidden sm:inline">LinkedIn</span>
            </a>
          </div>

          {/* Mobile hamburger (< 768px) */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary transition-colors hover:text-text-primary md:hidden"
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </nav>

      {/* Mobile menu panel — section links only (social icons live in the bar) */}
      {menuOpen && (
        <div className="border-t border-line bg-bg px-6 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  )
}

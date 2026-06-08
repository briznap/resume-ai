import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaDownload, FaGithub, FaLinkedin } from 'react-icons/fa'
import type { Resume } from '../../types/resume'

// In-page section anchors (left/content group). They point at "/#id" so they
// work from any route — on the home page the browser scrolls in place; from a
// subpage they navigate home and then jump to the section.
const SECTION_LINKS = [
  { label: 'Experience', href: '/#experience' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Education', href: '/#education' },
]

const linkClass = 'text-sm text-text-secondary transition-colors hover:text-text-primary'
const iconLinkClass = 'text-text-secondary transition-colors hover:text-text-primary'

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

  const closeMenu = () => setMenuOpen(false)

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-bg transition-colors duration-200 ${
        scrolled ? 'border-line' : 'border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        {/* Name + LinkedIn (icon-only, 8px gap), far left */}
        <div className="flex items-center gap-2">
          <Link to="/" className="text-[17px] font-medium text-text-primary">
            {name}
          </Link>
          <a
            href={social.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="LinkedIn"
            className={`hidden md:inline-flex ${iconLinkClass}`}
          >
            <FaLinkedin className="h-4 w-4" />
          </a>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Left group — content navigation (desktop) */}
          <div className="hidden items-center gap-7 md:flex">
            {SECTION_LINKS.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ))}
            <Link to="/about" className={linkClass}>
              About
            </Link>
          </div>

          {/* Subtle vertical divider between the two groups (desktop) */}
          <span aria-hidden="true" className="hidden h-3.5 w-px bg-line md:block" />

          {/* Right group — meta & external (desktop) */}
          <div className="hidden items-center gap-5 md:flex">
            <Link to="/under-the-hood" className={linkClass}>
              Under the Hood
            </Link>
            <a
              href={social.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              className={iconLinkClass}
            >
              <FaGithub className="h-4 w-4" />
            </a>
            <a
              href="/brad-belnap-resume.pdf"
              download
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <FaDownload className="h-3.5 w-3.5" /> Résumé
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

      {/* Mobile menu — all links in one list, the two groups split by an <hr>. */}
      {menuOpen && (
        <div className="border-t border-line bg-bg px-6 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {/* LinkedIn near the top, labeled */}
            <a
              href={social.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              onClick={closeMenu}
              className="inline-flex items-center gap-2 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <FaLinkedin className="h-4 w-4" /> LinkedIn
            </a>

            {SECTION_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/about"
              onClick={closeMenu}
              className="py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              About
            </Link>

            <hr className="my-2 border-line" />

            <Link
              to="/under-the-hood"
              onClick={closeMenu}
              className="py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Under the Hood
            </Link>
            <a
              href={social.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              onClick={closeMenu}
              className="inline-flex items-center gap-2 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <FaGithub className="h-4 w-4" /> GitHub
            </a>
            <a
              href="/brad-belnap-resume.pdf"
              download
              onClick={closeMenu}
              className="inline-flex items-center gap-2 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <FaDownload className="h-4 w-4" /> Résumé
            </a>
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

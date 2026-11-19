import { Fragment, useState } from 'react'

const LINKS = ['Labs', 'Studio', 'Openings', 'Shop']

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 z-10 flex w-full items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 text-white">
          <span
            className="text-[21px] tracking-tight sm:text-[26px]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Mainframe&reg;
          </span>
          <span
            className="select-none text-[25px] sm:text-[30px]"
            style={{ letterSpacing: '-0.02em' }}
            aria-hidden="true"
          >
            ✳︎
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden text-[23px] text-white md:flex">
          {LINKS.map((label, i) => (
            <Fragment key={label}>
              <a href="#" className="transition-opacity hover:opacity-60">
                {label}
              </a>
              {i < LINKS.length - 1 && <span className="whitespace-pre">, </span>}
            </Fragment>
          ))}
        </div>

        {/* Desktop CTA */}
        <a
          href="mailto:hello@mainframe.co"
          className="hidden text-[23px] text-white underline underline-offset-2 transition-opacity hover:opacity-60 md:inline"
        >
          Get in touch
        </a>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="relative z-10 flex flex-col gap-[5px] p-1 md:hidden"
        >
          <span
            className={`block h-[2px] w-6 bg-white transition-all duration-300 ${
              open ? 'translate-y-[7px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-[2px] w-6 bg-white transition-all duration-300 ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`block h-[2px] w-6 bg-white transition-all duration-300 ${
              open ? '-translate-y-[7px] -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className="fixed inset-0 z-[9] flex flex-col items-start justify-center gap-8 bg-black/90 px-8 backdrop-blur-md transition-opacity duration-300 md:hidden"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        aria-hidden={!open}
      >
        {LINKS.map((label) => (
          <a
            key={label}
            href="#"
            onClick={() => setOpen(false)}
            className="text-[32px] font-medium text-white transition-opacity hover:opacity-60"
          >
            {label}
          </a>
        ))}
        <a
          href="mailto:hello@mainframe.co"
          onClick={() => setOpen(false)}
          className="text-[32px] font-medium text-white underline underline-offset-2 transition-opacity hover:opacity-60"
        >
          Get in touch
        </a>
      </div>
    </>
  )
}

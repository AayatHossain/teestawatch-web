import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/floods', label: 'Floods' },
  { to: '/river', label: 'Riverbank' },
  { to: '/villages', label: 'Villages' },
  { to: '/how', label: 'How it works' },
]

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-8 w-8">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="#0b1324" />
        <path d="M14 10c10 8 2 16 12 22s14 8 10 22" fill="none" stroke="url(#lg)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="46" cy="18" r="5" fill="#f97316" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-white">
        Teesta<span className="text-flood-400">Watch</span>
      </span>
    </span>
  )
}

export default function Nav() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24)
    f()
    window.addEventListener('scroll', f)
    return () => window.removeEventListener('scroll', f)
  }, [])
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`flex w-full max-w-6xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 ${
          scrolled || pathname !== '/' ? 'border border-white/10 bg-ink-900/70 shadow-2xl backdrop-blur-xl' : 'border border-transparent'
        }`}
      >
        <NavLink to="/" aria-label="TeestaWatch home">
          <Logo />
        </NavLink>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = l.to === '/' ? pathname === '/' : pathname.startsWith(l.to)
            return (
              <li key={l.to} className="relative">
                <NavLink to={l.to} className={`relative z-10 block rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? 'text-ink-950' : 'text-slate-300 hover:text-white'}`}>
                  {l.label}
                </NavLink>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-flood-300 to-river-400 shadow-glow"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </li>
            )
          })}
        </ul>
        <button className="rounded-full p-2 text-slate-200 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <motion.ul
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong absolute top-20 w-[calc(100%-2rem)] max-w-md p-3 md:hidden"
        >
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className="block rounded-2xl px-4 py-3 text-base text-slate-200 hover:bg-white/5">
                {l.label}
              </NavLink>
            </li>
          ))}
        </motion.ul>
      )}
    </motion.header>
  )
}

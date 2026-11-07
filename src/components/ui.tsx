import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'

/** Number that counts up the first time it scrolls into view. */
export function Counter({ value, decimals = 0, duration = 2, suffix = '', className = '' }: { value: number; decimals?: number; duration?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix)
  useEffect(() => {
    if (inView) {
      const c = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] })
      return () => c.stop()
    }
  }, [inView, value, duration, mv])
  useEffect(() => {
    if (!inView) mv.set(0)
  }, [inView, mv])
  return <motion.span ref={ref} className={className}>{text}</motion.span>
}

/** Fades and lifts children into view. */
export function Reveal({ children, delay = 0, y = 28, className = '' }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Slow-moving coloured glows behind a page. */
export function Aurora({ tone = 'cool' }: { tone?: 'cool' | 'warm' | 'mixed' }) {
  const a = tone === 'warm' ? 'bg-erosion-500/25' : 'bg-river-500/25'
  const b = tone === 'cool' ? 'bg-flood-400/20' : tone === 'warm' ? 'bg-rose-500/20' : 'bg-erosion-500/20'
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className={`absolute -left-[15%] -top-[20%] h-[70vmax] w-[70vmax] rounded-full blur-[140px] ${a} animate-drift`} />
      <div className={`absolute -bottom-[25%] -right-[10%] h-[60vmax] w-[60vmax] rounded-full blur-[150px] ${b} animate-drift2`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
    </div>
  )
}

export function SectionTitle({ kicker, title, sub, warm = false }: { kicker: string; title: ReactNode; sub?: ReactNode; warm?: boolean }) {
  return (
    <Reveal className="max-w-3xl">
      <div className={`label mb-3 ${warm ? 'text-erosion-400' : 'text-flood-300'}`}>{kicker}</div>
      <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg leading-relaxed text-slate-400">{sub}</p>}
    </Reveal>
  )
}

/** Card that tilts towards the cursor. */
export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect()
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 10)
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10)
      }}
      onMouseLeave={() => {
        animate(rx, 0, { duration: 0.6 })
        animate(ry, 0, { duration: 0.6 })
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {children}
    </motion.div>
  )
}

export function Legend({ items }: { items: { color: string; label: string; ring?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-2 text-sm text-slate-300">
          <span className={`h-3 w-3 rounded-full ${i.ring ? 'ring-2 ring-offset-2 ring-offset-ink-900' : ''}`} style={{ background: i.color, boxShadow: `0 0 12px ${i.color}` }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { CalendarDays, Pause, Play } from 'lucide-react'
import type { Map as MLMap } from 'maplibre-gl'
import MapView from '../components/MapView'
import { Counter, Legend } from '../components/ui'
import { loadJSON, useStats, fmt, type Stats } from '../lib/data'
import { addImage, setOpacity } from '../lib/map'

const day = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Floods() {
  const s = useStats()
  const map = useRef<MLMap | null>(null)
  const [ready, setReady] = useState(false)
  const [sel, setSel] = useState(1) // July 2020, the largest
  const [phase, setPhase] = useState<'before' | 'after'>('after')
  const [auto, setAuto] = useState(true)

  const onLoad = async (m: MLMap) => {
    map.current = m
    const st = await loadJSON<Stats>('data/stats.json')
    st.floods.forEach((f) => {
      addImage(m, `${f.id}_before`, `flood/${f.id}_before.png`, st.overlays[`flood/${f.id}_before.png`], 0)
      addImage(m, `${f.id}_after`, `flood/${f.id}.png`, st.overlays[`flood/${f.id}.png`], 0)
    })
    setReady(true)
  }

  // show the selected event and phase
  useEffect(() => {
    if (!ready || !s || !map.current) return
    s.floods.forEach((f, i) => {
      setOpacity(map.current!, `${f.id}_before`, i === sel && phase === 'before' ? 0.95 : 0)
      setOpacity(map.current!, `${f.id}_after`, i === sel && phase === 'after' ? 0.95 : 0)
    })
  }, [ready, s, sel, phase])

  // gentle before/after loop
  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => setPhase((p) => (p === 'before' ? 'after' : 'before')), 2600)
    return () => clearInterval(t)
  }, [auto])

  const ev = s?.floods[sel]

  return (
    <section className="relative h-[100svh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <MapView onLoad={onLoad} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/80 via-ink-950/10 to-transparent" />

      <motion.aside
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong absolute bottom-3 left-3 right-3 top-[46svh] z-10 flex flex-col overflow-y-auto p-4 md:bottom-4 md:left-4 md:right-auto md:top-24 md:w-[min(400px,calc(100%-2rem))] md:p-6"
      >
        <div className="label text-flood-300">Flood maps</div>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-white md:mt-2 md:text-3xl">Where the water went</h1>

        <div className="mt-6 grid grid-cols-4 gap-2">
          {s?.floods.map((f, i) => (
            <button
              key={f.id}
              onClick={() => {
                setSel(i)
                setPhase('after')
              }}
              className={`relative rounded-2xl px-2 py-3 text-center transition-colors ${i === sel ? 'text-ink-950' : 'text-slate-300 hover:bg-white/5'}`}
            >
              {i === sel && <motion.span layoutId="flood-pill" className="absolute inset-0 rounded-2xl bg-gradient-to-br from-flood-300 to-river-400 shadow-glow" />}
              <span className="relative block font-display text-lg font-semibold">{f.label.split(' ')[1]}</span>
              <span className="relative block text-[11px] opacity-80">{f.label.split(' ')[0].slice(0, 3)}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {ev && (
            <motion.div key={ev.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }}>
              <div className="mt-7">
                <div className="label">Newly flooded land</div>
                <div className="mt-1 font-display text-6xl font-semibold tracking-tight text-gradient">
                  <Counter value={ev.new_water_km2} duration={1.4} />
                  <span className="ml-2 text-2xl text-slate-300">km²</span>
                </div>
                <div className="mt-1 text-sm text-slate-400">about {fmt(Math.round(ev.new_water_km2 * 100))} hectares under water</div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className={`rounded-2xl border p-4 transition-colors ${phase === 'before' ? 'border-river-400/60 bg-river-500/10' : 'border-white/10'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400"><CalendarDays size={13} /> Before · {day(ev.before)}</div>
                  <div className="mt-1 font-display text-2xl font-semibold text-white">{fmt(ev.water_before_km2)} km²</div>
                  <div className="text-xs text-slate-500">water</div>
                </div>
                <div className={`rounded-2xl border p-4 transition-colors ${phase === 'after' ? 'border-flood-400/60 bg-flood-400/10' : 'border-white/10'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400"><CalendarDays size={13} /> During · {day(ev.after)}</div>
                  <div className="mt-1 font-display text-2xl font-semibold text-white">{fmt(ev.water_after_km2)} km²</div>
                  <div className="text-xs text-slate-500">water</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
          {(['before', 'after'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setAuto(false)
                setPhase(p)
              }}
              className={`relative flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${phase === p ? 'text-ink-950' : 'text-slate-300'}`}
            >
              {phase === p && <motion.span layoutId="phase-pill" className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span className="relative">{p === 'before' ? 'Before' : 'During flood'}</span>
            </button>
          ))}
          <button onClick={() => setAuto(!auto)} className="rounded-full p-2 text-slate-200 hover:bg-white/10" aria-label={auto ? 'Pause' : 'Play'}>
            {auto ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>

        <div className="mt-5">
          <Legend items={[{ color: '#2563eb', label: 'River water' }, { color: '#22d3ee', label: 'Flood water' }]} />
        </div>

        {s && (
          <div className="mt-8">
            <div className="label mb-2">New flood water by event (km²)</div>
            <div className="h-36">
              <ResponsiveContainer>
                <BarChart data={s.floods} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="label" tickFormatter={(v: string) => v.split(' ')[1]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{ background: '#0b1324', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                    formatter={(v: number) => [`${fmt(v)} km²`, 'New flood water']}
                  />
                  <Bar dataKey="new_water_km2" radius={[8, 8, 4, 4]} animationDuration={1200} onClick={(_, i) => setSel(i)} className="cursor-pointer">
                    {s.floods.map((f, i) => (
                      <Cell key={f.id} fill={i === sel ? '#22d3ee' : 'rgba(56,189,248,0.28)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </motion.aside>
    </section>
  )
}

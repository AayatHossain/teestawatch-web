import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Area, AreaChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Pause, Play, Sparkles } from 'lucide-react'
import type { Map as MLMap } from 'maplibre-gl'
import MapView from '../components/MapView'
import { Counter, Legend } from '../components/ui'
import { loadJSON, useStats, fmt, type Stats } from '../lib/data'
import { addImage, setOpacity } from '../lib/map'

const YEARS = Array.from({ length: 11 }, (_, i) => 2016 + i)
const FORECAST = 2027

export default function River() {
  const s = useStats()
  const map = useRef<MLMap | null>(null)
  const focus = useRef<[number, number]>([89.3, 25.95])
  const [ready, setReady] = useState(false)
  const [year, setYear] = useState(2016)
  const [playing, setPlaying] = useState(true)

  const onLoad = async (m: MLMap) => {
    map.current = m
    const st = await loadJSON<Stats>('data/stats.json')
    YEARS.forEach((y) => addImage(m, `y${y}`, `river/${y}.png`, st.overlays[`river/${y}.png`], 0))
    addImage(m, 'now', 'river/channel_2026.png', st.overlays['river/channel_2026.png'], 0)
    addImage(m, 'halo', 'river/forecast_2027_halo.png', st.overlays['river/forecast_2027_halo.png'], 0)
    addImage(m, 'forecast', 'river/forecast_2027.png', st.overlays['river/forecast_2027.png'], 0)
    focus.current = st.forecast_2027.focus
    m.easeTo({ pitch: 35, zoom: m.getZoom() + 0.3, duration: 2500 })
    setReady(true)
  }

  useEffect(() => {
    if (!ready || !map.current) return
    const f = year === FORECAST
    YEARS.forEach((y) => setOpacity(map.current!, `y${y}`, !f && y === year ? 0.92 : 0))
    setOpacity(map.current, 'now', f ? 0.85 : 0)
    setOpacity(map.current, 'halo', f ? 1 : 0)
    setOpacity(map.current, 'forecast', f ? 1 : 0)
  }, [ready, year])

  // fly to the stretch with the most predicted erosion for the forecast, back out for the history
  useEffect(() => {
    const m = map.current
    if (!ready || !m) return
    if (year === FORECAST) m.flyTo({ center: focus.current, zoom: 11.2, pitch: 50, bearing: -25, duration: 2600 })
    else if (year === 2016) m.easeTo({ center: [89.29, 25.86], zoom: 8.9, pitch: 35, bearing: 0, duration: 2200 })
  }, [ready, year])

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setYear((y) => (y >= FORECAST ? 2016 : y + 1)), year === FORECAST ? 4200 : 1400)
    return () => clearInterval(t)
  }, [playing, year])

  const lost = s?.land_lost_by_year.find((r) => r.year === year)?.ha ?? 0
  const cumulative = s
    ? year >= 2026
      ? s.land_lost_total_ha
      : s.land_lost_by_year.filter((r) => r.year <= year).reduce((a, r) => a + r.ha, 0)
    : 0
  const isF = year === FORECAST

  // The slider thumb (22 px, see .slider in index.css) travels from 11 px to (width - 11 px),
  // so a year's label is centred at 11px + (100% - 22px) * fraction-of-the-range.
  const tick = (y: number) => (
    <button
      key={y}
      onClick={() => {
        setPlaying(false)
        setYear(y)
      }}
      style={{ left: `calc(11px + (100% - 22px) * ${(y - 2016) / (FORECAST - 2016)})` }}
      className={`absolute top-0 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap transition-colors hover:text-white ${y === year ? 'text-white' : ''} ${y === FORECAST ? 'text-rose-400' : ''}`}
    >
      {y === FORECAST && <Sparkles size={10} />}
      {y}
    </button>
  )

  return (
    <section className="relative h-[100svh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <MapView onLoad={onLoad} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-ink-950/40" />

      {/* stats card */}
      <motion.aside
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong absolute left-3 right-3 top-20 z-10 p-4 md:left-auto md:right-4 md:top-24 md:w-[min(360px,calc(100%-2rem))] md:p-6"
      >
        <div className={`label ${isF ? 'text-rose-400' : 'text-erosion-400'}`}>{isF ? 'Next year' : 'Riverbank & erosion'}</div>
        <AnimatePresence mode="wait">
          <motion.div key={isF ? 'f' : 'p'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
            {isF && s ? (
              <>
                <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-white md:mt-2 md:text-3xl">Where the river strikes next</h1>
                <div className="mt-4 grid grid-cols-2 gap-3 md:mt-6">
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4">
                    <div className="font-display text-3xl font-semibold text-white"><Counter value={s.forecast_2027.high_ha} /> ha</div>
                    <div className="text-xs text-rose-200">high-risk land</div>
                  </div>
                  <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4">
                    <div className="font-display text-3xl font-semibold text-white"><Counter value={s.forecast_2027.medium_ha} /> ha</div>
                    <div className="text-xs text-amber-200">medium-risk land</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-400 md:mt-5">
                  Our deep-learning forecast reads ten years of satellite history to predict the land most likely to be lost over the next year — about{' '}
                  <span className="font-semibold text-white">{fmt(s.forecast_2027.expected_ha)} ha</span> in total.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-white md:mt-2 md:text-3xl">A river on the move</h1>
                <div className="mt-4 md:mt-6">
                  <div className="label">Land taken in {year}</div>
                  <div className="mt-1 font-display text-4xl font-semibold tracking-tight text-gradient-warm md:text-5xl">
                    {year === 2016 ? '—' : <><Counter key={year} value={lost} duration={1} /> <span className="text-xl text-slate-300">ha</span></>}
                  </div>
                </div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 md:mt-4 md:p-4">
                  <div className="text-xs text-slate-400">Total since 2016</div>
                  <div className="font-display text-2xl font-semibold text-white">{fmt(cumulative)} ha</div>
                  <div className="text-xs text-slate-500">≈ {fmt(Math.round(cumulative * 1.4))} football pitches</div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 md:mt-5">
          {isF ? (
            <Legend items={[{ color: '#ef4444', label: 'High risk' }, { color: '#facc15', label: 'Medium risk' }, { color: '#38bdf8', label: 'River today' }]} />
          ) : (
            <Legend items={[{ color: '#38bdf8', label: 'River channel' }, { color: '#f97316', label: 'Land lost since 2016' }]} />
          )}
        </div>
      </motion.aside>

      {/* timeline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3 md:bottom-4 md:px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong pointer-events-auto w-full max-w-[980px] p-3 md:p-5"
      >
        <div className="flex items-center gap-3 md:gap-5">
          <button
            onClick={() => setPlaying(!playing)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-flood-300 to-river-500 text-ink-950 shadow-glow transition-transform hover:scale-105 md:h-12 md:w-12"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <div className="w-[4.5rem] shrink-0 md:w-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={year}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`font-display text-3xl font-semibold md:text-4xl ${isF ? 'text-rose-400' : 'text-white'}`}
              >
                {year}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={2016}
              max={FORECAST}
              value={year}
              onChange={(e) => {
                setPlaying(false)
                setYear(+e.target.value)
              }}
              className="slider w-full"
              aria-label="Year"
            />
            {/* year labels sit exactly under the slider position for that year
                (phones: four marks spaced so labels never collide; md and up: every year) */}
            <div className="relative mt-2 h-4 text-[11px] text-slate-500 md:hidden">{[2016, 2020, 2024, FORECAST].map(tick)}</div>
            <div className="relative mt-2 hidden h-4 text-[11px] text-slate-500 md:block">{[...YEARS, FORECAST].map(tick)}</div>
          </div>
        </div>
        {s && (
          <div className="mt-3 hidden h-20 md:block">
            <ResponsiveContainer>
              <AreaChart data={s.land_lost_by_year} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="lostg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" hide />
                <Tooltip
                  contentStyle={{ background: '#0b1324', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                  formatter={(v: number) => [`${fmt(v)} ha`, 'Land taken']}
                />
                <Area type="monotone" dataKey="ha" stroke="#fb923c" strokeWidth={2} fill="url(#lostg)" animationDuration={1500} />
                {!isF && year > 2016 && <ReferenceDot x={year} y={lost} r={6} fill="#fff" stroke="#f97316" strokeWidth={3} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
      </div>
    </section>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import maplibregl, { type Map as MLMap } from 'maplibre-gl'
import { Home as HomeIcon, MapPin, Ruler, Search, Users, X } from 'lucide-react'
import MapView from '../components/MapView'
import { Counter } from '../components/ui'
import { asset, useStats, useVillages, fmt, TEESTA_BOUNDS, type Village } from '../lib/data'

const isPhone = () => window.innerWidth < 768 // Tailwind md breakpoint, where the panel becomes a bottom sheet

/** Map padding so the camera centres on the part of the map that is not under the panel.
 *  Phones: the panel covers the lower part of the screen, so pad the bottom by its height.
 *  md and up: no padding (desktop behaviour unchanged). */
function viewPadding() {
  if (!isPhone()) return { top: 0, bottom: 0, left: 0, right: 0 }
  const panelTop = document.querySelector('aside')?.getBoundingClientRect().top ?? window.innerHeight * 0.46
  return { top: 72, bottom: Math.max(0, Math.round(window.innerHeight - panelTop)) + 8, left: 12, right: 12 }
}

/** Pixel offset that puts a flyTo target in the middle of the visible strip. An offset (unlike flyTo's `padding`,
 *  which MapLibre keeps for later camera moves) applies to this move only, so the zoom-out on close still works. */
function viewOffset(): [number, number] {
  const p = viewPadding()
  return [(p.left - p.right) / 2, (p.top - p.bottom) / 2]
}

const RISK_COLOR = { High: '#ef4444', Medium: '#facc15', Low: '#34d399' } as const
const ORDER = { High: 0, Medium: 1, Low: 2 } as const

function Ring({ value, label, color, delay }: { value: number; label: string; color: string; delay: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1.3, delay, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="-mt-[52px] mb-[22px] font-display text-lg font-semibold text-white">
        <Counter value={Math.round(value * 100)} suffix="%" duration={1.3} />
      </div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  )
}

export default function Villages() {
  const villages = useVillages()
  const s = useStats()
  const map = useRef<MLMap | null>(null)
  const marker = useRef<maplibregl.Marker | null>(null)
  const [ready, setReady] = useState(false)
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const [sel, setSel] = useState<Village | null>(null)
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All')

  const fuse = useMemo(
    () => (villages ? new Fuse(villages, { keys: [{ name: 'name', weight: 2 }, 'union', 'upazila', 'district'], threshold: 0.35, ignoreLocation: true }) : null),
    [villages],
  )
  const results = useMemo(() => {
    if (!fuse || q.trim().length < 2) return []
    return fuse
      .search(q, { limit: 40 })
      .map((r) => r.item)
      .sort((a, b) => ORDER[a.risk] - ORDER[b.risk] || b.p5 - a.p5)
      .slice(0, 8)
  }, [fuse, q])
  const top = useMemo(
    () => (villages ? [...villages].filter((v) => v.risk === 'High').sort((a, b) => b.exp5 - a.exp5).slice(0, 6) : []),
    [villages],
  )

  const onLoad = (m: MLMap) => {
    map.current = m
    m.addSource('villages', { type: 'geojson', data: asset('data/villages.geojson') })
    m.addSource('houses', { type: 'geojson', data: asset('data/houses.geojson') })
    m.addSource('riverline', { type: 'geojson', data: asset('data/river_line.geojson') })
    m.addLayer({ id: 'riverline', type: 'line', source: 'riverline', paint: { 'line-color': '#38bdf8', 'line-width': 1.4, 'line-opacity': 0.7, 'line-blur': 0.5 } }, 'labels')
    m.addLayer(
      {
        id: 'v-glow',
        type: 'circle',
        source: 'villages',
        filter: ['!=', ['get', 'risk'], 'Low'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 13, 18],
          'circle-color': ['match', ['get', 'risk'], 'High', '#ef4444', '#facc15'],
          'circle-opacity': 0.12,
          'circle-blur': 1,
        },
      },
      'labels',
    )
    m.addLayer(
      {
        id: 'villages',
        type: 'circle',
        source: 'villages',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, ['match', ['get', 'risk'], 'High', 3.4, 'Medium', 2.8, 1.1], 14, ['match', ['get', 'risk'], 'High', 10, 'Medium', 8, 6]],
          'circle-color': ['match', ['get', 'risk'], 'High', '#ef4444', 'Medium', '#facc15', '#34d399'],
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 8, ['match', ['get', 'risk'], 'Low', 0.3, 0.95], 12, ['match', ['get', 'risk'], 'Low', 0.7, 0.95]],
          'circle-stroke-color': 'rgba(3,6,13,0.8)',
          'circle-stroke-width': 0.8,
        },
        layout: { 'circle-sort-key': ['match', ['get', 'risk'], 'High', 3, 'Medium', 2, 1] },
      },
      'labels',
    )
    m.addLayer(
      {
        id: 'houses',
        type: 'circle',
        source: 'houses',
        minzoom: 12.5,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12.5, 1.5, 17, 6],
          'circle-color': ['interpolate', ['linear'], ['get', 'p5'], 0.05, '#facc15', 0.5, '#f97316', 0.9, '#ef4444'],
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 12.5, 0, 13.2, 0.9],
        },
      },
      'labels',
    )
    m.on('mouseenter', 'villages', () => (m.getCanvas().style.cursor = 'pointer'))
    m.on('mouseleave', 'villages', () => (m.getCanvas().style.cursor = ''))
    m.on('click', 'villages', (e) => {
      const f = e.features?.[0]
      if (!f) return
      const p = f.properties as unknown as Village
      const [lon, lat] = (f.geometry as unknown as { coordinates: [number, number] }).coordinates
      setSel({ ...p, lon, lat })
    })
    // phones: start with the whole river in the visible top part of the screen
    if (isPhone()) m.fitBounds(TEESTA_BOUNDS, { padding: viewPadding(), duration: 0 })
    setReady(true)
  }

  useEffect(() => {
    if (!ready || !map.current) return
    const f = filter === 'All' ? null : ['==', ['get', 'risk'], filter]
    map.current.setFilter('villages', f as never)
    map.current.setFilter('v-glow', (filter === 'All' ? ['!=', ['get', 'risk'], 'Low'] : filter === 'Low' ? ['==', 1, 0] : ['==', ['get', 'risk'], filter]) as never)
  }, [ready, filter])

  useEffect(() => {
    const m = map.current
    if (!m || !sel) return
    m.flyTo({ center: [sel.lon, sel.lat], zoom: 14.2, pitch: 50, bearing: -15, duration: 2600, essential: true, offset: viewOffset() })
    marker.current?.remove()
    const el = document.createElement('div')
    el.className = 'relative h-5 w-5'
    el.innerHTML = `<span class="absolute inset-0 rounded-full animate-pulseRing" style="background:${RISK_COLOR[sel.risk]}"></span><span class="absolute inset-[3px] rounded-full border-2 border-white" style="background:${RISK_COLOR[sel.risk]}"></span>`
    marker.current = new maplibregl.Marker({ element: el }).setLngLat([sel.lon, sel.lat]).addTo(m)
  }, [sel])

  const clear = () => {
    setSel(null)
    marker.current?.remove()
    const m = map.current
    if (!m) return
    if (isPhone()) m.fitBounds(TEESTA_BOUNDS, { padding: viewPadding(), pitch: 0, bearing: 0, duration: 2200 })
    else m.flyTo({ center: [89.29, 25.86], zoom: 8.9, pitch: 0, bearing: 0, duration: 2200 })
  }

  return (
    <section className="relative h-[100svh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <MapView onLoad={onLoad} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/80 via-ink-950/5 to-transparent" />

      <motion.aside
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong absolute bottom-3 left-3 right-3 top-[46svh] z-10 flex flex-col p-4 md:bottom-4 md:left-4 md:right-auto md:top-24 md:w-[min(420px,calc(100%-2rem))] md:p-6"
      >
        <div className="label text-rose-400">Villages at risk</div>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-white md:mt-2 md:text-3xl">Is the river coming?</h1>

        <div className="relative mt-3 md:mt-5">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 150)}
            placeholder="Search a village, union or upazila"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-flood-400/60 focus:bg-white/10 focus:shadow-glow"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-white" aria-label="Clear search">
              <X size={16} />
            </button>
          )}
          {focus && q.trim().length >= 2 && results.length === 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-white/10 bg-ink-800/95 px-4 py-3 text-sm text-slate-400 backdrop-blur-xl">
              No village found. Try another spelling, or a union or upazila name.
            </div>
          )}
          <AnimatePresence>
            {focus && results.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-ink-800/95 backdrop-blur-xl"
              >
                {results.map((v) => (
                  <li key={v.id}>
                    <button
                      onMouseDown={() => {
                        setSel(v)
                        setQ('')
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: RISK_COLOR[v.risk], boxShadow: `0 0 10px ${RISK_COLOR[v.risk]}` }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{v.name}</span>
                        <span className="block truncate text-xs text-slate-500">{[v.union, v.upazila, v.district].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className="text-xs text-slate-400">{v.risk}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex flex-wrap gap-1 md:mt-4 md:gap-1.5">
          {(['All', 'High', 'Medium', 'Low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1.5 text-[11px] font-semibold transition-all md:gap-1.5 md:px-2.5 md:text-xs ${
                filter === f ? 'border-white/30 bg-white/15 text-white' : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {f !== 'All' && <span className="h-2 w-2 rounded-full" style={{ background: RISK_COLOR[f] }} />}
              {f}
              {s && f !== 'All' && <span className="text-slate-500">{fmt(s.risk_counts[f])}</span>}
            </button>
          ))}
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            {sel ? (
              <motion.div key={sel.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-ink-950" style={{ background: RISK_COLOR[sel.risk] }}>
                        {sel.risk} risk
                      </span>
                    </div>
                    <h2 className="mt-2 truncate font-display text-2xl font-semibold text-white">{sel.name}</h2>
                    <p className="flex items-center gap-1 text-sm text-slate-400">
                      <MapPin size={13} /> {[sel.union, sel.upazila, sel.district].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <button onClick={clear} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-6">
                  <div className="label mb-3">Chance the river reaches it</div>
                  <div className="grid grid-cols-3">
                    <Ring value={sel.p1} label="within 1 year" color="#facc15" delay={0} />
                    <Ring value={sel.p3} label="within 3 years" color="#fb923c" delay={0.15} />
                    <Ring value={sel.p5} label="within 5 years" color="#ef4444" delay={0.3} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <HomeIcon size={15} className="text-slate-400" />
                    <div className="mt-1 font-display text-xl font-semibold text-white">{fmt(sel.houses)}</div>
                    <div className="text-[11px] text-slate-500">homes</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Ruler size={15} className="text-slate-400" />
                    <div className="mt-1 font-display text-xl font-semibold text-white">{sel.dist_m < 1000 ? `${fmt(sel.dist_m)} m` : `${(sel.dist_m / 1000).toFixed(1)} km`}</div>
                    <div className="text-[11px] text-slate-500">to the river</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Users size={15} className="text-slate-400" />
                    <div className="mt-1 font-display text-xl font-semibold text-white">{fmt(Math.round(sel.exp5))}</div>
                    <div className="text-[11px] text-slate-500">homes in reach by 5 yr</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {s && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                      <div className="font-display text-3xl font-semibold text-white"><Counter value={s.houses_p5_over_50} /></div>
                      <div className="text-xs text-rose-200">homes with a better-than-even chance of meeting the river in 5 years</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="font-display text-3xl font-semibold text-white"><Counter value={s.houses_analysed} /></div>
                      <div className="text-xs text-slate-400">homes analysed across {fmt(s.settlements)} settlements</div>
                    </div>
                  </div>
                )}
                <div className="label mb-2 mt-6">Most exposed settlements</div>
                <ul className="space-y-1.5">
                  {top.map((v, i) => (
                    <motion.li key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                      <button onClick={() => setSel(v)} className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left transition hover:border-white/10 hover:bg-white/5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-rose-500/15 font-display text-sm font-semibold text-rose-300">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{v.name}</span>
                          <span className="block truncate text-xs text-slate-500">{fmt(v.houses)} homes · {v.upazila}</span>
                        </span>
                        <span className="text-right">
                          <span className="block text-sm font-semibold text-rose-300">{fmt(Math.round(v.exp5))}</span>
                          <span className="block text-[10px] text-slate-500">homes in reach</span>
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-500">Tap any dot on the map. Zoom in to see individual homes.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </section>
  )
}

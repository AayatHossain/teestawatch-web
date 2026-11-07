import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Droplets, Home as HomeIcon, Orbit, Radar, Satellite, Waves, Mountain, Building2 } from 'lucide-react'
import type { Map as MLMap } from 'maplibre-gl'
import MapView from '../components/MapView'
import Footer from '../components/Footer'
import { Aurora, Counter, Reveal, SectionTitle, TiltCard } from '../components/ui'
import { loadJSON, useStats, fmt, type Stats } from '../lib/data'
import { addImage, orbit } from '../lib/map'

function HeroMap() {
  const stop = useRef<() => void>(() => {})
  useEffect(() => () => stop.current(), [])
  const onLoad = async (map: MLMap) => {
    const s = await loadJSON<Stats>('data/stats.json')
    addImage(map, 'river', 'river/2026.png', s.overlays['river/2026.png'], 0)
    addImage(map, 'flood', 'flood/flood_2020_07.png', s.overlays['flood/flood_2020_07.png'], 0)
    setTimeout(() => {
      map.setPaintProperty('flood', 'raster-opacity', 0.85)
      map.setPaintProperty('river', 'raster-opacity', 0.9)
    }, 600)
    map.easeTo({ zoom: 9.3, pitch: 58, duration: 5000, easing: (t) => 1 - Math.pow(1 - t, 3) })
    setTimeout(() => (stop.current = orbit(map, 1.6)), 5000)
  }
  return <MapView interactive={false} controls={false} center={[89.3, 25.9]} zoom={8.2} pitch={20} bearing={-20} fitTeesta={false} onLoad={onLoad} />
}

const FEATURES = [
  {
    to: '/floods',
    icon: Droplets,
    tone: 'from-flood-400/30 to-river-500/10',
    glow: 'group-hover:shadow-glow',
    title: 'Flood maps',
    text: 'See exactly where the water spread in every major flood, measured from radar that sees through monsoon clouds.',
    stat: (s: Stats) => `${fmt(Math.max(...s.floods.map((f) => f.new_water_km2)))} km²`,
    statLabel: 'newly flooded in July 2020',
  },
  {
    to: '/river',
    icon: Waves,
    tone: 'from-erosion-500/30 to-rose-500/10',
    glow: 'group-hover:shadow-glowOrange',
    title: 'Riverbank & erosion',
    text: 'Watch ten years of the Teesta reshaping its banks, and see where it is set to strike next year.',
    stat: (s: Stats) => `${fmt(s.land_lost_total_ha)} ha`,
    statLabel: 'of land taken by the river since 2016',
  },
  {
    to: '/villages',
    icon: HomeIcon,
    tone: 'from-rose-500/30 to-amber-400/10',
    glow: 'group-hover:shadow-[0_0_40px_-8px_rgba(239,68,68,0.6)]',
    title: 'Villages at risk',
    text: 'Search any village and see the chance the river reaches it within 1, 3 or 5 years.',
    stat: (s: Stats) => fmt(s.risk_counts.High),
    statLabel: 'settlements at high risk',
  },
]

const SOURCES = [
  { icon: Radar, name: 'Sentinel-1 radar', by: 'NASA ASF · HyP3' },
  { icon: Satellite, name: 'Harmonized Landsat & Sentinel-2', by: 'NASA HLS' },
  { icon: Orbit, name: 'OPERA surface water', by: 'NASA JPL' },
  { icon: Mountain, name: 'NASADEM elevation', by: 'NASA' },
  { icon: Building2, name: 'Open Buildings', by: 'Google' },
]

export default function Home() {
  const s = useStats()
  const hero = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <>
      {/* HERO */}
      <section ref={hero} className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0">
          <HeroMap />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/20 to-ink-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,6,13,0.85)_100%)]" />
        <motion.div style={{ opacity: fade }} className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9 }}>
            <span className="chip mb-6 border-flood-400/30 bg-flood-400/10 text-flood-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-flood-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-flood-400" />
              </span>
              NASA Space Apps 2026 · Dancing with the SARs
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl font-semibold leading-[0.98] tracking-tight text-white sm:text-7xl md:text-8xl"
          >
            Watching the
            <br />
            <span className="text-gradient">Teesta</span> from space.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 1 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300 md:text-xl"
          >
            AI-powered maps of floods, riverbank erosion and the villages in the river's path — built from NASA satellite data.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.9 }} className="mt-10 flex flex-wrap gap-3">
            <Link to="/villages" className="btn-primary">
              Find your village <ArrowRight size={16} />
            </Link>
            <Link to="/floods" className="btn-ghost">
              Explore the floods
            </Link>
          </motion.div>
        </motion.div>
        <motion.div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-slate-400"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown />
        </motion.div>
      </section>

      <div className="relative">
        <Aurora tone="mixed" />

        {/* NUMBERS */}
        <section className="mx-auto -mt-24 max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {s &&
              [
                { v: s.area_km2, suf: ' km²', label: 'of river land monitored' },
                { v: s.land_lost_total_ha, suf: ' ha', label: 'swallowed by the river since 2016', warm: true },
                { v: s.houses_analysed, suf: '', label: 'homes analysed one by one' },
                { v: s.risk_counts.High, suf: '', label: 'settlements at high risk', warm: true },
              ].map((c, i) => (
                <Reveal key={c.label} delay={i * 0.08}>
                  <div className="glass h-full p-6">
                    <div className={`font-display text-3xl font-semibold tracking-tight md:text-4xl ${c.warm ? 'text-gradient-warm' : 'text-gradient'}`}>
                      <Counter value={c.v} suffix={c.suf} />
                    </div>
                    <div className="mt-2 text-sm text-slate-400">{c.label}</div>
                  </div>
                </Reveal>
              ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto mt-32 max-w-6xl px-6">
          <SectionTitle
            kicker="One river, three stories"
            title={
              <>
                Everything the Teesta is doing,
                <br />
                <span className="text-gradient">on one map.</span>
              </>
            }
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.to} delay={i * 0.12}>
                <TiltCard className="h-full">
                  <Link to={f.to} className={`group glass relative block h-full overflow-hidden p-8 transition-shadow duration-500 ${f.glow}`}>
                    <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${f.tone} blur-2xl transition-transform duration-700 group-hover:scale-150`} />
                    <f.icon className="relative text-white" size={30} strokeWidth={1.6} />
                    <h3 className="relative mt-6 font-display text-2xl font-semibold text-white">{f.title}</h3>
                    <p className="relative mt-3 leading-relaxed text-slate-400">{f.text}</p>
                    {s && (
                      <div className="relative mt-8 border-t border-white/10 pt-5">
                        <div className="font-display text-3xl font-semibold text-white">{f.stat(s)}</div>
                        <div className="text-sm text-slate-400">{f.statLabel}</div>
                      </div>
                    )}
                    <span className="relative mt-6 inline-flex items-center gap-1 text-sm font-semibold text-flood-300 transition-all group-hover:gap-3">
                      Open <ArrowRight size={15} />
                    </span>
                  </Link>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* BIG STATEMENT */}
        {s && (
          <section className="mx-auto mt-36 max-w-5xl px-6 text-center">
            <Reveal>
              <p className="label text-erosion-400">The next five years</p>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-white md:text-6xl">
                About <span className="text-gradient-warm"><Counter value={s.expected_houses_reached_5yr} /></span> homes
                <br className="hidden md:block" /> are expected to meet the river.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
                TeestaWatch finds them house by house — so families, local officials and relief teams can act before the bank gives way.
              </p>
              <Link to="/villages" className="btn-primary mt-10">
                See the villages <ArrowRight size={16} />
              </Link>
            </Reveal>
          </section>
        )}

        {/* SOURCES */}
        <section className="mx-auto mt-36 max-w-6xl px-6">
          <Reveal>
            <p className="label text-center">Powered by Earth observation</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
            {SOURCES.map((x, i) => (
              <Reveal key={x.name} delay={i * 0.06}>
                <div className="glass flex h-full flex-col items-center gap-3 px-4 py-6 text-center transition-colors hover:bg-white/[0.07]">
                  <x.icon size={26} strokeWidth={1.5} className="text-flood-300" />
                  <div className="text-sm font-semibold text-white">{x.name}</div>
                  <div className="text-xs text-slate-500">{x.by}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
        <Footer />
      </div>
    </>
  )
}

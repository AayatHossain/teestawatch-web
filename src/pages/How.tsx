import { motion, useScroll, useSpring } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BrainCircuit, Radar, Target, Waves } from 'lucide-react'
import Footer from '../components/Footer'
import { Aurora, Counter, Reveal, SectionTitle, TiltCard } from '../components/ui'
import { useStats, fmt } from '../lib/data'

const STEPS = [
  {
    icon: Radar,
    color: 'from-flood-300 to-river-500',
    title: 'Satellites see through the clouds',
    text: 'Floods strike in the monsoon, when clouds hide the ground. Sentinel-1 radar sees straight through them every 12 days, while Landsat and Sentinel-2 track the river in the clear dry season and NASADEM maps the land height.',
  },
  {
    icon: BrainCircuit,
    color: 'from-violet-400 to-river-500',
    title: 'AI finds the water',
    text: 'Deep-learning models trained on floods from 11 countries were then tuned to the Teesta itself, so they recognise its sandbars, fields and floodwater at 10-metre detail.',
  },
  {
    icon: Waves,
    color: 'from-amber-300 to-erosion-500',
    title: 'Tracking a moving river',
    text: 'Eleven dry seasons of images reveal where the river has wandered. Every patch of land it reaches for the first time is counted as land lost.',
  },
  {
    icon: Target,
    color: 'from-rose-400 to-erosion-500',
    title: 'Forecasting who is next',
    text: 'A deep-learning forecast predicts next year’s erosion, and a risk model gives every home the chance the river reaches it within 1, 3 and 5 years.',
  },
]

export default function How() {
  const s = useStats()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const line = useSpring(scrollYProgress, { stiffness: 80, damping: 20 })

  return (
    <div className="relative pt-36">
      <Aurora tone="cool" />
      <section className="mx-auto max-w-6xl px-6">
        <SectionTitle
          kicker="How it works"
          title={
            <>
              From orbit to your <span className="text-gradient">doorstep</span>
            </>
          }
          sub="Four steps turn raw satellite signals into a map anyone can read."
        />

        <div ref={ref} className="relative mt-20">
          <div className="absolute left-[27px] top-0 h-full w-[2px] bg-white/10 md:left-1/2" />
          <motion.div style={{ scaleY: line }} className="absolute left-[27px] top-0 h-full w-[2px] origin-top bg-gradient-to-b from-flood-300 via-river-400 to-erosion-500 md:left-1/2" />
          <div className="space-y-20">
            {STEPS.map((st, i) => (
              <div key={st.title} className={`relative flex flex-col gap-6 pl-20 md:pl-0 ${i % 2 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                  className={`absolute left-0 top-0 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${st.color} text-ink-950 shadow-glow md:left-1/2 md:-translate-x-1/2`}
                >
                  <st.icon size={26} strokeWidth={1.8} />
                </motion.div>
                <div className="md:w-1/2" />
                <Reveal className={`md:w-1/2 ${i % 2 ? 'md:pr-20 md:text-right' : 'md:pl-20'}`}>
                  <div className="label text-flood-300">Step {i + 1}</div>
                  <h3 className="mt-2 font-display text-3xl font-semibold text-white">{st.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-slate-400">{st.text}</p>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {s && (
        <section className="mx-auto mt-40 max-w-6xl px-6">
          <SectionTitle kicker="Tested on real events" title={<>Proven against <span className="text-gradient">what really happened</span></>} sub="Every model was checked on places and years it had never seen." />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                big: <Counter value={Math.round(s.accuracy.flood_f1 * 100)} suffix="%" />,
                title: 'Flood-map accuracy',
                text: `F1 score against ${s.accuracy.flood_hand_tiles} Teesta areas mapped by hand, pixel by pixel.`,
                tone: 'text-gradient',
              },
              {
                big: <Counter value={Math.max(...s.accuracy.erosion_x_chance)} suffix="×" />,
                title: 'Sharper erosion forecasts',
                text: `Finds next year’s eroded land up to ${Math.max(...s.accuracy.erosion_x_chance)} times better than chance (AUC ${Math.max(...s.accuracy.erosion_auc).toFixed(2)}).`,
                tone: 'text-gradient-warm',
              },
              {
                big: <Counter value={s.accuracy.village_risk_auc} decimals={2} />,
                title: 'Village-risk skill (AUC)',
                text: 'Predicted from 2019 which land the river would reach by 2025 — and ranked it correctly.',
                tone: 'text-gradient',
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 0.1}>
                <TiltCard className="h-full">
                  <div className="glass h-full p-8">
                    <div className={`font-display text-6xl font-semibold tracking-tight ${c.tone}`}>{c.big}</div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-white">{c.title}</h3>
                    <p className="mt-2 leading-relaxed text-slate-400">{c.text}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="glass mt-6 grid gap-6 p-8 md:grid-cols-4">
              {[
                { v: s.satellite_images, l: 'satellite images processed' },
                { v: 11, l: 'years of river history' },
                { v: s.settlements, l: 'settlements mapped' },
                { v: s.houses_analysed, l: 'homes scored for risk' },
              ].map((x) => (
                <div key={x.l}>
                  <div className="font-display text-3xl font-semibold text-white"><Counter value={x.v} /></div>
                  <div className="text-sm text-slate-400">{x.l}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="mt-24 text-center">
            <h2 className="font-display text-3xl font-semibold text-white md:text-5xl">See it for yourself.</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/villages" className="btn-primary">Find your village <ArrowRight size={16} /></Link>
              <Link to="/river" className="btn-ghost">Watch the river move</Link>
            </div>
            <p className="mt-6 text-sm text-slate-500">{fmt(s.area_km2)} km² of the Teesta in Bangladesh · {s.years_of_data}</p>
          </Reveal>
        </section>
      )}
      <Footer />
    </div>
  )
}

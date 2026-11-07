import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Home from './pages/Home'
import Floods from './pages/Floods'
import River from './pages/River'
import Villages from './pages/Villages'
import How from './pages/How'

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.main>
  )
}

function Routed() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Home /></Page>} />
        <Route path="/floods" element={<Page><Floods /></Page>} />
        <Route path="/river" element={<Page><River /></Page>} />
        <Route path="/villages" element={<Page><Villages /></Page>} />
        <Route path="/how" element={<Page><How /></Page>} />
        <Route path="*" element={<Page><Home /></Page>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Nav />
      <Routed />
    </HashRouter>
  )
}

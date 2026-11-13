import type { Map as MLMap } from 'maplibre-gl'
import { asset, type Corners } from './data'

/** Adds a PNG overlay (Web Mercator, exact corners) as a raster layer. */
export function addImage(map: MLMap, id: string, file: string, corners: Corners, opacity = 1, before?: string) {
  if (map.getSource(id)) return
  map.addSource(id, { type: 'image', url: asset(`data/${file}`), coordinates: corners })
  map.addLayer(
    {
      id,
      type: 'raster',
      source: id,
      paint: { 'raster-opacity': opacity, 'raster-resampling': 'nearest', 'raster-fade-duration': 0 },
    },
    before && map.getLayer(before) ? before : 'labels',
  )
  map.setPaintProperty(id, 'raster-opacity-transition', { duration: 900, delay: 0 })
}

export function setOpacity(map: MLMap, id: string, v: number) {
  if (map.getLayer(id)) map.setPaintProperty(id, 'raster-opacity', v)
}

/** Below the Tailwind md breakpoint the page panel becomes a bottom sheet over the lower part of the map. */
export const isPhone = () => window.innerWidth < 768

/** Map padding that keeps the camera on the part of the map not covered by the page's panel (<aside>).
 *  Phones: pad the bottom by the panel's height. md and up: no padding (desktop behaviour unchanged). */
export function viewPadding() {
  if (!isPhone()) return { top: 0, bottom: 0, left: 0, right: 0 }
  const panelTop = document.querySelector('aside')?.getBoundingClientRect().top ?? window.innerHeight * 0.46
  return { top: 72, bottom: Math.max(0, Math.round(window.innerHeight - panelTop)) + 8, left: 12, right: 12 }
}

/** Slow continuous camera rotation; returns a stop function. */
export function orbit(map: MLMap, degPerSec = 2.2) {
  let raf = 0
  let last = performance.now()
  const tick = (t: number) => {
    const dt = (t - last) / 1000
    last = t
    map.setBearing((map.getBearing() + degPerSec * dt) % 360)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}

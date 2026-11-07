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

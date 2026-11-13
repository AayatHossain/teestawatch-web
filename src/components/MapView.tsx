import { useEffect, useRef } from 'react'
import maplibregl, { type Map as MLMap, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { TEESTA_BOUNDS } from '../lib/data'

const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    sat: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 18,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    },
    labels: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 18,
      attribution: 'Labels © Esri',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#03060d' } },
    {
      id: 'sat',
      type: 'raster',
      source: 'sat',
      paint: { 'raster-saturation': -0.25, 'raster-brightness-max': 0.72, 'raster-contrast': 0.08, 'raster-fade-duration': 400 },
    },
    { id: 'labels', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.85 } },
  ],
}

interface Props {
  className?: string
  interactive?: boolean
  center?: [number, number]
  zoom?: number
  pitch?: number
  bearing?: number
  fitTeesta?: boolean
  controls?: boolean
  onLoad?: (map: MLMap) => void
}

export default function MapView({ className = '', interactive = true, center, zoom, pitch = 0, bearing = 0, fitTeesta = true, controls = true, onLoad }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad

  useEffect(() => {
    if (!el.current) return
    const map = new maplibregl.Map({
      container: el.current,
      style: STYLE,
      center: center ?? [89.29, 25.86],
      zoom: zoom ?? 8.6,
      pitch,
      bearing,
      interactive,
      attributionControl: { compact: true },
      // panning limit; generous enough that a phone (map partly under a bottom panel) can still frame the whole river
      maxBounds: [[86.6, 22.8], [92.0, 28.6]],
      fadeDuration: 300,
    })
    if (fitTeesta && !center) map.fitBounds(TEESTA_BOUNDS, { padding: 40, duration: 0 })
    if (interactive && controls) map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')
    map.on('load', () => onLoadRef.current?.(map))
    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={el} className={`h-full w-full ${className}`} />
}

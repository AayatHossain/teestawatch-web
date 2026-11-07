import { useEffect, useState } from 'react'

export const BASE = import.meta.env.BASE_URL
export const asset = (p: string) => `${BASE}${p.replace(/^\//, '')}`

export type Corners = [[number, number], [number, number], [number, number], [number, number]]

export interface FloodEvent {
  id: string
  label: string
  before: string
  after: string
  water_before_km2: number
  water_after_km2: number
  new_water_km2: number
  image: string
}

export interface Stats {
  area_km2: number
  years_of_data: string
  satellite_images: number
  houses_analysed: number
  houses_in_settlements: number
  settlements: number
  risk_counts: { High: number; Medium: number; Low: number }
  houses_p5_over_50: number
  houses_p5_over_5: number
  expected_houses_reached_5yr: number
  floods: FloodEvent[]
  land_lost_by_year: { year: number; ha: number }[]
  land_lost_total_ha: number
  forecast_2027: { high_ha: number; medium_ha: number; expected_ha: number; focus: [number, number] }
  accuracy: {
    flood_f1: number
    flood_iou: number
    flood_hand_tiles: number
    erosion_auc: number[]
    erosion_x_chance: number[]
    village_risk_auc: number
  }
  overlays: Record<string, Corners>
}

export interface VillageProps {
  id: number
  name: string
  union: string
  upazila: string
  district: string
  houses: number
  risk: 'High' | 'Medium' | 'Low'
  p1: number
  p3: number
  p5: number
  dist_m: number
  years: number
  exp5: number
}

export interface Village extends VillageProps {
  lon: number
  lat: number
}

const cache = new Map<string, Promise<unknown>>()
export function loadJSON<T>(path: string): Promise<T> {
  if (!cache.has(path)) cache.set(path, fetch(asset(path)).then((r) => r.json()))
  return cache.get(path) as Promise<T>
}

export function useJSON<T>(path: string): T | null {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    let alive = true
    loadJSON<T>(path).then((d) => alive && setData(d))
    return () => {
      alive = false
    }
  }, [path])
  return data
}

export const useStats = () => useJSON<Stats>('data/stats.json')

export function useVillages(): Village[] | null {
  const fc = useJSON<{ features: { properties: VillageProps; geometry: { coordinates: [number, number] } }[] }>('data/villages.geojson')
  const [list, setList] = useState<Village[] | null>(null)
  useEffect(() => {
    if (fc) setList(fc.features.map((f) => ({ ...f.properties, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] })))
  }, [fc])
  return list
}

export const fmt = (n: number) => n.toLocaleString('en-US')

/** Centre of the Teesta in Bangladesh and a pleasant default view. */
export const TEESTA_VIEW = { center: [89.33, 25.93] as [number, number], zoom: 9.1, pitch: 0, bearing: 0 }
export const TEESTA_BOUNDS: [[number, number], [number, number]] = [[88.85, 25.42], [89.72, 26.45]]

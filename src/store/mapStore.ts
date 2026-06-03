import { create } from 'zustand'

interface MapState {
  center: [number, number]
  zoom: number
  bearing: number
  pitch: number
  loadedTiles: Set<string>
  setMapState: (state: Partial<MapState>) => void
  addLoadedTile: (tileId: string) => void
  isTileLoaded: (tileId: string) => boolean
}

export const useMapStore = create<MapState>((set, get) => ({
  center: [121.4737, 31.2304], // Shanghai coordinates as default
  zoom: 10,
  bearing: 0,
  pitch: 0,
  loadedTiles: new Set(),
  setMapState: (state) => set((prev) => ({ ...prev, ...state })),
  addLoadedTile: (tileId) => set((prev) => ({
    loadedTiles: new Set(prev.loadedTiles).add(tileId)
  })),
  isTileLoaded: (tileId) => get().loadedTiles.has(tileId)
}))

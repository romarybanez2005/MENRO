import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapStore } from '@/store/mapStore'
import { useBarangayGeoJSON } from '@/hooks/useBarangayGeoJSON'

interface MapboxMapProps {
  accessToken: string
}

export function MapboxMap({ accessToken }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const isMapInitialized = useRef(false)
  const [error, setError] = useState<string | null>(null)
  
  const { setMapState, addLoadedTile, isTileLoaded } = useMapStore()
  const { data: barangayGeoJSON, isLoading, isError: isGeoJSONError } = useBarangayGeoJSON()

  useEffect(() => {
    if (!mapContainer.current || isMapInitialized.current || !barangayGeoJSON) return

    console.log('Initializing map...', { container: mapContainer.current })
    
    try {
      mapboxgl.accessToken = accessToken

      // Load saved state from localStorage directly
      const savedState = localStorage.getItem('map-state')
      const initialState = savedState ? JSON.parse(savedState) : null

      console.log('Creating map instance...', { initialState })

      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialState?.center || [124.6, 8.5],
        zoom: initialState?.zoom || 10,
        bearing: initialState?.bearing || 0,
        pitch: initialState?.pitch || 0,
        minZoom: 8,
        maxZoom: 16
      })

      console.log('Map instance created')

      // Add GeoJSON source and layer for barangay data
      mapInstance.on('load', () => {
        console.log('Map loaded successfully')
        
        // Add GeoJSON source
        mapInstance.addSource('barangay', {
          type: 'geojson',
          data: barangayGeoJSON as any
        })

        // Add fill layer
        mapInstance.addLayer({
          id: 'barangay-fill',
          type: 'fill',
          source: 'barangay',
          layout: {},
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.3
          }
        })

        // Add line layer for borders
        mapInstance.addLayer({
          id: 'barangay-line',
          type: 'line',
          source: 'barangay',
          layout: {},
          paint: {
            'line-color': '#1d4ed8',
            'line-width': 2
          }
        })

        // Calculate bounds of the GeoJSON data and fit the map
        const bounds = new mapboxgl.LngLatBounds()
        ;(barangayGeoJSON as any).features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.coordinates) {
            if (feature.geometry.type === 'Polygon') {
              feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
                bounds.extend([coord[0], coord[1]])
              })
            }
          }
        })

        // Fit map to bounds with padding
        mapInstance.fitBounds(bounds, {
          padding: 50,
          maxZoom: 12
        })

        // Set minZoom to prevent zooming out too far (2 zoom levels below the fit bounds zoom)
        const cameraForBounds = mapInstance.cameraForBounds(bounds, { padding: 50 })
        if (cameraForBounds && cameraForBounds.zoom !== undefined) {
          mapInstance.setMinZoom(Math.max(8, cameraForBounds.zoom - 1))
        }

        // Add zoom controls
        mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')

        // Add click event to zoom to barangay
        mapInstance.on('click', 'barangay-fill', (e: any) => {
          const features = mapInstance.queryRenderedFeatures(e.point, {
            layers: ['barangay-fill']
          })

          if (features.length > 0) {
            const feature = features[0]
            const bounds = new mapboxgl.LngLatBounds()

            if (feature.geometry && (feature.geometry as any).coordinates) {
              if (feature.geometry.type === 'Polygon') {
                (feature.geometry as any).coordinates[0].forEach((coord: number[]) => {
                  if (coord.length >= 2) {
                    bounds.extend([coord[0], coord[1]] as [number, number])
                  }
                })
              }
            }

            mapInstance.fitBounds(bounds, {
              padding: 50,
              maxZoom: 16
            })
          }
        })

        // Change cursor to pointer when hovering over barangays
        mapInstance.on('mouseenter', 'barangay-fill', () => {
          mapInstance.getCanvas().style.cursor = 'pointer'
        })

        mapInstance.on('mouseleave', 'barangay-fill', () => {
          mapInstance.getCanvas().style.cursor = ''
        })

        isMapInitialized.current = true
      })

      // Cache tiles to prevent repeated API calls
      mapInstance.on('tiledata', (e: any) => {
        const tileId = `${e.sourceId}-${e.tile.coord.z}-${e.tile.coord.x}-${e.tile.coord.y}`
        if (!isTileLoaded(tileId)) {
          addLoadedTile(tileId)
        }
      })

      // Save map state to prevent redundant API calls
      const saveState = () => {
        if (!map.current) return
        const state = {
          center: map.current.getCenter().toArray(),
          zoom: map.current.getZoom(),
          bearing: map.current.getBearing(),
          pitch: map.current.getPitch()
        }
        localStorage.setItem('map-state', JSON.stringify(state))
        setMapState(state)
      }

      mapInstance.on('moveend', saveState)
      mapInstance.on('zoomend', saveState)
      mapInstance.on('rotateend', saveState)
      mapInstance.on('pitchend', saveState)

      mapInstance.on('error', (e: any) => {
        console.error('Mapbox error:', e.error)
        setError(e.error.message || 'Failed to load map')
      })

      map.current = mapInstance
    } catch (err) {
      console.error('Map initialization error:', err)
      setError('Failed to initialize map')
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        isMapInitialized.current = false
      }
    }
  }, [accessToken, isTileLoaded, addLoadedTile, setMapState, barangayGeoJSON])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-muted-foreground">Loading map data...</p>
        </div>
      </div>
    )
  }

  if (isGeoJSONError || !barangayGeoJSON) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-red-500 font-medium">Error loading map data</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-red-500 font-medium">Error loading map</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return <div ref={mapContainer} className="w-full h-full overflow-hidden" />
}

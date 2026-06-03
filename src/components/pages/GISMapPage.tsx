import { MapboxMap } from '@/components/MapboxMap'

export default function GISMapPage() {
  const mapboxAccessToken = ''

  return (
    <div className="w-[calc(100%+2rem)] h-screen sm:h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <MapboxMap accessToken={mapboxAccessToken} />  
    </div>
  )
}

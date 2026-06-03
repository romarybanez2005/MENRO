import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import barangayData from "@/data/barangay.json";

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coordinates: string, radius: number) => void;
  selectedBarangay?: string;
}

export default function MapDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedBarangay,
}: MapDialogProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const circleSourceRef = useRef<string>("circle-source");
  const circleLayerRef = useRef<string>("circle-layer");
  const radiusRef = useRef<number>(100);
  const selectedBarangayRef = useRef<string | undefined>(selectedBarangay);
  const [coordinates, setCoordinates] = useState<string>("");
  const [radius, setRadius] = useState<number>(100);
  const [center, setCenter] = useState<{ lng: number; lat: number } | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Keep refs in sync
  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

  useEffect(() => {
    selectedBarangayRef.current = selectedBarangay;
  }, [selectedBarangay]);

  useEffect(() => {
    if (isOpen && mapRef.current && !mapInstanceRef.current) {
      // Initialize map centered on Cagayan de Oro
      mapboxgl.accessToken = "";
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [124.6319, 8.4542],
        zoom: 12,
        minZoom: 11, // Prevent zooming out too far
      });

      // Add click handler - only update after style is loaded
      map.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        const currentBarangay = selectedBarangayRef.current;

        // Check if click is inside selected barangay polygon
        if (currentBarangay) {
          const barangayFeature = barangayData.features.find(
            (f: any) =>
              f.properties?.name?.toLowerCase() ===
              currentBarangay.toLowerCase(),
          );
          if (
            barangayFeature &&
            !isPointInPolygon(
              [lng, lat],
              barangayFeature.geometry.coordinates[0],
            )
          ) {
            setErrorMsg(
              `Please click inside ${currentBarangay} barangay boundary.`,
            );
            return;
          }
        }

        setErrorMsg("");
        setCenter({ lng, lat });
        setCoordinates(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);

        if (map.isStyleLoaded()) {
          updateCircle(map, lng, lat, radiusRef.current);
        }
      });

      // Load barangay data when map loads
      map.on("load", () => {
        // Filter barangay data based on selection
        let dataToLoad = barangayData as any;
        if (selectedBarangayRef.current) {
          const matchedFeatures = barangayData.features.filter(
            (f: any) =>
              f.properties?.name?.toLowerCase() ===
              selectedBarangayRef.current?.toLowerCase(),
          );
          if (matchedFeatures.length > 0) {
            dataToLoad = {
              type: "FeatureCollection",
              features: matchedFeatures,
            };
          }
        }

        // Add barangay polygons
        map.addSource("barangays", {
          type: "geojson",
          data: dataToLoad,
        });

        map.addLayer({
          id: "barangays-fill",
          type: "fill",
          source: "barangays",
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.1,
          },
        });

        map.addLayer({
          id: "barangays-outline",
          type: "line",
          source: "barangays",
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2,
          },
        });

        // Fit map to selected barangay or all barangays
        fitMapToBarangays(map, selectedBarangayRef.current);
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  const fitMapToBarangays = (map: mapboxgl.Map, selectedName?: string) => {
    if (!barangayData.features || barangayData.features.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    let featuresToFit = barangayData.features;
    if (selectedName) {
      const matched = barangayData.features.filter(
        (f: any) =>
          f.properties?.name?.toLowerCase() === selectedName.toLowerCase(),
      );
      if (matched.length > 0) featuresToFit = matched;
    }

    featuresToFit.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates[0];
        coords.forEach((coord: number[]) => {
          minX = Math.min(minX, coord[0]);
          minY = Math.min(minY, coord[1]);
          maxX = Math.max(maxX, coord[0]);
          maxY = Math.max(maxY, coord[1]);
        });
      }
    });

    map.fitBounds(
      [
        [minX, minY],
        [maxX, maxY],
      ] as any,
      {
        padding: 80,
        maxZoom: selectedName ? 14 : 12,
      },
    );
  };

  // Ray-casting point-in-polygon algorithm
  const isPointInPolygon = (
    point: [number, number],
    polygon: number[][],
  ): boolean => {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1];
      const xj = polygon[j][0],
        yj = polygon[j][1];
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Update circle when radius changes
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      center &&
      mapInstanceRef.current.isStyleLoaded()
    ) {
      updateCircle(mapInstanceRef.current, center.lng, center.lat, radius);
    }
  }, [radius, center]);

  const updateCircle = (
    map: mapboxgl.Map,
    lng: number,
    lat: number,
    r: number,
  ) => {
    try {
      const sourceId = circleSourceRef.current;
      const layerId = circleLayerRef.current;
      const outlineLayerId = `${layerId}-outline`;

      // Remove existing source and layer if they exist
      if (map.getLayer(outlineLayerId)) {
        map.removeLayer(outlineLayerId);
      }
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      // Create GeoJSON circle
      const circleGeoJSON = createCircleGeoJSON(lng, lat, r);

      // Add source and layer
      map.addSource(sourceId, {
        type: "geojson",
        data: circleGeoJSON as any,
      });

      map.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": "#22c55e",
          "fill-opacity": 0.3,
        },
      });

      map.addLayer({
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": "#22c55e",
          "line-width": 2,
        },
      });
    } catch (err) {
      console.error("Error updating circle:", err);
    }
  };

  const createCircleGeoJSON = (
    lng: number,
    lat: number,
    radiusInMeters: number,
  ) => {
    const coordinates = [];
    const steps = 64;
    const earthRadius = 6378137; // Earth's radius in meters

    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const dx = radiusInMeters * Math.cos(angle);
      const dy = radiusInMeters * Math.sin(angle);
      const newLng =
        lng +
        ((dx / earthRadius) * (180 / Math.PI)) /
          Math.cos((lat * Math.PI) / 180);
      const newLat = lat + (dy / earthRadius) * (180 / Math.PI);
      coordinates.push([newLng, newLat]);
    }

    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [coordinates],
      },
    };
  };

  const handleConfirm = () => {
    if (coordinates) {
      onConfirm(coordinates, radius);
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={mapRef}
        className="flex-1 min-h-[400px] rounded-lg overflow-hidden relative z-0"
      />
      <div className="p-4 space-y-4 bg-white rounded-b-lg relative z-10">
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Radius (meters): {radius}m
          </label>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        {errorMsg && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
            {errorMsg}
          </div>
        )}
        {coordinates && (
          <div className="text-sm text-gray-600">
            Center coordinates: {coordinates}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!coordinates}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}

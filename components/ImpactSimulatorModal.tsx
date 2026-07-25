"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { X, AlertTriangle, Flame, Wind, Activity } from "lucide-react";
import { Asteroid } from "@/lib/nasa";

interface Props {
  asteroid: Asteroid;
  onClose: () => void;
}

// Generates geographic polygon coordinates for true meter-scale circles on MapLibre
function createGeoJSONCircle(center: [number, number], radiusInMeters: number, points = 64) {
  const coords = {
    latitude: center[1],
    longitude: center[0],
  };

  const km = radiusInMeters / 1000;
  const ret: [number, number][] = [];
  const distanceX = km / (111.320 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]); // Close polygon

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [ret],
    },
    properties: {},
  };
}

export default function ImpactSimulatorModal({ asteroid, onClose }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [lat, setLat] = useState<number>(40.7128);
  const [lng, setLng] = useState<number>(-74.0060);

  const avgDiameter = Math.round((asteroid.diameterMinMeters + asteroid.diameterMaxMeters) / 2);
  const velocityMs = asteroid.velocityKms * 1000;
  
  const radiusMeters = avgDiameter / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);
  const massKg = volume * 2500;
  const energyJoules = 0.5 * massKg * Math.pow(velocityMs, 2);
  const megatonsTNT = energyJoules / 4.184e15;

  const craterRadius = Math.round(1.16 * Math.pow(energyJoules, 0.28));
  const airblastRadius = Math.round(craterRadius * 5.0);
  const thermalRadius = Math.round(craterRadius * 10.0);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [lng, lat],
      zoom: 7,
    });

    mapRef.current = map;

    const updateImpactZones = (centerLng: number, centerLat: number) => {
      const craterData = createGeoJSONCircle([centerLng, centerLat], craterRadius);
      const airblastData = createGeoJSONCircle([centerLng, centerLat], airblastRadius);
      const thermalData = createGeoJSONCircle([centerLng, centerLat], thermalRadius);

      (map.getSource("crater-source") as maplibregl.GeoJSONSource)?.setData(craterData);
      (map.getSource("airblast-source") as maplibregl.GeoJSONSource)?.setData(airblastData);
      (map.getSource("thermal-source") as maplibregl.GeoJSONSource)?.setData(thermalData);
    };

    // Helper wrapper
    function crateringData(data: ReturnType<typeof createGeoJSONCircle>) {
      return data;
    }

    map.on("load", () => {
      // Add Sources
      map.addSource("thermal-source", { type: "geojson", data: createGeoJSONCircle([lng, lat], thermalRadius) });
      map.addSource("airblast-source", { type: "geojson", data: createGeoJSONCircle([lng, lat], airblastRadius) });
      map.addSource("crater-source", { type: "geojson", data: createGeoJSONCircle([lng, lat], craterRadius) });

      // Add Layers (Geographical fill polygons)
      map.addLayer({
        id: "thermal-layer",
        type: "fill",
        source: "thermal-source",
        paint: { "fill-color": "#f59e0b", "fill-opacity": 0.25, "fill-outline-color": "#d97706" }
      });

      map.addLayer({
        id: "airblast-layer",
        type: "fill",
        source: "airblast-source",
        paint: { "fill-color": "#f97316", "fill-opacity": 0.35, "fill-outline-color": "#ea580c" }
      });

      map.addLayer({
        id: "crater-layer",
        type: "fill",
        source: "crater-source",
        paint: { "fill-color": "#ef4444", "fill-opacity": 0.6, "fill-outline-color": "#b91c1c" }
      });
    });

    map.on("click", (e) => {
      setLat(e.lngLat.lat);
      setLng(e.lngLat.lng);
      updateImpactZones(e.lngLat.lng, e.lngLat.lat);
    });

    return () => map.remove();
  }, [lat, lng, craterRadius, airblastRadius, thermalRadius]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="relative w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-800 flex flex-col overflow-hidden text-zinc-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-xs font-black uppercase text-white tracking-widest">
              EARTH IMPACT DAMAGE ESTIMATOR // {asteroid.name}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 relative bg-black">
            <div ref={mapContainer} className="w-full h-full" />
            <div className="absolute top-3 left-3 bg-black/90 p-2 border border-zinc-800 text-[9px] text-zinc-400 pointer-events-none">
              GEOGRAPHICALLY FIXED IMPACT COVERAGE // CLICK MAP TO RELOCATE
            </div>
          </div>

          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 p-4 bg-zinc-950 flex flex-col gap-4 text-[10px] overflow-y-auto">
            <div>
              <span className="text-zinc-500 uppercase block mb-1">Target Center</span>
              <p className="text-white font-bold">{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</p>
            </div>

            <div className="p-3 bg-red-950/30 border border-red-900/50">
              <span className="text-red-400 font-bold block mb-1">TOTAL KINETIC YIELD</span>
              <p className="text-lg font-black text-red-500">{megatonsTNT.toFixed(2)} MT</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <div>
                  <span className="text-white font-bold">CRATER ZONE</span>
                  <p className="text-zinc-400">{(craterRadius / 1000).toFixed(2)} km radius</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-orange-400" />
                <div>
                  <span className="text-white font-bold">AIRBLAST ZONE</span>
                  <p className="text-zinc-400">{(airblastRadius / 1000).toFixed(2)} km radius</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-white font-bold">THERMAL RADIATION</span>
                  <p className="text-zinc-400">{(thermalRadius / 1000).toFixed(2)} km radius</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
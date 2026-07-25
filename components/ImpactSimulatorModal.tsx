"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { X, AlertTriangle, Shield, Flame, Wind, Activity } from "lucide-react";
import { Asteroid } from "@/lib/nasa";

interface Props {
  asteroid: Asteroid;
  onClose: () => void;
}

export default function ImpactSimulatorModal({ asteroid, onClose }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Default target: New York City (40.7128, -74.0060)
  const [lat, setLat] = useState<number>(40.7128);
  const [lng, setLng] = useState<number>(-74.0060);

  // Calculations derived from diameter (m) and velocity (km/s)
  const avgDiameter = Math.round((asteroid.diameterMinMeters + asteroid.diameterMaxMeters) / 2);
  const velocityMs = asteroid.velocityKms * 1000;
  
  // Kinetic Energy = 0.5 * Mass * V^2 (assuming density 2500 kg/m^3)
  const radiusMeters = avgDiameter / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);
  const massKg = volume * 2500;
  const energyJoules = 0.5 * massKg * Math.pow(velocityMs, 2);
  const megatonsTNT = energyJoules / 4.184e15;

  // Estimated damage radii in meters
  const craterRadius = Math.round(1.16 * Math.pow(energyJoules, 0.28));
  const fireballRadius = Math.round(craterRadius * 2.5);
  const airblastRadius = Math.round(craterRadius * 6.0);
  const thermalRadius = Math.round(craterRadius * 12.0);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json", // Standard vector tile style
      center: [lng, lat],
      zoom: 8,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Add impact source & layer
      map.addSource("impact-point", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [lng, lat] },
              properties: {},
            },
          ],
        },
      });

      // Add visual circles for damage zones
      map.addLayer({
        id: "crater-zone",
        type: "circle",
        source: "impact-point",
        paint: {
          "circle-radius": Math.min(craterRadius / 100, 150),
          "circle-color": "#ef4444",
          "circle-opacity": 0.6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#dc2626",
        },
      });

      map.addLayer({
        id: "airblast-zone",
        type: "circle",
        source: "impact-point",
        paint: {
          "circle-radius": Math.min(airblastRadius / 100, 250),
          "circle-color": "#f97316",
          "circle-opacity": 0.3,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ea580c",
        },
      });
    });

    map.on("click", (e) => {
      setLat(e.lngLat.lat);
      setLng(e.lngLat.lng);
      const source = map.getSource("impact-point") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [e.lngLat.lng, e.lngLat.lat] },
              properties: {},
            },
          ],
        });
      }
    });

    return () => map.remove();
  }, [lat, lng, craterRadius, airblastRadius]);

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

        {/* Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Map Area */}
          <div className="flex-1 relative bg-black">
            <div ref={mapContainer} className="w-full h-full" />
            <div className="absolute top-3 left-3 bg-black/90 p-2 border border-zinc-800 text-[9px] text-zinc-400 pointer-events-none">
              CLICK ANYWHERE ON MAP TO REPOSITION TARGET POINT
            </div>
          </div>

          {/* Telemetry Sidebar */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 p-4 bg-zinc-950 flex flex-col gap-4 text-[10px] overflow-y-auto">
            <div>
              <span className="text-zinc-500 uppercase block mb-1">Target Coordinates</span>
              <p className="text-white font-bold">{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</p>
            </div>

            <div className="p-3 bg-red-950/30 border border-red-900/50">
              <span className="text-red-400 font-bold block mb-1">KINETIC YIELD</span>
              <p className="text-lg font-black text-red-500">{megatonsTNT.toFixed(2)} MT</p>
              <p className="text-zinc-500 text-[8px] mt-0.5">
                (~{(megatonsTNT / 0.015).toFixed(0)}x Hiroshima Equivalent)
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <div>
                  <span className="text-white font-bold">CRATER RADIUS</span>
                  <p className="text-zinc-400">{(craterRadius / 1000).toFixed(2)} km diameter</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-orange-400" />
                <div>
                  <span className="text-white font-bold font-mono">AIRBLAST RADIUS</span>
                  <p className="text-zinc-400">{(airblastRadius / 1000).toFixed(2)} km (Severe Overpressure)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-white font-bold">THERMAL RADIATION</span>
                  <p className="text-zinc-400">{(thermalRadius / 1000).toFixed(2)} km (3rd Degree Burns)</p>
                </div>
              </div>
            </div>

            <div className="mt-auto p-3 bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 leading-relaxed">
              Calculations derived using transient crater scaling equations developed by Melosh et al. (Purdue Earth Impact Effects). Estimates assume standard rocky density (2,500 kg/m³) and vertical impact trajectory.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
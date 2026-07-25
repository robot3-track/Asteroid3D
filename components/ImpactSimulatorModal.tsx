"use client";

import React, { useState } from "react";
import { X, Flame, AlertCircle, Bomb, Globe, Radio } from "lucide-react";
import { Asteroid } from "@/lib/nasa";
import { calculateImpactDamage } from "@/lib/physics";

interface ImpactSimulatorModalProps {
  asteroid: Asteroid;
  onClose: () => void;
}

const TARGET_CITIES = [
  { name: "New York City, USA", lat: 40.7128, lng: -74.006 },
  { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
];

export default function ImpactSimulatorModal({ asteroid, onClose }: ImpactSimulatorModalProps) {
  const [selectedTarget, setSelectedTarget] = useState(TARGET_CITIES[0]);
  const avgSize = Math.round((asteroid.diameterMinMeters + asteroid.diameterMaxMeters) / 2);
  const damage = calculateImpactDamage(avgSize, asteroid.velocityKms);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-black border border-red-900/60 w-full max-w-2xl overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.2)]">
        
        {/* HEADER */}
        <div className="p-4 bg-red-950/30 border-b border-red-900/50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider">
            <Bomb className="w-4 h-4 animate-bounce" />
            Impact Damage Estimator: {asteroid.name}
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* TARGET SELECTION */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" /> Select Hypothetical Ground Zero
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TARGET_CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => setSelectedTarget(city)}
                  className={`p-2 border text-left font-mono text-[10px] uppercase transition-all ${
                    selectedTarget.name === city.name
                      ? "bg-red-950/50 border-red-600 text-white font-bold"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* SIMULATED METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950 border border-zinc-800 p-3">
              <span className="text-[8px] text-zinc-500 uppercase block font-bold">Kinetic Yield</span>
              <span className="text-amber-400 font-bold text-sm">{damage.megatonsTNT} MT</span>
              <span className="text-[8px] text-zinc-600 block mt-0.5">TNT Equivalent</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3">
              <span className="text-[8px] text-zinc-500 uppercase block font-bold">Crater Diameter</span>
              <span className="text-white font-bold text-sm">{(damage.craterDiameterMeters / 1000).toFixed(2)} km</span>
              <span className="text-[8px] text-zinc-600 block mt-0.5">Depth: {damage.craterDepthMeters}m</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3">
              <span className="text-[8px] text-zinc-500 uppercase block font-bold">Blast Wave Radius</span>
              <span className="text-red-400 font-bold text-sm">{(damage.airBlastRadiusMeters / 1000).toFixed(1)} km</span>
              <span className="text-[8px] text-zinc-600 block mt-0.5">5 PSI Structural Collapse</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3">
              <span className="text-[8px] text-zinc-500 uppercase block font-bold">Seismic Force</span>
              <span className="text-cyan-400 font-bold text-sm">M {damage.seismicMagnitude}</span>
              <span className="text-[8px] text-zinc-600 block mt-0.5">Richter Equivalent</span>
            </div>
          </div>

          {/* VISUAL DAMAGE RADII GRAPH */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-3">
            <span className="text-[9px] text-zinc-400 font-bold uppercase flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              Calculated Thermal & Blast Zones at {selectedTarget.name}
            </span>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[9px] uppercase mb-1">
                  <span className="text-red-400 font-bold flex items-center gap-1"><Flame className="w-3 h-3" /> Fireball Radius</span>
                  <span className="text-zinc-400 font-bold">{(damage.fireballRadiusMeters / 1000).toFixed(1)} km</span>
                </div>
                <div className="h-2 bg-black border border-zinc-800">
                  <div className="h-full bg-red-600" style={{ width: `${Math.min(100, (damage.fireballRadiusMeters / damage.airBlastRadiusMeters) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] uppercase mb-1">
                  <span className="text-amber-400 font-bold">Severe Overpressure Zone</span>
                  <span className="text-zinc-400 font-bold">{(damage.airBlastRadiusMeters / 1000).toFixed(1)} km</span>
                </div>
                <div className="h-2 bg-black border border-zinc-800">
                  <div className="h-full bg-amber-500" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* SCIENTIFIC DISCLAIMER */}
            <div className="p-3 bg-zinc-950 border border-zinc-800 text-[9px] text-zinc-500 leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
            <p>
                Calculations derived using transient crater scaling equations developed by Melosh et al. (Purdue Earth Impact Effects). Estimates assume standard rocky density (2,500 kg/m³) and vertical impact trajectory.
            </p>
            </div>
        </div>
      </div>
    </div>
  );
}
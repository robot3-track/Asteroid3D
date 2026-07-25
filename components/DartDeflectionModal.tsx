"use client";

import React, { useState } from "react";
import { X, ShieldAlert, Rocket, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { Asteroid } from "@/lib/nasa";
import { calculateDeflection } from "@/lib/physics";

interface DartDeflectionModalProps {
  asteroid: Asteroid;
  onClose: () => void;
}

export default function DartDeflectionModal({ asteroid, onClose }: DartDeflectionModalProps) {
  const [spacecraftMass, setSpacecraftMass] = useState(600); // DART mass ~570kg
  const [impactVelocity, setImpactVelocity] = useState(6.6); // km/s
  const [leadTimeYears, setLeadTimeYears] = useState(10);
  const [beta, setBeta] = useState(2.0); // Momentum factor

  const avgSize = Math.round((asteroid.diameterMinMeters + asteroid.diameterMaxMeters) / 2);
  const result = calculateDeflection(
    avgSize,
    spacecraftMass,
    impactVelocity,
    beta,
    leadTimeYears,
    asteroid.missDistanceKm
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-black border border-cyan-900/60 w-full max-w-2xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.2)]">
        
        {/* HEADER */}
        <div className="p-4 bg-cyan-950/30 border-b border-cyan-900/50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider">
            <Rocket className="w-4 h-4 animate-pulse" />
            DART Planetary Defense Mission Sandbox
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* MISSION OUTCOME DISPLAY */}
          <div className={`p-4 border flex items-center justify-between ${
            result.deflectedSuccessfully
              ? "bg-emerald-950/30 border-emerald-800 text-emerald-400"
              : "bg-red-950/30 border-red-800 text-red-400"
          }`}>
            <div className="flex items-center gap-3">
              {result.deflectedSuccessfully ? (
                <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 animate-bounce" />
              )}
              <div>
                <h4 className="font-bold text-white uppercase text-xs">
                  {result.deflectedSuccessfully ? "Deflection Successful!" : "Deflection Insufficient"}
                </h4>
                <p className="text-[10px] text-zinc-400 mt-0.5 uppercase">
                  Imparted Δv: <span className="text-white font-bold">{result.deltaV.toFixed(6)} m/s</span> | Final Miss Distance: <span className="text-white font-bold">{Math.round(result.missDistanceKm).toLocaleString()} km</span>
                </p>
              </div>
            </div>
          </div>

          {/* SLIDERS FOR MISSION CONFIGURATION */}
          <div className="space-y-4 bg-zinc-950 border border-zinc-800 p-4">
            <span className="text-[9px] text-zinc-400 font-bold uppercase flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" /> Kinetic Impactor Parameters
            </span>

            {/* SPACECRAFT MASS */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] uppercase">
                <span className="text-zinc-400">Impactor Mass</span>
                <span className="text-white font-bold">{spacecraftMass} kg</span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={spacecraftMass}
                onChange={(e) => setSpacecraftMass(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* LEAD TIME */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] uppercase">
                <span className="text-zinc-400">Lead Time Before Close Approach</span>
                <span className="text-cyan-400 font-bold">{leadTimeYears} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={leadTimeYears}
                onChange={(e) => setLeadTimeYears(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* MOMENTUM ENHANCEMENT FACTOR (BETA) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] uppercase">
                <span className="text-zinc-400">Beta Factor (Ejecta Recoil Multiplier)</span>
                <span className="text-amber-400 font-bold font-mono">β = {beta.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={beta}
                onChange={(e) => setBeta(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
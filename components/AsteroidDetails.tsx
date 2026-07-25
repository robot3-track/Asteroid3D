"use client";

import React, { useState } from "react";
import { X, ExternalLink, ShieldCheck, AlertTriangle, Ruler, Navigation, Calendar, Gauge, Orbit, Zap } from "lucide-react";
import { Asteroid } from "@/lib/nasa";

interface AsteroidDetailsProps {
  asteroid: Asteroid | null;
  selectedId?: string | null;
  onClose: () => void;
  showPredictedRoute?: boolean;
  onTogglePredictedRoute?: (val: boolean) => void;
}

interface CelestialBodyInfo {
  name: string;
  type: string;
  diameterKm: number;
  mass: string;
  orbitPeriod: string;
  distanceFromSun: string;
  description: string;
  surfaceTemp: string;
  gravity: string;
  hazardStatus: string;
}

const CELESTIAL_REGISTRY: Record<string, CelestialBodyInfo> = {
  Sun: {
    name: "The Sun",
    type: "Yellow Dwarf Star (G2V)",
    diameterKm: 1392700,
    mass: "1.989 × 10³⁰ kg (333,000 Earths)",
    orbitPeriod: "230M Years (Galactic Orbit)",
    distanceFromSun: "0 AU",
    description: "The heart of our solar system, driving climate, weather, and life. The Sun's intense gravity locks all planets, asteroids, and comets in orbit.",
    surfaceTemp: "5,500 °C",
    gravity: "274 m/s² (28x Earth's)",
    hazardStatus: "System Anchor"
  },
  Earth: {
    name: "Earth",
    type: "Terrestrial Planet (3rd)",
    diameterKm: 12742,
    mass: "5.972 × 10²⁴ kg",
    orbitPeriod: "365.25 Days",
    distanceFromSun: "1.00 AU (149.6M km)",
    description: "Our home world, the only planet known to harbor life. Rich in liquid water oceans, dynamic oxygen atmosphere, and a strong magnetosphere shielding us.",
    surfaceTemp: "15 °C (average)",
    gravity: "9.81 m/s²",
    hazardStatus: "Observer Station"
  },
  Moon: {
    name: "The Moon",
    type: "Natural Satellite (Earth's)",
    diameterKm: 3474,
    mass: "7.342 × 10²² kg",
    orbitPeriod: "27.3 Days (Tide Locked)",
    distanceFromSun: "1.00 AU (384,400 km from Earth)",
    description: "Earth's only natural satellite. Procedural cratered lunar maria surface, responsible for ocean tides, stabilizing Earth's axial tilt over millions of years.",
    surfaceTemp: "-130 °C to 120 °C",
    gravity: "1.62 m/s² (1/6th Earth's)",
    hazardStatus: "Natural Shield"
  }
};

export default function AsteroidDetails({ 
  asteroid, 
  selectedId,
  onClose,
  showPredictedRoute = false,
  onTogglePredictedRoute
}: AsteroidDetailsProps) {
  const [showAdvancedTelemetry, setShowAdvancedTelemetry] = useState(false);

  // If clicked a planet
  if (!asteroid) {
    const celestialKey = selectedId || "";
    const celestial = CELESTIAL_REGISTRY[celestialKey];
    
    if (!celestial) return null;

    return (
      <div id="asteroid-details-overlay" className="flex flex-col h-full bg-black border border-zinc-800 rounded-none overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-cyan-400 animate-pulse" />
              <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                COSMIC TELEMETRY LINK
              </span>
            </div>
            <h2 className="text-white text-base font-black tracking-wide mt-1">
              {celestial.name.toUpperCase()}
            </h2>
          </div>
          <button
            id="close-details-btn"
            onClick={onClose}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-none border border-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          <div className="p-4 rounded-none border bg-zinc-950 border-zinc-800 text-zinc-400">
            <div className="flex gap-2.5">
              <div className="mt-0.5">
                <Orbit className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">
                  Classification: {celestial.type}
                </h4>
                <p className="text-[10px] leading-relaxed uppercase">
                  {celestial.description}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3">
            <h4 className="text-[9px] text-zinc-500 font-bold mb-2.5 uppercase tracking-wider">
              Physical Parameters
            </h4>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500 uppercase">Equatorial Diameter:</span>
                <span className="font-bold text-white">{celestial.diameterKm.toLocaleString()} KM</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500 uppercase">Estimated Mass:</span>
                <span className="font-bold text-white">{celestial.mass}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500 uppercase">Surface Gravity:</span>
                <span className="font-bold text-white">{celestial.gravity}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500 uppercase">Mean Temperature:</span>
                <span className="font-bold text-cyan-400">{celestial.surfaceTemp}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const avgSize = Math.round((asteroid.diameterMinMeters + asteroid.diameterMaxMeters) / 2);
  
  // Calculate Kinetic Energy Estimation (0.5 * m * v^2)
  // Density assumption for stone asteroid ~2500 kg/m^3
  const radius = avgSize / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  const estimatedMassKg = volume * 2500;
  const velocityMs = asteroid.velocityKms * 1000;
  const kineticEnergyJoules = 0.5 * estimatedMassKg * Math.pow(velocityMs, 2);
  const tntMegatons = (kineticEnergyJoules / 4.184e15).toFixed(2);

  const referenceStructures = [
    { name: "Average Human", size: 1.8, label: "1.8 meters" },
    { name: "Boeing 747 Jet", size: 64, label: "64 meters" },
    { name: "Great Pyramid of Giza", size: 139, label: "139 meters" },
    { name: "Eiffel Tower", size: 330, label: "330 meters" },
    { name: "Burj Khalifa Tower", size: 828, label: "828 meters" }
  ];

  const combinedObjects = [...referenceStructures]
    .map((struct) => ({ ...struct, isAsteroid: false }))
    .concat([{ name: `Asteroid ${asteroid.name}`, size: avgSize, label: `${avgSize} meters`, isAsteroid: true }]);

  combinedObjects.sort((a, b) => a.size - b.size);
  const maxSize = Math.max(...combinedObjects.map((o) => o.size));
  const bulletSpeedKms = 1.0;
  const speedRatio = asteroid.velocityKms / bulletSpeedKms;

  return (
    <div id="asteroid-details-overlay" className="flex flex-col h-full bg-black border border-zinc-800 rounded-none overflow-hidden font-mono text-xs">
      {/* HEADER SECTION */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 ${asteroid.isHazardous ? "bg-red-600 animate-pulse" : "bg-emerald-500"}`} />
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
              TARGET TELEMETRY LOCK
            </span>
          </div>
          <h2 className="text-white text-base font-black tracking-wide mt-1">
            {asteroid.name}
          </h2>
        </div>
        <button
          id="close-details-btn"
          onClick={onClose}
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-none border border-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* HAZARD SUMMARY BANNER */}
        <div className={`p-4 rounded-none border ${
          asteroid.isHazardous 
            ? "bg-red-950/20 border-red-900 text-red-400"
            : "bg-zinc-950 border-zinc-800 text-zinc-400"
        }`}>
          <div className="flex gap-2.5">
            <div className="mt-0.5">
              {asteroid.isHazardous ? (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">
                {asteroid.isHazardous ? "Hazard Status: Close Flyby" : "Hazard Status: Safe Distance"}
              </h4>
              <p className="text-[10px] leading-relaxed uppercase">
                {asteroid.isHazardous 
                  ? "Close flyby target. Passes within key monitoring range, but projected path remains safely clear of impact."
                  : "Totally safe flyby. Wide margin of trajectory safety relative to Earth."}
              </p>
            </div>
          </div>
        </div>

        {/* KINETIC IMPACT ESTIMATOR */}
        <div className="bg-zinc-950 border border-zinc-800 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[9px] text-amber-500 font-bold uppercase">
            <Zap className="w-3.5 h-3.5" /> Theoretical Kinetic Yield
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-[8px] text-zinc-600 block uppercase">Est. Mass</span>
              <span className="text-white font-bold">{estimatedMassKg.toExponential(2)} kg</span>
            </div>
            <div>
              <span className="text-[8px] text-zinc-600 block uppercase">TNT Equivalent</span>
              <span className="text-amber-400 font-bold">{tntMegatons} Megatons</span>
            </div>
          </div>
        </div>

        {/* PROXIMITY AND VELOCITY PANELS */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-950 border border-zinc-800 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold mb-2 uppercase">
              <Navigation className="w-3.5 h-3.5 text-zinc-400" />
              Distance to Earth
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-[8px] text-zinc-600 block uppercase">Lunar Distance</span>
                <p className="text-white text-xs font-bold">{asteroid.missDistanceLd.toFixed(2)} LD</p>
              </div>
              <div>
                <span className="text-[8px] text-zinc-600 block uppercase">Kilometers</span>
                <p className="text-white text-xs font-bold">{asteroid.missDistanceKm.toLocaleString()} KM</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold mb-2 uppercase">
              <Gauge className="w-3.5 h-3.5 text-zinc-400" />
              Velocity
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-[8px] text-zinc-600 block uppercase">Speed</span>
                <p className="text-white text-xs font-bold">{asteroid.velocityKms.toFixed(2)} KM/S</p>
              </div>
              <div>
                <span className="text-[8px] text-zinc-600 block uppercase">Bullet Ratio</span>
                <p className="text-zinc-400 text-[9px] uppercase font-bold">
                  ~{speedRatio.toFixed(1)}X Speed of Bullet
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COMPACT PROPORTIONAL SIZE COMPARISON */}
        <div className="bg-zinc-950 border border-zinc-800 p-3.5">
          <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold mb-3 uppercase">
            <Ruler className="w-3.5 h-3.5 text-zinc-400" />
            Size Versus Earth Landmarks
          </div>
          <div className="space-y-2.5">
            {combinedObjects.map((obj, idx) => {
              const percentage = Math.max(3, (obj.size / maxSize) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[9px] uppercase leading-none">
                    <span className={obj.isAsteroid ? "text-white font-bold" : "text-zinc-500"}>
                      {obj.name}
                    </span>
                    <span className={obj.isAsteroid ? "text-white font-bold" : "text-zinc-600"}>
                      {obj.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-black border border-zinc-900 rounded-none overflow-hidden">
                    <div
                      className={`h-full rounded-none transition-all duration-1000 ${
                        obj.isAsteroid
                          ? asteroid.isHazardous
                            ? "bg-red-600"
                            : "bg-cyan-500"
                          : "bg-zinc-700"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PREDICTED ROUTE PROJECTOR */}
        <div className="bg-zinc-950 border border-zinc-800 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Trajectory Projection</span>
            <span className="text-[8px] text-emerald-500 font-bold uppercase font-mono animate-pulse">Predicted Route</span>
          </div>
          <button
            id="toggle-predicted-route-btn"
            onClick={() => onTogglePredictedRoute && onTogglePredictedRoute(!showPredictedRoute)}
            className={`w-full py-2 border transition-all font-bold uppercase text-[9px] flex items-center justify-center gap-2 ${
              showPredictedRoute
                ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            {showPredictedRoute ? "Disable Trajectory Projection" : "Project Future Trajectory"}
          </button>
        </div>

      </div>
    </div>
  );
}
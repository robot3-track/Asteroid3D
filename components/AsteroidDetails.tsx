"use client";

import React, { useState } from "react";
import { X, ExternalLink, ShieldCheck, AlertTriangle, Ruler, Navigation, Calendar, Gauge, Orbit } from "lucide-react";
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
  },
  Mercury: {
    name: "Mercury",
    type: "Terrestrial Planet (1st)",
    diameterKm: 4879,
    mass: "3.285 × 10³³ kg",
    orbitPeriod: "88 Days",
    distanceFromSun: "0.39 AU (57.9M km)",
    description: "The smallest and closest planet to the Sun. Extreme temperature swings between scorching days and freezing nights, with a surface marked by heavy cratering.",
    surfaceTemp: "-180 °C to 430 °C",
    gravity: "3.7 m/s²",
    hazardStatus: "Inert Planet"
  },
  Venus: {
    name: "Venus",
    type: "Terrestrial Planet (2nd)",
    diameterKm: 12104,
    mass: "4.867 × 10²⁴ kg",
    orbitPeriod: "224.7 Days",
    distanceFromSun: "0.72 AU (108.2M km)",
    description: "Earth's sister planet in size, but plagued by a runaway greenhouse effect. Surrounded by thick sulfuric acid clouds, with atmospheric pressures 92x Earth's.",
    surfaceTemp: "465 °C (Hottest)",
    gravity: "8.87 m/s²",
    hazardStatus: "Acidic Atmosphere"
  },
  Mars: {
    name: "Mars",
    type: "Terrestrial Planet (4th)",
    diameterKm: 6779,
    mass: "6.390 × 10²³ kg",
    orbitPeriod: "687 Days",
    distanceFromSun: "1.52 AU (227.9M km)",
    description: "The Red Planet. Iron oxide dust covers the surface, creating desert-like conditions with thin carbon-dioxide atmosphere, massive volcanoes, and polar ice caps.",
    surfaceTemp: "-62 °C (average)",
    gravity: "3.71 m/s²",
    hazardStatus: "Exploration Colony"
  },
  Jupiter: {
    name: "Jupiter",
    type: "Gas Giant Planet (5th)",
    diameterKm: 139820,
    mass: "1.898 × 10²⁷ kg (318 Earths)",
    orbitPeriod: "11.86 Years",
    distanceFromSun: "5.20 AU (778.5M km)",
    description: "The king of planets, a gas giant larger than all other planets combined. Active multi-colored storm bands and the Great Red Spot storm raging for centuries.",
    surfaceTemp: "-110 °C",
    gravity: "24.79 m/s²",
    hazardStatus: "Comet Deflector"
  },
  Saturn: {
    name: "Saturn",
    type: "Gas Giant Planet (6th)",
    diameterKm: 116460,
    mass: "5.683 × 10²⁶ kg (95 Earths)",
    orbitPeriod: "29.45 Years",
    distanceFromSun: "9.58 AU (1.43B km)",
    description: "The jewel of the solar system, famous for its sprawling ring system composed of icy chunks and rock debris. Holds over 140 natural moons.",
    surfaceTemp: "-140 °C",
    gravity: "10.44 m/s²",
    hazardStatus: "Outer-System Guard"
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

  // If we clicked a celestial planet instead of an asteroid, render planet panel
  if (!asteroid) {
    const celestialKey = selectedId || "";
    const celestial = CELESTIAL_REGISTRY[celestialKey];
    
    if (!celestial) return null;

    return (
      <div id="asteroid-details-overlay" className="flex flex-col h-full bg-black border border-zinc-800 rounded-none overflow-hidden shadow-none transition-all duration-300 font-mono text-xs">
        
        {/* HEADER SECTION */}
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

        {/* DETAILED CELESTIAL DATA FEED */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          
          {/* PROFILE SUMMARY */}
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

          {/* PHYSICAL CHARACTERISTICS */}
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

          {/* ORBITAL MECHANICS */}
          <div className="bg-zinc-950 border border-zinc-800 p-3">
            <h4 className="text-[9px] text-zinc-500 font-bold mb-2.5 uppercase tracking-wider">
              Orbital Parameters
            </h4>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500 uppercase">Mean Solar Distance:</span>
                <span className="font-bold text-white">{celestial.distanceFromSun}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500 uppercase">Revolution Period:</span>
                <span className="font-bold text-white">{celestial.orbitPeriod}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-500 uppercase">Strategic Status:</span>
                <span className="font-bold text-emerald-400 uppercase">{celestial.hazardStatus}</span>
              </div>
            </div>
          </div>

          <div className="p-3 text-center border border-zinc-900 text-[8px] text-zinc-600 uppercase">
            Data sourced from NASA Jet Propulsion Laboratory (JPL) ephemeris tables.
          </div>

        </div>
      </div>
    );
  }

  const avgSize = Math.round((asteroid.diameterMinMeters + asteroid.diameterMaxMeters) / 2);
  
  // Structures for size comparison
  const referenceStructures = [
    { name: "Average Human", size: 1.8, label: "1.8 meters" },
    { name: "Boeing 747 Jet", size: 64, label: "64 meters" },
    { name: "Great Pyramid of Giza", size: 139, label: "139 meters" },
    { name: "Eiffel Tower", size: 330, label: "330 meters" },
    { name: "Burj Khalifa Tower", size: 828, label: "828 meters" }
  ];

  // Find where our asteroid fits among these landmarks
  const combinedObjects = [...referenceStructures]
    .map((struct) => ({ ...struct, isAsteroid: false }))
    .concat([{ name: `Asteroid ${asteroid.name}`, size: avgSize, label: `${avgSize} meters`, isAsteroid: true }]);

  // Sort objects by size
  combinedObjects.sort((a, b) => a.size - b.size);

  const maxSize = Math.max(...combinedObjects.map((o) => o.size));
  const bulletSpeedKms = 1.0;
  const speedRatio = asteroid.velocityKms / bulletSpeedKms;

  return (
    <div id="asteroid-details-overlay" className="flex flex-col h-full bg-black border border-zinc-800 rounded-none overflow-hidden shadow-none transition-all duration-300 font-mono text-xs">
      
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

      {/* DETAILED STATS FEED */}
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
                  ? "Close flyby target. It is larger than a sports stadium and passes relatively close, but it is completely safe and won't hit us."
                  : "Totally safe flyby. This space rock has a super wide margin of safety and will pass very far away from Earth."}
              </p>
            </div>
          </div>
        </div>

        {/* PROXIMITY AND VELOCITY DOUBLE PANELS */}
        <div className="grid grid-cols-2 gap-2">
          {/* Proximity Panel */}
          <div className="bg-zinc-950 border border-zinc-800 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold mb-2 uppercase">
              <Navigation className="w-3.5 h-3.5 text-zinc-400" />
              Distance to Earth
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-[8px] text-zinc-600 block uppercase">In Moon Trips (LD)</span>
                <p className="text-white text-xs font-bold">{asteroid.missDistanceLd.toFixed(2)} LD</p>
                <span className="text-[7px] text-zinc-600 block mt-0.5 lowercase">(1 LD = distance to Moon)</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-600 block uppercase">In Kilometers (KM)</span>
                <p className="text-white text-xs font-bold">{asteroid.missDistanceKm.toLocaleString()} KM</p>
              </div>
              <div>
                <span className="text-[8px] text-zinc-600 block uppercase">In Sun Units (AU)</span>
                <p className="text-white text-xs font-bold">{asteroid.missDistanceAu.toFixed(5)} AU</p>
                <span className="text-[7px] text-zinc-600 block mt-0.5 lowercase">(1 AU = distance to Sun)</span>
              </div>
            </div>
          </div>

          {/* Velocity Panel */}
          <div className="bg-zinc-950 border border-zinc-800 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold mb-2 uppercase">
              <Gauge className="w-3.5 h-3.5 text-zinc-400" />
              Speed Match
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-[8px] text-zinc-600 block uppercase">Kilometers per Second</span>
                <p className="text-white text-xs font-bold">{asteroid.velocityKms.toFixed(2)} KM/S</p>
              </div>
              <div>
                <span className="text-[8px] text-zinc-600 block uppercase">Kilometers per Hour</span>
                <p className="text-white text-xs font-bold">{asteroid.velocityKmh.toLocaleString()} KM/H</p>
              </div>
              <div>
                <span className="text-[8px] text-zinc-600 block uppercase">Bullet Speed Match</span>
                <p className="text-zinc-400 text-[9px] uppercase leading-tight font-bold">
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

        {/* ORBITAL DATA GRID */}
        {asteroid.orbitalParams && (
          <div className="bg-zinc-950 border border-zinc-800 p-3">
            <h4 className="text-[9px] text-zinc-500 font-bold mb-2.5 uppercase tracking-wider">
              Space Orbit & Flying Path
            </h4>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[9px] text-zinc-400">
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-600 uppercase">Orbit Width (a):</span>
                <span className="font-bold text-zinc-300">{asteroid.orbitalParams.semiMajorAxisAu.toFixed(4)} AU</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-600 uppercase">Orbit Ovalness:</span>
                <span className="font-bold text-zinc-300">{asteroid.orbitalParams.eccentricity.toFixed(4)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-600 uppercase">Orbit Tilt Angle:</span>
                <span className="font-bold text-zinc-300">{asteroid.orbitalParams.inclinationDeg.toFixed(2)}°</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-600 uppercase">Year (Sun Orbit):</span>
                <span className="font-bold text-zinc-300">{asteroid.orbitalParams.orbitalPeriodDays} Days</span>
              </div>
              <div className="col-span-2 flex justify-between pt-1 text-[8px] text-zinc-600 uppercase">
                <span>Intersection Angle: {asteroid.orbitalParams.longitudeOfAscendingNodeDeg.toFixed(1)}°</span>
                <span>Closest Spot to Sun: {asteroid.orbitalParams.argumentOfPerihelionDeg.toFixed(1)}°</span>
              </div>
            </div>
          </div>
        )}

        {/* ADVANCED OBSERVATION DATA EXPANDER (OBSERVATION DATE & NASA JPL LINK COLLAPSED BY DEFAULT) */}
        <div className="border border-zinc-800">
          <button
            id="toggle-advanced-telemetry-btn"
            onClick={() => setShowAdvancedTelemetry(!showAdvancedTelemetry)}
            className="w-full p-3 bg-zinc-950 hover:bg-zinc-900 flex items-center justify-between transition-colors font-bold uppercase text-[9px] text-zinc-400 hover:text-white"
          >
            <span>Advanced Observation Stats</span>
            <span>{showAdvancedTelemetry ? "[-] Collapse" : "[+] Expand"}</span>
          </button>
          
          {showAdvancedTelemetry && (
            <div className="p-3 bg-black border-t border-zinc-900 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <div>
                  <span className="text-[8px] text-zinc-600 uppercase font-bold block">Observation Date (Flyby)</span>
                  <span className="text-zinc-300 font-bold text-[10px] uppercase">
                    {asteroid.closeApproachDate} / {asteroid.closeApproachTime} UTC
                  </span>
                </div>
              </div>

              <a
                id="nasa-jpl-url-link"
                href={asteroid.nasaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-none transition-all font-bold uppercase text-[9px]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                NASA JPL Database
              </a>
            </div>
          )}
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
          <p className="text-[8px] text-zinc-500 leading-normal uppercase">
            {showPredictedRoute 
              ? "Projecting 3D trajectory line and accelerating simulation time to visualize closest flyby path relative to Earth."
              : "Showing raw real-time motion. Toggle projection to visualize the orbital flyby path."}
          </p>
        </div>

      </div>
    </div>
  );
}

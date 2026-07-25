"use client";

import React, { useState } from "react";
import { X, Globe, Ruler, Gauge, Compass, Waves, Layers, Info } from "lucide-react";

interface MoonDetailsProps {
  targetDate: string;
  onClose: () => void;
}

// Geophysics parameters based on NASA GRAIL & Apollo seismic data
const LUNAR_LAYERS = [
  {
    name: "Regolith / Surface",
    depth: "0 - 12 m",
    thickness: "12 m",
    comp: "Fine dust, impact breccias, basaltic glass",
    temp: "-130°C to +120°C",
    color: "border-zinc-500 bg-zinc-800/40 text-zinc-300"
  },
  {
    name: "Lunar Crust",
    depth: "12 - 43 km",
    thickness: "~30-40 km",
    comp: "Anorthosite (plagioclase feldspar), basaltic maria",
    temp: "~-20°C",
    color: "border-amber-700/50 bg-amber-950/20 text-amber-200"
  },
  {
    name: "Upper Mantle (Rigid)",
    depth: "43 - 500 km",
    thickness: "~457 km",
    comp: "Pyroxene, olivine, rich in magnesium",
    temp: "200°C - 800°C",
    color: "border-emerald-700/50 bg-emerald-950/20 text-emerald-200"
  },
  {
    name: "Lower Mantle (Partial Melt)",
    depth: "500 - 1,400 km",
    thickness: "~900 km",
    comp: "Partial melt zone, ilmenite-rich cumulates",
    temp: "1,000°C - 1,300°C",
    color: "border-orange-700/50 bg-orange-950/20 text-orange-200"
  },
  {
    name: "Fluid Outer Core",
    depth: "1,400 - 1,500 km",
    thickness: "~100 km radius",
    comp: "Liquid iron-nickel alloy (~0.2% lunar mass)",
    temp: "~1,400°C",
    color: "border-red-700/50 bg-red-950/30 text-red-200"
  },
  {
    name: "Solid Inner Core",
    depth: "1,500 - 1,737 km",
    thickness: "~240 km radius",
    comp: "Metallic solid iron (crystallized core)",
    temp: "~1,500°C",
    color: "border-yellow-500 bg-yellow-500/20 text-yellow-300"
  }
];

export default function MoonDetails({ targetDate, onClose }: MoonDetailsProps) {
  const [activeTab, setActiveTab] = useState<"telemetry" | "geology">("telemetry");
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  // Precise Meeus-based Keplerian Lunar Ephemeris
  const luna = React.useMemo(() => {
    const target = targetDate ? new Date(targetDate) : new Date();
    if (isNaN(target.getTime())) return null;

    // Julian Date calculation
    const timeMs = target.getTime();
    const julianDate = timeMs / 86400000 + 2440587.5;
    const T = (julianDate - 2451545.0) / 36525; // Julian centuries since J2000.0

    // Mean Longitudes & Anomalies (in degrees)
    const degToRad = Math.PI / 180;
    
    // Mean elongation of the Moon (D)
    const D = (297.8501921 + 445267.1114034 * T) % 360;
    // Sun's mean anomaly (M)
    const M = (357.5291092 + 35999.0502909 * T) % 360;
    // Moon's mean anomaly (M')
    const Mprime = (134.9633964 + 477198.8675055 * T) % 360;
    // Moon's argument of latitude (F)
    const F = (93.2720950 + 483202.0175381 * T) % 360;

    // Synodic Age (Lunation progress)
    const synodicCycle = 29.530588853;
    const baseNewMoon = new Date("2000-01-06T18:14:00Z").getTime();
    const diffDays = (timeMs - baseNewMoon) / 86400000;
    let rawAge = diffDays % synodicCycle;
    if (rawAge < 0) rawAge += synodicCycle;
    const progress = rawAge / synodicCycle;

    // Illumination fraction calculation (Phase Angle)
    const phaseAngleRad = (180 - D - 6.289 * Math.sin(Mprime * degToRad)) * degToRad;
    const illumination = Math.max(0, Math.min(100, Math.round(((1 + Math.cos(phaseAngleRad)) / 2) * 100)));

    // Phase naming
    let phaseName = "New Moon";
    let phaseCode = "new";
    if (rawAge >= 1.845 && rawAge < 5.536) { phaseName = "Waxing Crescent"; phaseCode = "waxing-crescent"; }
    else if (rawAge >= 5.536 && rawAge < 9.228) { phaseName = "First Quarter"; phaseCode = "first-quarter"; }
    else if (rawAge >= 9.228 && rawAge < 12.919) { phaseName = "Waxing Gibbous"; phaseCode = "waxing-gibbous"; }
    else if (rawAge >= 12.919 && rawAge < 16.61) { phaseName = "Full Moon"; phaseCode = "full"; }
    else if (rawAge >= 16.61 && rawAge < 20.302) { phaseName = "Waning Gibbous"; phaseCode = "waning-gibbous"; }
    else if (rawAge >= 20.302 && rawAge < 23.993) { phaseName = "Third Quarter"; phaseCode = "third-quarter"; }
    else if (rawAge >= 23.993 && rawAge < 27.684) { phaseName = "Waning Crescent"; phaseCode = "waning-crescent"; }

    // Precise Distance (Major periodic terms in km)
    const MpR = Mprime * degToRad;
    const DR = D * degToRad;
    const MR = M * degToRad;
    const FR = F * degToRad;

    const distanceKm = Math.round(
      385000.55 - 
      20905.355 * Math.cos(MpR) - 
      3699.111 * Math.cos(2 * DR - MpR) - 
      2955.968 * Math.cos(2 * DR) - 
      569.925 * Math.cos(2 * MpR) +
      48.888 * Math.cos(MR)
    );

    const distanceLd = parseFloat((distanceKm / 384400).toFixed(4));

    // Vis-Viva equation for instant velocity (Standard Gravitational Parameter GM_Earth = 398600.4418 km³/s²)
    const semiMajorAxisA = 384400; 
    const gmEarth = 398600.4418;
    const velocityKms = parseFloat((Math.sqrt(gmEarth * ((2 / distanceKm) - (1 / semiMajorAxisA)))).toFixed(3));

    // Tidal influence coefficient (Inverse Cube relation relative to mean distance)
    const tideForceCoeff = parseFloat((Math.pow(384400 / distanceKm, 3)).toFixed(2));

    const isSupermoon = distanceKm < 360000 && illumination > 90;
    const isMicromoon = distanceKm > 400000 && illumination > 90;

    let orbitStateDesc = "Mean Orbit";
    if (distanceKm < 370000) orbitStateDesc = "Near Perigee";
    else if (distanceKm > 398000) orbitStateDesc = "Near Apogee";

    return {
      age: parseFloat(rawAge.toFixed(2)),
      phaseName,
      phaseCode,
      illumination,
      distanceKm,
      distanceLd,
      velocityKms,
      tideForceCoeff,
      isSupermoon,
      isMicromoon,
      orbitStateDesc,
      progress
    };
  }, [targetDate]);

  if (!luna) {
    return (
      <div className="flex items-center justify-center h-full bg-black border border-zinc-800 text-zinc-500 font-mono text-xs">
        INVALID DATE FORMAT
      </div>
    );
  }

  const renderMoonPhaseGraphic = () => {
    const isWaxing = luna.progress < 0.5;
    const isGibbous = luna.illumination > 50;

    return (
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-zinc-950 border border-zinc-800" />
        <div className="absolute inset-1 rounded-full bg-zinc-900 overflow-hidden">
          {luna.phaseCode === "new" ? (
            <div className="w-full h-full bg-zinc-900" />
          ) : luna.phaseCode === "full" ? (
            <div className="w-full h-full bg-amber-50/90 shadow-[inset_-4px_-4px_16px_rgba(255,255,255,0.7)]" />
          ) : (
            <div className="relative w-full h-full">
              <div 
                className="absolute inset-0 bg-amber-50/90 shadow-[inset_-4px_-4px_16px_rgba(255,255,255,0.5)] transition-all duration-300" 
                style={{
                  left: isWaxing ? "50%" : "0%",
                  right: isWaxing ? "0%" : "50%",
                  borderRadius: isGibbous ? "0%" : "100%",
                  transform: `scaleX(${isGibbous ? (luna.illumination - 50) / 50 : (50 - luna.illumination) / 50})`,
                  transformOrigin: isWaxing ? "left" : "right"
                }}
              />
              <div 
                className="absolute inset-0 bg-amber-50/90 shadow-[inset_-4px_-4px_16px_rgba(255,255,255,0.5)]" 
                style={{
                  left: isWaxing ? "50%" : "0%",
                  right: isWaxing ? "0%" : "50%",
                  visibility: isGibbous ? "visible" : "hidden"
                }}
              />
            </div>
          )}
          <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-black/10 border border-white/5 pointer-events-none" />
          <div className="absolute bottom-6 right-8 w-4 h-4 rounded-full bg-black/15 border border-white/5 pointer-events-none" />
        </div>
        <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(254,249,195,0.12)] pointer-events-none" />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black border border-zinc-800 rounded-none overflow-hidden font-mono text-xs select-none">
      {/* HEADER SECTION */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
              NATURAL SATELLITE TELEMETRY
            </span>
          </div>
          <h2 className="text-white text-base font-black tracking-wide mt-1">
            LUNA (EARTH&apos;S MOON)
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-none border border-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* VIEW SUB-NAVIGATION TAB */}
      <div className="flex border-b border-zinc-800 bg-zinc-950/80 p-1">
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`flex-1 py-1.5 text-[9px] font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "telemetry"
              ? "bg-zinc-800 text-white border border-zinc-700"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Globe className="w-3 h-3 text-cyan-400" /> Live Ephemeris
        </button>
        <button
          onClick={() => setActiveTab("geology")}
          className={`flex-1 py-1.5 text-[9px] font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "geology"
              ? "bg-zinc-800 text-white border border-zinc-700"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Layers className="w-3 h-3 text-amber-400" /> Internal Structure
        </button>
      </div>

      {/* BODY PANEL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {activeTab === "telemetry" ? (
          <>
            {/* LUNAR GRAPHIC CONTAINER */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 text-center flex flex-col justify-center gap-2">
              {renderMoonPhaseGraphic()}
              <div>
                <h3 className="text-white font-black text-sm tracking-widest uppercase mt-1">
                  {luna.phaseName}
                </h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-0.5">
                  Current illumination: <span className="text-yellow-500 font-bold">{luna.illumination}%</span>
                </p>
              </div>
            </div>

            {/* ASTRONOMICAL EVENTS */}
            {(luna.isSupermoon || luna.isMicromoon) && (
              <div className="p-3 bg-yellow-950/20 border border-yellow-900 text-yellow-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold uppercase text-[9px] tracking-wider">
                    Orbital Anomaly Detected
                  </h4>
                  <p className="text-[9px] mt-0.5 uppercase">
                    {luna.isSupermoon ? "SUPERMOON: Full moon occurring near Perigee!" : "MICROMOON: Full moon occurring near Apogee!"}
                  </p>
                </div>
              </div>
            )}

            {/* DYNAMIC TELEMETRY GRID */}
            <div className="space-y-2">
              <h4 className="text-zinc-500 text-[9px] font-bold tracking-wider uppercase">
                KEPLERIAN EPHEMERIS ({targetDate})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                  <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-cyan-500" /> Geocentric Distance
                  </span>
                  <span className="text-white font-bold text-xs">
                    {luna.distanceKm.toLocaleString()} km
                  </span>
                  <span className="text-zinc-400 text-[9px]">
                    {luna.distanceLd} LD
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                  <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                    <Compass className="w-3 h-3 text-yellow-500" /> Synodic Lunation
                  </span>
                  <span className="text-white font-bold text-xs">
                    {luna.age} Days
                  </span>
                  <span className="text-zinc-400 text-[9px]">
                    Cycle: {Math.round(luna.progress * 100)}%
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                  <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-emerald-500" /> Orbital Velocity
                  </span>
                  <span className="text-white font-bold text-xs">
                    {luna.velocityKms} km/s
                  </span>
                  <span className="text-zinc-400 text-[9px]">
                    {(luna.velocityKms * 3600).toLocaleString()} km/h
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                  <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                    <Waves className="w-3 h-3 text-blue-500" /> Tidal Acceleration
                  </span>
                  <span className="text-white font-bold text-xs">
                    {luna.tideForceCoeff}x
                  </span>
                  <span className="text-zinc-400 text-[9px]">
                    Rel. Earth Gravitational Pull
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* INTERNAL GEOLOGICAL LAYERS (GRAIL / APOLLO SEISMIC DATA) */
          <div className="space-y-3">
            <div className="p-2.5 bg-zinc-950 border border-zinc-900 text-zinc-400 text-[9px] flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed uppercase">
                Geological layering compiled from NASA GRAIL gravity mapping and Apollo passive seismic experiment data.
              </p>
            </div>

            {/* CROSS-SECTION GRAPHIC REPRESENTATION */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center">
              <span className="text-[9px] text-zinc-500 uppercase mb-2 font-bold tracking-wider">
                Concentric Interior Model (1,737 km Radius)
              </span>
              <div className="relative w-44 h-44 rounded-full border border-zinc-700 bg-zinc-900 overflow-hidden flex items-center justify-center">
                {/* Crust Layer */}
                <div className="w-[90%] h-[90%] rounded-full bg-amber-900/40 border border-amber-600/50 flex items-center justify-center">
                  {/* Upper Mantle */}
                  <div className="w-[75%] h-[75%] rounded-full bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center">
                    {/* Lower Mantle */}
                    <div className="w-[50%] h-[50%] rounded-full bg-orange-950/90 border border-orange-500/50 flex items-center justify-center">
                      {/* Fluid Outer Core */}
                      <div className="w-[30%] h-[30%] rounded-full bg-red-800 border border-red-500 flex items-center justify-center">
                        {/* Solid Inner Core */}
                        <div className="w-[45%] h-[45%] rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DETAILED INTERACTIVE LAYER BREAKDOWN */}
            <div className="space-y-2">
              <h4 className="text-zinc-500 text-[9px] font-bold tracking-wider uppercase">
                SEISMIC STRATIGRAPHY
              </h4>
              <div className="space-y-1.5">
                {LUNAR_LAYERS.map((layer, index) => (
                  <div
                    key={layer.name}
                    onMouseEnter={() => setHoveredLayer(index)}
                    onMouseLeave={() => setHoveredLayer(null)}
                    className={`p-2.5 border transition-all ${layer.color} ${
                      hoveredLayer === index ? "brightness-125 scale-[1.01]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[10px] uppercase">
                      <span>{layer.name}</span>
                      <span className="text-white bg-black/60 px-1.5 py-0.5 border border-zinc-800">
                        {layer.depth}
                      </span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-x-2 text-[9px] text-zinc-400">
                      <div>
                        <span className="text-zinc-500 uppercase">Composition:</span>{" "}
                        <span>{layer.comp}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 uppercase">Temp:</span>{" "}
                        <span className="text-amber-400 font-bold">{layer.temp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GENERAL PHYSICAL CONSTANTS */}
        <div className="space-y-2 pt-2 border-t border-zinc-900">
          <h4 className="text-zinc-500 text-[9px] font-bold tracking-wider uppercase">
            PHYSICAL CONSTANTS
          </h4>
          <div className="border border-zinc-800 divide-y divide-zinc-900 text-[10px] text-zinc-400">
            <div className="p-2 flex justify-between uppercase">
              <span className="text-zinc-500">Mean Radius</span>
              <span className="text-white font-bold">1,737.4 km</span>
            </div>
            <div className="p-2 flex justify-between uppercase">
              <span className="text-zinc-500">Mass</span>
              <span className="text-white font-bold">7.342 x 10²² kg (0.0123 Earths)</span>
            </div>
            <div className="p-2 flex justify-between uppercase">
              <span className="text-zinc-500">Surface Gravity</span>
              <span className="text-white font-bold">1.62 m/s² (0.166g)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
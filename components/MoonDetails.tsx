"use client";

import React from "react";
import { X, Globe, Ruler, Gauge, Compass, Waves, ArrowUpRight, Circle } from "lucide-react";

interface MoonDetailsProps {
  targetDate: string;
  onClose: () => void;
}

export default function MoonDetails({ targetDate, onClose }: MoonDetailsProps) {
  // Live lunar properties calculator based on selected target date
  const getMoonProperties = (dateString: string) => {
    const target = new Date(dateString);
    // Known New Moon reference date
    const baseNewMoon = new Date("2000-01-06T18:14:00Z");
    const diffTime = target.getTime() - baseNewMoon.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // Synodic Month (Lunar Phase Cycle)
    const synodicCycle = 29.530588853;
    let rawAge = diffDays % synodicCycle;
    if (rawAge < 0) rawAge += synodicCycle;
    
    const age = parseFloat(rawAge.toFixed(2));
    const progress = rawAge / synodicCycle; // 0.0 to 1.0
    
    // Determine Moon Phase and Illumination %
    let phaseName = "";
    let phaseCode = "";
    
    // 0 to 2*PI angle of the phase
    const angle = progress * 2 * Math.PI;
    const illumRatio = (1 - Math.cos(angle)) / 2;
    const illumination = Math.round(illumRatio * 100);

    if (age < 1.845) {
      phaseName = "New Moon";
      phaseCode = "new";
    } else if (age < 5.536) {
      phaseName = "Waxing Crescent";
      phaseCode = "waxing-crescent";
    } else if (age < 9.228) {
      phaseName = "First Quarter";
      phaseCode = "first-quarter";
    } else if (age < 12.919) {
      phaseName = "Waxing Gibbous";
      phaseCode = "waxing-gibbous";
    } else if (age < 16.61) {
      phaseName = "Full Moon";
      phaseCode = "full";
    } else if (age < 20.302) {
      phaseName = "Waning Gibbous";
      phaseCode = "waning-gibbous";
    } else if (age < 23.993) {
      phaseName = "Third Quarter";
      phaseCode = "third-quarter";
    } else if (age < 27.684) {
      phaseName = "Waning Crescent";
      phaseCode = "waning-crescent";
    } else {
      phaseName = "New Moon";
      phaseCode = "new";
    }

    // Anomalistic Month (Perigee to Apogee Cycle, ~27.55 days)
    const anomalisticMonth = 27.55455;
    const orbitAngle = (diffDays / anomalisticMonth) * 2 * Math.PI;
    
    // Distances in km: Perigee (closest) ~363,300km, Apogee (farthest) ~405,500km
    const distBase = 384400; // mean distance
    const distAmplit = 21100;
    const distanceKm = Math.round(distBase - distAmplit * Math.cos(orbitAngle));
    const distanceLd = parseFloat((distanceKm / 384400).toFixed(4));

    // Instantaneous orbital speed in km/s (based on elliptical vis-viva equation)
    const velocityKms = parseFloat((1.022 * (1 + 0.0549 * Math.cos(orbitAngle))).toFixed(3));

    // Tidal gravitational pull coefficient (varies inversely with cube of distance d^3)
    const tideForceCoeff = parseFloat((Math.pow(distBase / distanceKm, 3)).toFixed(2));

    // Astronomical events flags
    const isSupermoon = distanceKm < (distBase - distAmplit * 0.8) && illumination > 95;
    const isMicromoon = distanceKm > (distBase + distAmplit * 0.8) && illumination > 95;
    
    // Orbital node state description
    let orbitStateDesc = "Mean Orbit";
    if (distanceKm < 370000) {
      orbitStateDesc = "Perigee (Near Point)";
    } else if (distanceKm > 398000) {
      orbitStateDesc = "Apogee (Far Point)";
    }

    return {
      age,
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
  };

  const luna = getMoonProperties(targetDate);

  // Helper to generate CSS-based representation of the Moon's phase
  const renderMoonPhaseGraphic = () => {
    const isWaxing = luna.progress < 0.5;
    const isGibbous = luna.illumination > 50;

    return (
      <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
        {/* Outer Shadow Ring */}
        <div className="absolute inset-0 rounded-full bg-zinc-950 border border-zinc-800" />
        
        {/* The Dark Side (unlit) */}
        <div className="absolute inset-1 rounded-full bg-zinc-900 overflow-hidden">
          {/* The Lit Side representation */}
          {luna.phaseCode === "new" ? (
            <div className="w-full h-full bg-zinc-900" />
          ) : luna.phaseCode === "full" ? (
            <div className="w-full h-full bg-amber-50/90 shadow-[inset_-4px_-4px_16px_rgba(255,255,255,0.7)]" />
          ) : (
            <div className="relative w-full h-full flex">
              {/* Render dynamic waxing/waning overlay */}
              <div 
                className={`absolute inset-0 bg-amber-50/90 shadow-[inset_-4px_-4px_16px_rgba(255,255,255,0.5)] transition-all duration-300`} 
                style={{
                  clipPath: isWaxing
                    ? `polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)`
                    : `polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)`
                }}
              />
              <div 
                className="absolute inset-0 bg-zinc-900 transition-all duration-300"
                style={{
                  borderRadius: "50%",
                  transform: `scaleX(${Math.abs(50 - luna.illumination) / 50})`,
                  clipPath: isGibbous 
                    ? (isWaxing ? "none" : "none") // custom clip if needed
                    : "none",
                  backgroundColor: isGibbous ? "rgb(254, 252, 232)" : "rgb(24, 24, 27)"
                }}
              />
            </div>
          )}

          {/* Lunar crater highlights on the graphic */}
          <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-black/10 border border-white/5" />
          <div className="absolute bottom-6 right-8 w-4 h-4 rounded-full bg-black/15 border border-white/5" />
          <div className="absolute top-12 right-6 w-2 h-2 rounded-full bg-black/10 border border-white/5" />
          <div className="absolute bottom-10 left-10 w-1.5 h-1.5 rounded-full bg-black/10" />
        </div>

        {/* Glow */}
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
              CELESTIAL SYSTEM DETECTOR
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

      {/* BODY PANEL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        
        {/* LUNAR GRAPHIC CONTAINER */}
        <div className="p-5 bg-zinc-950 border border-zinc-900 text-center flex flex-col justify-center gap-3">
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

        {/* SPECIAL CONSTRAINTS OR FLAGS */}
        {(luna.isSupermoon || luna.isMicromoon) && (
          <div className="p-3 bg-yellow-950/20 border border-yellow-900 text-yellow-400 flex items-center gap-2">
            <Globe className="w-4 h-4 text-yellow-500" />
            <div>
              <h4 className="font-bold uppercase text-[9px] tracking-wider">
                Astronomical Event Detected
              </h4>
              <p className="text-[9px] mt-0.5 uppercase">
                {luna.isSupermoon ? "SUPERMOON: Full moon is occurring near Perigee!" : "MICRO-MOON: Full moon is occurring near Apogee!"}
              </p>
            </div>
          </div>
        )}

        {/* REAL PROPERTIES GRID */}
        <div className="space-y-2">
          <h4 className="text-zinc-500 text-[9px] font-bold tracking-wider uppercase">
            LIVE DYNAMIC PROPERTIES ({targetDate})
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            
            {/* Property: Distance */}
            <div className="p-3 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
              <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                <Ruler className="w-3 h-3 text-cyan-500" /> Distance
              </span>
              <span className="text-white font-bold text-xs">
                {luna.distanceKm.toLocaleString()} km
              </span>
              <span className="text-zinc-400 text-[9px]">
                {luna.distanceLd} LD
              </span>
            </div>

            {/* Property: Synodic Age */}
            <div className="p-3 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
              <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                <Compass className="w-3 h-3 text-yellow-500" /> Lunation Age
              </span>
              <span className="text-white font-bold text-xs">
                {luna.age} Days
              </span>
              <span className="text-zinc-400 text-[9px]">
                Cycle Progress: {Math.round(luna.progress * 100)}%
              </span>
            </div>

            {/* Property: Orbital Velocity */}
            <div className="p-3 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
              <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                <Gauge className="w-3 h-3 text-emerald-500" /> Velocity
              </span>
              <span className="text-white font-bold text-xs">
                {luna.velocityKms} km/s
              </span>
              <span className="text-zinc-400 text-[9px]">
                {(luna.velocityKms * 3600).toLocaleString()} km/h
              </span>
            </div>

            {/* Property: Tidal Influence */}
            <div className="p-3 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
              <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                <Waves className="w-3 h-3 text-blue-500" /> Tidal Effect
              </span>
              <span className="text-white font-bold text-xs">
                {luna.tideForceCoeff}x
              </span>
              <span className="text-zinc-400 text-[9px]">
                Rel. Gravitational Force
              </span>
            </div>

          </div>
        </div>

        {/* ORBIT STATE SUMMARY */}
        <div className="p-3 bg-zinc-950 border border-zinc-900 space-y-1">
          <span className="text-zinc-500 text-[9px] uppercase font-bold">
            Orbit Node State
          </span>
          <div className="text-white font-bold text-xs uppercase tracking-wide flex items-center justify-between">
            <span>{luna.orbitStateDesc}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <p className="text-zinc-500 text-[9px] leading-relaxed uppercase mt-1">
            The Moon&apos;s orbit is elliptical. Gravitational pull is strongest at Perigee, which raises ocean tides on Earth by up to 30% compared to Apogee.
          </p>
        </div>

        {/* GENERAL PHYSICAL CONSTANTS */}
        <div className="space-y-2">
          <h4 className="text-zinc-500 text-[9px] font-bold tracking-wider uppercase">
            PHYSICAL CHARACTERISTICS
          </h4>
          <div className="border border-zinc-800 divide-y divide-zinc-900 text-[10px] text-zinc-400">
            <div className="p-2 flex justify-between uppercase">
              <span className="text-zinc-500">Classification</span>
              <span className="text-white font-bold">Natural Satellite</span>
            </div>
            <div className="p-2 flex justify-between uppercase">
              <span className="text-zinc-500">Diameter</span>
              <span className="text-white font-bold">3,474.8 km</span>
            </div>
            <div className="p-2 flex justify-between uppercase">
              <span className="text-zinc-500">Mass</span>
              <span className="text-white font-bold">7.342 x 10²² kg</span>
            </div>
            <div className="p-2 flex justify-between uppercase">
              <span className="text-zinc-500">Gravity</span>
              <span className="text-white font-bold">1.62 m/s² (0.166g)</span>
            </div>
            <div className="p-2 flex justify-between uppercase">
              <span className="text-zinc-500">Escape Velocity</span>
              <span className="text-white font-bold">2.38 km/s</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { Search, ShieldAlert, Calendar, AlertTriangle, HelpCircle, Pause, Play, RefreshCw, Globe, Sun } from "lucide-react";
import { Asteroid } from "@/lib/nasa";

interface ControlPanelProps {
  asteroids: Asteroid[];
  selectedId: string | null;
  onSelectAsteroid: (id: string | null) => void;
  viewMode: "geocentric" ;
  onViewModeChange: (mode: "geocentric") => void;
  simulationSpeed: number;
  onSimulationSpeedChange: (speed: number) => void;
  filterHazardousOnly: boolean;
  onFilterHazardousChange: (val: boolean) => void;
  filterSizeMin: number;
  onFilterSizeChange: (val: number) => void;
  targetDate: string;
  onTargetDateChange: (date: string) => void;
  loading: boolean;
  onRefetch: () => void;
}

export default function ControlPanel({
  asteroids,
  selectedId,
  onSelectAsteroid,
  viewMode,
  onViewModeChange,
  simulationSpeed,
  onSimulationSpeedChange,
  filterHazardousOnly,
  onFilterHazardousChange,
  filterSizeMin,
  onFilterSizeChange,
  targetDate,
  onTargetDateChange,
  loading,
  onRefetch
}: ControlPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // Memoize filtered items to prevent computational layout blocking on simulation ticks
  const filteredAsteroids = useMemo(() => {
    return asteroids.filter((ast) => {
      // Search query
      if (searchQuery && !ast.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Hazardous filter
      if (filterHazardousOnly && !ast.isHazardous) {
        return false;
      }
      // Min size threshold filter
      const avgSize = (ast.diameterMinMeters + ast.diameterMaxMeters) / 2;
      if (avgSize < filterSizeMin) {
        return false;
      }
      return true;
    });
  }, [asteroids, searchQuery, filterHazardousOnly, filterSizeMin]);

  return (
    <div id="control-panel" className="flex flex-col h-full bg-black border border-zinc-800 rounded-none overflow-y-auto shadow-none font-mono text-xs scrollbar-thin">
      
      {/* 1. ORBIT VIEW SELECTOR (Restored from Props) */}
      <div className="border-b border-zinc-800 p-3 bg-zinc-950/20 grid grid-cols-2 gap-2">
        <button
          onClick={() => onViewModeChange("geocentric")}
          className={`flex items-center justify-center gap-1.5 py-1.5 border uppercase text-[10px] font-bold transition-all ${
            viewMode === "geocentric"
              ? "bg-white text-black border-white"
              : "bg-transparent text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
          }`}
        >
          <Globe className="w-3 h-3" />
          Geocentric
        </button>
        <button
          onClick={() => onViewModeChange("heliocentric")}
          className={`flex items-center justify-center gap-1.5 py-1.5 border uppercase text-[10px] font-bold transition-all ${
            viewMode === "heliocentric"
              ? "bg-white text-black border-white"
              : "bg-transparent text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
          }`}
        >
      </div>

      {/* 2. EXPANDABLE OBSERVATION SETTINGS & FILTERS DROPDOWN */}
      <div className="border-b border-zinc-800 bg-zinc-950/40">
        <button
          id="toggle-settings-btn"
          onClick={() => setSettingsExpanded(!settingsExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors text-[10px] font-bold uppercase tracking-wider text-zinc-300"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            Observation & Filter Settings
          </span>
          <span className="text-zinc-500 font-mono text-[9px] hover:text-white">
            {settingsExpanded ? "[-]" : "[+]"}
          </span>
        </button>

        {settingsExpanded && (
          <div className="border-t border-zinc-900 bg-black/90 p-4 space-y-4">
            {/* DATE SELECTOR */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] text-zinc-400 flex items-center gap-1.5 font-bold uppercase">
                  Observation Date
                </span>
                {loading && <span className="text-[8px] text-zinc-500 animate-pulse font-mono">Syncing...</span>}
              </div>
              <div className="flex gap-2">
                <input
                  id="date-picker"
                  type="date"
                  value={targetDate}
                  onChange={(e) => onTargetDateChange(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-none px-2.5 py-1.5 text-xs text-white focus:border-zinc-500 outline-none color-scheme-dark"
                />
                <button
                  id="refetch-btn"
                  onClick={onRefetch}
                  disabled={loading}
                  className="px-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-none transition-colors disabled:opacity-50"
                  title="Reload Space Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* SIMULATION SPEED */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] text-zinc-400">
                <span className="font-bold uppercase">Time Warp Speed</span>
                <span className="text-white font-bold font-mono">
                  {simulationSpeed === 0 ? "Paused" : `${simulationSpeed} days/sec`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="play-pause-btn"
                  onClick={() => onSimulationSpeedChange(simulationSpeed === 0 ? 15 : 0)}
                  className="p-2 bg-zinc-900 text-zinc-300 hover:text-white rounded-none border border-zinc-800 hover:border-zinc-700 transition-all"
                >
                  {simulationSpeed === 0 ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
                <input
                  id="speed-slider"
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={simulationSpeed}
                  onChange={(e) => onSimulationSpeedChange(parseInt(e.target.value, 10))}
                  className="flex-1 h-1 bg-zinc-800 appearance-none cursor-pointer accent-white"
                />
                <button
                  id="warp-speed-btn"
                  onClick={() => onSimulationSpeedChange(150)}
                  className="p-1.5 bg-zinc-900 text-zinc-400 hover:text-white rounded-none border border-zinc-800 hover:border-zinc-700 transition-all text-[9px]"
                  title="Warp speed (150x)"
                >
                  Max
                </button>
              </div>
            </div>

            {/* FILTERS SECTION */}
            <div className="space-y-3 pt-2 border-t border-zinc-900">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3 h-3 text-zinc-600" />
                <input
                  id="asteroid-search-input"
                  type="text"
                  placeholder="Search by name or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-none pl-8 pr-3 py-1 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-600 outline-none transition-colors"
                />
              </div>

              {/* Hazard Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-zinc-300 uppercase flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  Show Hazardous Only
                </span>
                <button
                  id="hazard-toggle-checkbox"
                  role="checkbox"
                  aria-checked={filterHazardousOnly}
                  onClick={() => onFilterHazardousChange(!filterHazardousOnly)}
                  className="font-mono text-[9px] text-zinc-400 hover:text-white uppercase px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-none transition-all"
                >
                  {filterHazardousOnly ? "[X] YES" : "[ ] NO"}
                </button>
              </div>

              {/* Size Filter Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] text-zinc-400">
                  <span className="uppercase">Min Size</span>
                  <span className="text-white font-bold">{filterSizeMin} meters</span>
                </div>
                <input
                  id="size-filter-slider"
                  type="range"
                  min="0"
                  max="1000"
                  step="20"
                  value={filterSizeMin}
                  onChange={(e) => onFilterSizeChange(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. PINNED CELESTIAL TARGET: THE MOON */}
      <div className="border-b border-zinc-800 bg-zinc-950 p-2.5">
        <div
          id="moon-target-card"
          onClick={() => onSelectAsteroid(selectedId === "moon" ? null : "moon")}
          className={`p-2.5 cursor-pointer flex flex-col gap-1 transition-all border ${
            selectedId === "moon"
              ? "bg-cyan-950/60 border-cyan-500 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]"
              : "bg-black hover:bg-zinc-900 border-zinc-800 text-zinc-300"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-200 text-xs select-none">
                🌙
              </div>
              <div>
                <h5 className="text-white text-xs font-bold leading-none uppercase flex items-center gap-1.5">
                  The Moon (Luna)
                  {selectedId === "moon" && (
                    <span className="text-[8px] bg-cyan-900/80 text-cyan-300 px-1 py-0.2 border border-cyan-500/40 font-mono">
                      ACTIVE TARGET
                    </span>
                  )}
                </h5>
                <p className="text-[8px] text-zinc-500 uppercase mt-1">
                  Earth&apos;s Natural Satellite • 384,400 KM
                </p>
              </div>
            </div>
            <span className="text-[9px] font-mono text-cyan-400 font-bold bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">
              1.0 LD
            </span>
          </div>
        </div>
      </div>

      {/* 4. ASTEROID LIST HEADER */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 text-[10px]">
        <span className="text-zinc-400 font-bold uppercase">
          Space Rocks Feed ({filteredAsteroids.length})
        </span>
        <span className="text-zinc-500 uppercase">Nearest First</span>
      </div>

      {/* 5. ASTEROID LIST FEED */}
      <div className="flex-1 min-h-[140px] overflow-y-auto divide-y divide-zinc-900 scrollbar-thin">
        {filteredAsteroids.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-zinc-700 animate-pulse" />
            <p className="text-zinc-500 text-[10px] uppercase">NO OBJECTS DETECTED</p>
            <p className="text-zinc-600 text-[9px] uppercase">ADJUST FILTERS</p>
          </div>
        ) : (
          filteredAsteroids.map((ast) => {
            const isSelected = ast.id === selectedId;
            const avgSize = Math.round((ast.diameterMinMeters + ast.diameterMaxMeters) / 2);
            
            return (
              <div
                key={ast.id}
                id={`asteroid-card-${ast.id}`}
                onClick={() => onSelectAsteroid(isSelected ? null : ast.id)}
                className={`p-3 cursor-pointer flex flex-col gap-1 transition-all ${
                  isSelected
                    ? "bg-zinc-900 border-l-2 border-white"
                    : "hover:bg-zinc-950 border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="truncate">
                    <h5 className="text-white text-xs font-bold truncate leading-none">
                      {ast.name}
                    </h5>
                  </div>
                  {ast.isHazardous && (
                    <span className="flex-shrink-0 flex items-center gap-1 bg-red-950 text-red-500 text-[8px] px-1.5 py-0.5 border border-red-900 font-bold leading-none uppercase tracking-wider">
                      <AlertTriangle className="w-2 h-2" />
                      HAZARD
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1 mt-2 text-[9px] text-zinc-500 leading-none">
                  <div>
                    <span className="block text-zinc-600 uppercase text-[8px] mb-0.5">Size</span>
                    <span className="font-bold text-zinc-300">{avgSize}m</span>
                  </div>
                  <div>
                    <span className="block text-zinc-600 uppercase text-[8px] mb-0.5">Velocity</span>
                    <span className="font-bold text-zinc-300">{ast.velocityKms.toFixed(1)}k/s</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-zinc-600 uppercase text-[8px] mb-0.5">Miss</span>
                    <span className={`font-bold ${ast.missDistanceLd < 1 ? "text-amber-500 font-black" : "text-zinc-300"}`}>
                      {ast.missDistanceLd.toFixed(1)} LD
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
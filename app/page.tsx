"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Orbit, 
  ShieldAlert, 
  Activity, 
  AlertOctagon, 
  Database,
  Table,
  Target,
  Globe
} from "lucide-react";
import AsteroidSimulator from "@/components/AsteroidSimulator";
import ControlPanel from "@/components/ControlPanel";
import AsteroidDetails from "@/components/AsteroidDetails";
import MoonDetails from "@/components/MoonDetails";
import { Asteroid } from "@/lib/nasa";

export default function Home() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPredictedRoute, setShowPredictedRoute] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(15);
  const [filterHazardousOnly, setFilterHazardousOnly] = useState<boolean>(false);
  const [filterSizeMin, setFilterSizeMin] = useState<number>(0);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);
  
  // Menu tab state to see individual views one at a time to simplify UI clutter
  const [viewTab, setViewTab] = useState<"simulator" | "feed">("simulator");
  
  const [targetDate, setTargetDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleSelectAsteroid = useCallback((id: string | null) => {
    setSelectedId(id);
    if (!id) {
      setShowPredictedRoute(false);
    }
  }, []);

  // Synchronize and fetch asteroid data from server-side API route
  const fetchAsteroidsData = useCallback(async (dateStr: string, active: boolean = true) => {
    if (!dateStr) return;

    setTimeout(() => {
      if (active) {
        setLoading(true);
        setError(null);
      }
    }, 0);

    try {
      const res = await fetch(`/api/asteroids?date=${dateStr}`);
      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }
      const data = await res.json();
      if (active) {
        if (data.success) {
          setAsteroids(data.asteroids);
          if (data.asteroids.length > 0) {
            setSelectedId((prevSelected) => {
              if (prevSelected === "moon") return "moon";
              if (!prevSelected) return null;
              const stillExists = data.asteroids.some((a: Asteroid) => a.id === prevSelected);
              return stillExists ? prevSelected : null;
            });
          }
        } else {
          throw new Error(data.error || "Failed to load asteroids");
        }
      }
    } catch (err: unknown) {
      if (active) {
        const errorMessage = err instanceof Error ? err.message : "Failed to sync with space orbital sensors.";
        setError(errorMessage);
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      fetchAsteroidsData(targetDate, active);
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [targetDate, fetchAsteroidsData]);

  const selectedAsteroid = asteroids.find((a) => a.id === selectedId) || null;

  // Global stats
  const totalCount = asteroids.length;
  const hazardousCount = asteroids.filter((a) => a.isHazardous).length;
  
  return (
    <main className="h-screen w-full relative flex flex-col font-mono transition-colors duration-300 overflow-hidden bg-black text-zinc-300">
      
      {/* 1. RETRO-SCIENTIFIC HEADER & VIEW SELECTOR */}
      <header className="flex-none relative z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 border-b border-zinc-800 transition-colors bg-zinc-950">
        
        {/* Title Block */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 border border-cyan-500/40 bg-zinc-950 text-cyan-400 rounded-none shadow-[0_0_12px_rgba(34,211,238,0.2)]">
            <Globe className="w-4.5 h-4.5 text-cyan-400 animate-[spin_16s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black tracking-widest leading-none text-white">
                LIVE ASTEROID 3D SIMULATOR
              </h1>
            </div>
            <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-cyan-400" />
              NASA Near-Earth Object Observation Stream
            </p>
          </div>
        </div>

        {/* 2. THE CHOSEN INDIVIDUAL VIEWS TOGGLE (MENU TOGGLE) */}
        <div className="flex items-center justify-center">
          <div className="flex border border-zinc-800 bg-black p-0.5 rounded-none">
            <button
              id="tab-simulator-btn"
              onClick={() => setViewTab("simulator")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase transition-all rounded-none ${
                viewTab === "simulator" 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Orbit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3D Space</span> Simulator
            </button>
            <button
              id="tab-feed-btn"
              onClick={() => setViewTab("feed")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase transition-all rounded-none border-l border-zinc-900 ${
                viewTab === "feed" 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Detailed</span> Telemetry Grid
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2"></div>
      </header>

      {/* ERROR STATUS BANNER */}
      {error && (
        <div className="relative z-20 bg-red-950 border-b border-red-900 text-red-500 p-2.5 text-[10px] flex items-center gap-2 justify-center">
          <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-bold uppercase">{error}</span>
          <button 
            id="dismiss-error-btn"
            onClick={() => setError(null)} 
            className="ml-4 underline font-bold uppercase hover:text-white"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 2. MAIN OBSERVER WORKSPACE CONTAINER */}
      <div className="flex-1 w-full relative overflow-hidden flex flex-col min-h-0">
        
        {/* VIEW TAB A: 3D SPACE SIMULATOR */}
        {viewTab === "simulator" && (
          <div className="relative w-full h-full overflow-hidden">
            {/* Background 3D Canvas */}
            <div className="absolute inset-0 z-0">
              <AsteroidSimulator
                asteroids={asteroids}
                selectedId={selectedId}
                onSelectAsteroid={handleSelectAsteroid}
                simulationSpeed={simulationSpeed}
                filterHazardousOnly={filterHazardousOnly}
                filterSizeMin={filterSizeMin}
                showPredictedRoute={showPredictedRoute}
              />
            </div>

            {/* Sidebar Toggle Buttons Overlay */}
            <div className="absolute top-3 left-3 z-40 flex gap-2 pointer-events-auto">
              <button
                id="toggle-left-sidebar-btn"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="bg-black/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 text-[9px] font-bold uppercase rounded-none transition-colors shadow-lg"
              >
                {leftSidebarOpen ? "[-] Hide Filters" : "[+] Show Filters"}
              </button>
            </div>

            <div className="absolute top-3 right-3 z-40 flex gap-2 pointer-events-auto">
              <button
                id="toggle-right-sidebar-btn"
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className="bg-black/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 text-[9px] font-bold uppercase rounded-none transition-colors shadow-lg"
              >
                {rightSidebarOpen ? "[-] Hide Details" : "[+] Show Details"}
              </button>
            </div>

            {/* Sidebar Left Controls */}
            <div className={`absolute top-12 left-3 bottom-3 z-30 w-[calc(100%-1.5rem)] sm:w-[320px] pointer-events-none transition-all duration-300 ${
              leftSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[calc(100%+1.5rem)] opacity-0"
            }`}>
              <div className="pointer-events-auto h-full overflow-y-auto">
                <ControlPanel
                  asteroids={asteroids}
                  selectedId={selectedId}
                  onSelectAsteroid={handleSelectAsteroid}
                  simulationSpeed={simulationSpeed}
                  onSimulationSpeedChange={setSimulationSpeed}
                  filterHazardousOnly={filterHazardousOnly}
                  onFilterHazardousChange={setFilterHazardousOnly}
                  filterSizeMin={filterSizeMin}
                  onFilterSizeChange={setFilterSizeMin}
                  targetDate={targetDate}
                  onTargetDateChange={setTargetDate}
                  loading={loading}
                  onRefetch={() => fetchAsteroidsData(targetDate)}
                />
              </div>
            </div>

            {/* Sidebar Right Target Details */}
            <div className={`absolute top-12 right-3 bottom-3 z-30 w-[calc(100%-1.5rem)] sm:w-[380px] pointer-events-none transition-all duration-300 ${
              rightSidebarOpen ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+1.5rem)] opacity-0"
            }`}>
              <div className="pointer-events-auto h-full overflow-y-auto">
                {selectedId === "moon" ? (
                  <MoonDetails
                    targetDate={targetDate}
                    onClose={() => handleSelectAsteroid(null)}
                  />
                ) : selectedAsteroid ? (
                  <AsteroidDetails
                    asteroid={selectedAsteroid}
                    onClose={() => handleSelectAsteroid(null)}
                    showPredictedRoute={showPredictedRoute}
                    onTogglePredictedRoute={setShowPredictedRoute}
                  />
                ) : (
                  <div className="hidden sm:flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-md border border-zinc-800 text-center pointer-events-auto select-none max-w-sm ml-auto shadow-2xl">
                    <div className="w-10 h-10 border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-500 mb-3 animate-pulse">
                      <Target className="w-5 h-5" />
                    </div>
                    <h4 className="text-white text-[10px] font-bold uppercase tracking-wider">
                      SPACE SEARCH INACTIVE
                    </h4>
                    <p className="text-zinc-500 text-[9px] mt-1.5 leading-relaxed uppercase">
                      Select a space rock or the Moon from the list to synchronize details, orbital path, and/or size comparisons!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW TAB C: DETAILED TELEMETRY GRID/TABLE */}
        {viewTab === "feed" && (
          <div className="w-full h-full p-4 overflow-y-auto flex flex-col lg:flex-row gap-4 items-start">
            
            {/* Grid / Table area */}
            <div className="flex-1 w-full bg-black border border-zinc-800 p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-white text-xs font-black uppercase tracking-wider">
                    DETAILED OBSERVED NEOS FOR {targetDate}
                  </h3>
                  <p className="text-[9px] text-zinc-500 uppercase mt-0.5">
                    Complete physical parameters and planetary coordinates catalog
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-400">
                    TOTAL DETECTED: <b className="text-white">{totalCount}</b>
                  </span>
                  <span className="text-[10px] text-red-500">
                    HAZARDOUS: <b className="text-red-400">{hazardousCount}</b>
                  </span>
                </div>
              </div>

              {/* Grid Content */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-black">
                      <th className="py-2.5 px-2">Catalog Designation</th>
                      <th className="py-2.5 px-2">Estimated Diameter</th>
                      <th className="py-2.5 px-2">Relative Velocity</th>
                      <th className="py-2.5 px-2">Miss Distance (Lunar)</th>
                      <th className="py-2.5 px-2">Miss Distance (KM)</th>
                      <th className="py-2.5 px-2">Hazard Status</th>
                      <th className="py-2.5 px-2 text-right">Orbit Parameters</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {asteroids.map((ast) => {
                      const avgSize = Math.round((ast.diameterMinMeters + ast.diameterMaxMeters) / 2);
                      const isSelected = ast.id === selectedId;
                      return (
                        <tr 
                          key={ast.id}
                          onClick={() => setSelectedId(isSelected ? null : ast.id)}
                          className={`cursor-pointer transition-colors uppercase ${
                            isSelected 
                              ? "bg-zinc-900 text-white font-bold" 
                              : "hover:bg-zinc-950 text-zinc-400"
                          }`}
                        >
                          <td className="py-2.5 px-2 text-white font-bold">
                            {ast.name}
                          </td>
                          <td className="py-2.5 px-2">
                            {avgSize} METERS ({ast.diameterMinMeters}-{ast.diameterMaxMeters}m)
                          </td>
                          <td className="py-2.5 px-2">
                            {ast.velocityKms.toFixed(2)} KM/S
                          </td>
                          <td className={`py-2.5 px-2 ${ast.missDistanceLd < 1 ? "text-amber-500" : ""}`}>
                            {ast.missDistanceLd.toFixed(2)} LD
                          </td>
                          <td className="py-2.5 px-2">
                            {ast.missDistanceKm.toLocaleString()} KM
                          </td>
                          <td className="py-2.5 px-2">
                            {ast.isHazardous ? (
                              <span className="text-red-500 font-black">HAZARDOUS</span>
                            ) : (
                              <span className="text-zinc-600">SECURE</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right text-zinc-500">
                            {ast.orbitalParams ? (
                              `a=${ast.orbitalParams.semiMajorAxisAu.toFixed(2)} e=${ast.orbitalParams.eccentricity.toFixed(2)}`
                            ) : (
                              "N/A"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar Right Target Details */}
            <div className="w-full lg:w-[380px] lg:sticky lg:top-0 flex-shrink-0 flex flex-col">
              {selectedAsteroid ? (
                <AsteroidDetails
                  asteroid={selectedAsteroid}
                  onClose={() => setSelectedId(null)}
                />
              ) : (
                <div className="bg-black border border-zinc-800 p-6 text-center select-none flex-1 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-500 mb-3 animate-pulse">
                    <Table className="w-5 h-5" />
                  </div>
                  <h4 className="text-white text-[10px] font-bold uppercase tracking-wider">
                    SEARCH STANDBY
                  </h4>
                  <p className="text-zinc-500 text-[9px] mt-1.5 leading-relaxed uppercase">
                    Select any catalog row from the telemetry table to synchronize sensor values and display orbital dimensions.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* FOOTER BAR */}
      <footer className="flex-none relative z-20 py-2.5 px-4 border-t border-zinc-800 font-mono text-[9px] flex flex-col md:flex-row items-center justify-between gap-2 transition-colors duration-300 bg-zinc-950 text-zinc-500">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-zinc-400" />
          <span className="uppercase text-zinc-500">DATABASE STREAM: NASA NEO API (NEOWS)</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-500 uppercase">
          <span>COORDINATES: GEOCENTRIC ZENITH</span>
          <span>SYSTEM CLOCK: UTC</span>
        </div>
      </footer>

    </main>
  );
}
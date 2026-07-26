"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Orbit, 
  Activity, 
  AlertOctagon, 
  Database,
  Table,
  Target,
  Globe,
  Bomb,
  Rocket,
  X,
  SlidersHorizontal,
  Info
} from "lucide-react";

import AsteroidSimulator from "@/components/AsteroidSimulator";
import ControlPanel from "@/components/ControlPanel";
import AsteroidDetails from "@/components/AsteroidDetails";
import MoonDetails from "@/components/MoonDetails";
import ImpactSimulatorModal from "@/components/ImpactSimulatorModal";
import DartDeflectionModal from "@/components/DartDeflectionModal";
import { Asteroid } from "@/lib/nasa";

export default function Home() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPredictedRoute, setShowPredictedRoute] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(15);
  const [filterHazardousOnly, setFilterHazardousOnly] = useState<boolean>(false);
  const [filterSizeMin, setFilterSizeMin] = useState<number>(0);
  
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);
  
  const [viewTab, setViewTab] = useState<"simulator" | "feed">("simulator");
  
  const [activeImpactModalAsteroid, setActiveImpactModalAsteroid] = useState<Asteroid | null>(null);
  const [activeDartModalAsteroid, setActiveDartModalAsteroid] = useState<Asteroid | null>(null);

  const [targetDate, setTargetDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleSelectAsteroid = useCallback((id: string | null) => {
    setSelectedId(id);
    if (!id) {
      setShowPredictedRoute(false);
    } else {
      // Auto open details on mobile when selection changes
      if (typeof window !== "undefined" && window.innerWidth < 640) {
        setRightSidebarOpen(true);
        setLeftSidebarOpen(false);
      }
    }
  }, []);

  const toggleLeftSidebar = () => {
    setLeftSidebarOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== "undefined" && window.innerWidth < 640) {
        setRightSidebarOpen(false);
      }
      return next;
    });
  };

  const toggleRightSidebar = () => {
    setRightSidebarOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== "undefined" && window.innerWidth < 640) {
        setLeftSidebarOpen(false);
      }
      return next;
    });
  };

  const fetchAsteroidsData = useCallback(async (dateStr: string, signal?: AbortSignal) => {
    if (!dateStr) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/asteroids?date=${dateStr}`, { signal });
      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }
      const data = await res.json();

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
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorMessage = err instanceof Error ? err.message : "Failed to sync with space orbital sensors.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAsteroidsData(targetDate, controller.signal);

    return () => {
      controller.abort();
    };
  }, [targetDate, fetchAsteroidsData]);

  const selectedAsteroid = asteroids.find((a) => a.id === selectedId) || null;
  const totalCount = asteroids.length;
  const hazardousCount = asteroids.filter((a) => a.isHazardous).length;

  return (
    <main className="h-screen w-full relative flex flex-col font-mono transition-colors duration-300 overflow-hidden bg-black text-zinc-300">
      
      {/* HEADER & VIEW SELECTOR */}
      <header className="flex-none relative z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-zinc-800 transition-colors bg-zinc-950">
        <div className="flex items-center gap-2.5">
          <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 border border-cyan-500/40 bg-zinc-950 text-cyan-400 rounded-none shadow-[0_0_12px_rgba(34,211,238,0.2)]">
            <Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-400 animate-[spin_16s_linear_infinite]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[11px] sm:text-xs font-black tracking-widest leading-none text-white truncate">
              LIVE ASTEROID 3D SIM
            </h1>
            <p className="text-[8px] sm:text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider flex items-center gap-1 truncate">
              <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400 flex-shrink-0" />
              NASA Near-Earth Observation and Projection Stream!
            </p>
          </div>
        </div>

        {/* MODE TOGGLES */}
        <div className="flex items-center justify-center w-full sm:w-auto">
          <div className="flex w-full sm:w-auto border border-zinc-800 bg-black p-0.5 rounded-none">
            <button
              id="tab-simulator-btn"
              onClick={() => setViewTab("simulator")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase transition-all rounded-none ${
                viewTab === "simulator" 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Orbit className="w-3.5 h-3.5" />
              <span>3D Space</span>
            </button>
            <button
              id="tab-feed-btn"
              onClick={() => setViewTab("feed")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase transition-all rounded-none border-l border-zinc-900 ${
                viewTab === "feed" 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Telemetry Grid</span>
            </button>
          </div>
        </div>
      </header>

      {/* ERROR STATUS BANNER */}
      {error && (
        <div className="relative z-20 bg-red-950 border-b border-red-900 text-red-500 p-2 text-[9px] sm:text-[10px] flex items-center gap-2 justify-center">
          <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-bold uppercase truncate">{error}</span>
          <button 
            id="dismiss-error-btn"
            onClick={() => setError(null)} 
            className="ml-2 underline font-bold uppercase hover:text-white flex-shrink-0"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* WORKSPACE AREA */}
      <div className="flex-1 w-full relative overflow-hidden flex flex-col min-h-0">
        
        {/* VIEW TAB A: 3D SIMULATOR */}
        {viewTab === "simulator" && (
          <div className="relative w-full h-full overflow-hidden">
            
            {/* 3D Canvas wrapper - touch-none prevents page gesture locking when dragging canvas */}
            <div className="absolute inset-0 z-0 touch-none">
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

            {/* Floating Sidebar Toggle Buttons */}
            <div className="absolute top-3 left-3 z-20 flex gap-2 pointer-events-auto">
              <button
                id="toggle-left-sidebar-btn"
                onClick={toggleLeftSidebar}
                className="bg-black/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 text-[9px] font-bold uppercase rounded-none transition-colors shadow-lg flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                <span>{leftSidebarOpen ? "Hide Filters" : "Filters"}</span>
              </button>
            </div>

            <div className="absolute top-3 right-3 z-20 flex gap-2 pointer-events-auto">
              <button
                id="toggle-right-sidebar-btn"
                onClick={toggleRightSidebar}
                className="bg-black/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 text-[9px] font-bold uppercase rounded-none transition-colors shadow-lg flex items-center gap-1.5"
              >
                <Info className="w-3 h-3 text-cyan-400" />
                <span>{rightSidebarOpen ? "Hide Details" : "Details"}</span>
              </button>
            </div>

            {/* Mobile Drawer Backdrops */}
            {(leftSidebarOpen || rightSidebarOpen) && (
              <div 
                className="sm:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-25"
                onClick={() => {
                  setLeftSidebarOpen(false);
                  setRightSidebarOpen(false);
                }}
              />
            )}

            {/* Left Drawer / Mobile Bottom Sheet */}
            <div className={`fixed sm:absolute bottom-0 sm:bottom-3 top-auto sm:top-12 left-0 sm:left-3 z-30 w-full sm:w-[320px] max-h-[80vh] sm:max-h-none h-auto sm:h-[calc(100%-3.75rem)] pointer-events-none transition-all duration-300 ${
              leftSidebarOpen ? "translate-y-0 sm:translate-x-0 opacity-100" : "translate-y-full sm:translate-y-0 sm:-translate-x-[calc(100%+1.5rem)] opacity-0 sm:opacity-0"
            }`}>
              <div className="pointer-events-auto h-full flex flex-col bg-black/95 sm:bg-transparent border-t sm:border-t-0 border-zinc-800 p-2 sm:p-0 overflow-y-auto">
                <div className="flex sm:hidden items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                  <span className="text-[10px] font-bold uppercase text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3 h-3 text-cyan-400" /> Control Filters
                  </span>
                  <button onClick={() => setLeftSidebarOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
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

            {/* Right Drawer / Mobile Bottom Sheet */}
            <div className={`fixed sm:absolute bottom-0 sm:bottom-3 top-auto sm:top-12 right-0 sm:right-3 z-30 w-full sm:w-[380px] max-h-[85vh] sm:max-h-none h-auto sm:h-[calc(100%-3.75rem)] pointer-events-none transition-all duration-300 ${
              rightSidebarOpen ? "translate-y-0 sm:translate-x-0 opacity-100" : "translate-y-full sm:translate-y-0 sm:translate-x-[calc(100%+1.5rem)] opacity-0 sm:opacity-0"
            }`}>
              <div className="pointer-events-auto h-full flex flex-col bg-black/95 sm:bg-transparent border-t sm:border-t-0 border-zinc-800 p-2 sm:p-0 overflow-y-auto">
                <div className="flex sm:hidden items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                  <span className="text-[10px] font-bold uppercase text-white flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-cyan-400" /> Object Telemetry
                  </span>
                  <button onClick={() => setRightSidebarOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
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
                  <div className="flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-md border border-zinc-800 text-center pointer-events-auto select-none max-w-sm ml-auto shadow-2xl">
                    <div className="w-10 h-10 border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-500 mb-3 animate-pulse">
                      <Target className="w-5 h-5" />
                    </div>
                    <h4 className="text-white text-[10px] font-bold uppercase tracking-wider">
                      SPACE SEARCH INACTIVE - Tap on something to start :)
                    </h4>
                    <p className="text-zinc-500 text-[9px] mt-1.5 leading-relaxed uppercase">
                      Select a space rock or the Moon from the list to synchronize details, orbital path, and size comparisons!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW TAB B: TELEMETRY GRID */}
        {viewTab === "feed" && (
          <div className="w-full h-full p-2 sm:p-4 overflow-y-auto flex flex-col lg:flex-row gap-4 items-start">
            <div className="flex-1 w-full bg-black border border-zinc-800 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-white text-[11px] sm:text-xs font-black uppercase tracking-wider">
                    OBSERVED NEOS FOR {targetDate}
                  </h3>
                  <p className="text-[8px] sm:text-[9px] text-zinc-500 uppercase mt-0.5">
                    Complete physical parameters and planetary coordinates catalog
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] sm:text-[10px] text-zinc-400">
                    TOTAL: <b className="text-white">{totalCount}</b>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-red-500">
                    HAZARDOUS: <b className="text-red-400">{hazardousCount}</b>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-black">
                      <th className="py-2.5 px-2">Designation</th>
                      <th className="py-2.5 px-2 whitespace-nowrap">Est. Diameter</th>
                      <th className="py-2.5 px-2 whitespace-nowrap">Rel. Velocity</th>
                      <th className="py-2.5 px-2 whitespace-nowrap">Miss Dist. (LD)</th>
                      <th className="py-2.5 px-2 whitespace-nowrap">Miss Dist. (KM)</th>
                      <th className="py-2.5 px-2">Hazard</th>
                      <th className="py-2.5 px-2 text-right">Actions</th>
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
                          <td className="py-2.5 px-2 text-white font-bold whitespace-nowrap">
                            {ast.name}
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            {avgSize}m <span className="text-[8px] text-zinc-600">({ast.diameterMinMeters}-{ast.diameterMaxMeters}m)</span>
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            {ast.velocityKms.toFixed(2)} KM/S
                          </td>
                          <td className={`py-2.5 px-2 whitespace-nowrap ${ast.missDistanceLd < 1 ? "text-amber-500" : ""}`}>
                            {ast.missDistanceLd.toFixed(2)} LD
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            {ast.missDistanceKm.toLocaleString()} KM
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            {ast.isHazardous ? (
                              <span className="text-red-500 font-black">HAZARDOUS</span>
                            ) : (
                              <span className="text-zinc-600">SECURE</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setActiveImpactModalAsteroid(ast)}
                                className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/80 text-red-400 text-[8px] font-bold uppercase transition-colors"
                                title="Simulate Earth Impact"
                              >
                                <Bomb className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setActiveDartModalAsteroid(ast)}
                                className="p-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/80 text-cyan-400 text-[8px] font-bold uppercase transition-colors"
                                title="Launch DART Deflection Mission"
                              >
                                <Rocket className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

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
      <footer className="flex-none relative z-20 py-2 px-3 sm:px-4 border-t border-zinc-800 font-mono text-[8px] sm:text-[9px] flex flex-col md:flex-row items-center justify-between gap-1.5 sm:gap-2 transition-colors duration-300 bg-zinc-950 text-zinc-500">
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          <span className="uppercase text-zinc-500 truncate">DATABASE STREAM: NASA NEO API (NEOWS)</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-500 uppercase">
          <span className="hidden sm:inline">COORDINATES: GEOCENTRIC ZENITH</span>
          <span>SYSTEM CLOCK: UTC</span>
        </div>
      </footer>

      {/* MODAL OVERLAYS */}
      {activeImpactModalAsteroid && (
        <ImpactSimulatorModal
          asteroid={activeImpactModalAsteroid}
          onClose={() => setActiveImpactModalAsteroid(null)}
        />
      )}

      {activeDartModalAsteroid && (
        <DartDeflectionModal
          asteroid={activeDartModalAsteroid}
          onClose={() => setActiveDartModalAsteroid(null)}
        />
      )}
    </main>
  );
}
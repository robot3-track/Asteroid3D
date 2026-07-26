"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { X, Globe, Ruler, Gauge, Compass, Waves, Layers, Info } from "lucide-react";

interface MoonDetailsProps {
  targetDate: string;
  onClose: () => void;
}

const LUNAR_LAYERS = [
  {
    name: "Regolith",
    depth: "0 - 12 m",
    radiusKm: "1,737.4 km",
    comp: "Impact breccias, glass beads, fine dust",
    temp: "-130°C to +120°C",
    color: "border-zinc-500 bg-zinc-800/40 text-zinc-300",
    visualScale: 1.0,
    threeColor: 0x888888
  },
  {
    name: "Anorthositic Crust",
    depth: "12 - 43 km",
    radiusKm: "1,694 km",
    comp: "Plagioclase feldspar, basaltic maria",
    temp: "~-20°C",
    color: "border-amber-700/50 bg-amber-950/20 text-amber-200",
    visualScale: 0.88,
    threeColor: 0xb48a56
  },
  {
    name: "Upper Mantle",
    depth: "43 - 500 km",
    radiusKm: "1,237 km",
    comp: "Pyroxene, Mg-rich olivine",
    temp: "200°C - 800°C",
    color: "border-emerald-700/50 bg-emerald-950/20 text-emerald-200",
    visualScale: 0.70,
    threeColor: 0x1e6b4d
  },
  {
    name: "Lower Mantle",
    depth: "500 - 1,400 km",
    radiusKm: "337 km",
    comp: "Partial melt, ilmenite cumulates",
    temp: "1,000°C - 1,300°C",
    color: "border-orange-700/50 bg-orange-950/20 text-orange-200",
    visualScale: 0.48,
    threeColor: 0xc25e1a
  },
  {
    name: "Fluid Outer Core",
    depth: "1,400 - 1,500 km",
    radiusKm: "240 km",
    comp: "Liquid Fe-Ni alloy",
    temp: "~1,400°C",
    color: "border-red-700/50 bg-red-950/30 text-red-200",
    visualScale: 0.28,
    threeColor: 0xb91c1c
  },
  {
    name: "Solid Inner Core",
    depth: "1,500 - 1,737 km",
    radiusKm: "150 km",
    comp: "Crystallized metallic iron",
    temp: "~1,500°C",
    color: "border-yellow-500 bg-yellow-500/20 text-yellow-300",
    visualScale: 0.14,
    threeColor: 0xeab308
  }
];

export default function MoonDetails({ targetDate, onClose }: MoonDetailsProps) {
  const [activeTab, setActiveTab] = useState<"telemetry" | "geology">("telemetry");
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  const mountRef = useRef<HTMLDivElement>(null);
  const geoMountRef = useRef<HTMLDivElement>(null);

  const luna = useMemo(() => {
    const target = targetDate ? new Date(targetDate) : new Date();
    if (isNaN(target.getTime())) return null;

    const timeMs = target.getTime();
    const julianDate = timeMs / 86400000 + 2440587.5;
    const T = (julianDate - 2451545.0) / 36525;
    const rad = Math.PI / 180;
    
    const D = (297.8501921 + 445267.1114034 * T) % 360;
    const M = (357.5291092 + 35999.0502909 * T) % 360;
    const Mprime = (134.9633964 + 477198.8675055 * T) % 360;

    const synodicCycle = 29.530588853;
    const baseNewMoon = new Date("2000-01-06T18:14:00Z").getTime();
    const diffDays = (timeMs - baseNewMoon) / 86400000;
    let rawAge = diffDays % synodicCycle;
    if (rawAge < 0) rawAge += synodicCycle;
    const progress = rawAge / synodicCycle;

    const phaseAngleRad = (180 - D - 6.289 * Math.sin(Mprime * rad)) * rad;
    const illumination = Math.max(0, Math.min(100, Math.round(((1 + Math.cos(phaseAngleRad)) / 2) * 100)));

    let phaseName = "New Moon";
    if (rawAge >= 1.845 && rawAge < 5.536) phaseName = "Waxing Crescent";
    else if (rawAge >= 5.536 && rawAge < 9.228) phaseName = "First Quarter";
    else if (rawAge >= 9.228 && rawAge < 12.919) phaseName = "Waxing Gibbous";
    else if (rawAge >= 12.919 && rawAge < 16.61) phaseName = "Full Moon";
    else if (rawAge >= 16.61 && rawAge < 20.302) phaseName = "Waning Gibbous";
    else if (rawAge >= 20.302 && rawAge < 23.993) phaseName = "Third Quarter";
    else if (rawAge >= 23.993 && rawAge < 27.684) phaseName = "Waning Crescent";

    const MpR = Mprime * rad;
    const DR = D * rad;
    const MR = M * rad;

    const distanceKm = Math.round(
      385000.55 - 
      20905.355 * Math.cos(MpR) - 
      3699.111 * Math.cos(2 * DR - MpR) - 
      2955.968 * Math.cos(2 * DR) - 
      569.925 * Math.cos(2 * MpR) +
      48.888 * Math.cos(MR)
    );

    const distanceLd = parseFloat((distanceKm / 384400).toFixed(4));
    const gmEarth = 398600.4418;
    const velocityKms = parseFloat((Math.sqrt(gmEarth * ((2 / distanceKm) - (1 / 384400)))).toFixed(3));
    const tideForceCoeff = parseFloat((Math.pow(384400 / distanceKm, 3)).toFixed(2));

    return {
      age: parseFloat(rawAge.toFixed(2)),
      phaseName,
      illumination,
      distanceKm,
      distanceLd,
      velocityKms,
      tideForceCoeff,
      progress
    };
  }, [targetDate]);

  useEffect(() => {
    if (activeTab !== "telemetry" || !mountRef.current || !luna) return;

    const container = mountRef.current;
    const width = container.clientWidth || 280;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const sunLight = new THREE.DirectionalLight(0xfffdf0, 2.2);
    const sunAngle = (luna.progress - 0.25) * Math.PI * 2;
    sunLight.position.set(Math.cos(sunAngle) * 10, 0, Math.sin(sunAngle) * 10);
    scene.add(sunLight);

    scene.add(new THREE.AmbientLight(0x111122, 0.15));

    const colorTexture = new THREE.TextureLoader().load(
      "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg"
    );

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: colorTexture,
      roughness: 0.9,
      metalness: 0.1
    });

    const moonMesh = new THREE.Mesh(geometry, material);
    scene.add(moonMesh);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      moonMesh.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [activeTab, luna]);

  useEffect(() => {
    if (activeTab !== "geology" || !geoMountRef.current) return;

    const container = geoMountRef.current;
    const width = container.clientWidth || 280;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2.2, 1.2, 2.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x404040, 1.2));

    const group = new THREE.Group();

    LUNAR_LAYERS.forEach((layer) => {
      const geom = new THREE.SphereGeometry(
        layer.visualScale * 0.95,
        32,
        32,
        0,
        Math.PI * 1.5,
        0,
        Math.PI
      );

      const mat = new THREE.MeshStandardMaterial({
        color: layer.threeColor,
        side: THREE.DoubleSide,
        roughness: 0.6
      });

      group.add(new THREE.Mesh(geom, mat));
    });

    scene.add(group);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      group.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeTab]);

  if (!luna) {
    return (
      <div className="flex items-center justify-center h-full bg-black border border-zinc-800 text-zinc-500 font-mono text-xs">
        INVALID DATE FORMAT
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black border border-zinc-800 rounded-none overflow-hidden font-mono text-xs select-none">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
              MOON TELEMETRY
            </span>
          </div>
          <h2 className="text-white text-base font-black tracking-wide mt-1">
            LUNA
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-none border border-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex border-b border-zinc-800 bg-zinc-950/80 p-1">
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`flex-1 py-1.5 text-[9px] font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "telemetry"
              ? "bg-zinc-800 text-white border border-zinc-700"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Globe className="w-3 h-3 text-cyan-400" /> Surface Model
        </button>
        <button
          onClick={() => setActiveTab("geology")}
          className={`flex-1 py-1.5 text-[9px] font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "geology"
              ? "bg-zinc-800 text-white border border-zinc-700"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Layers className="w-3 h-3 text-amber-400" /> Layer Cutaway
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {activeTab === "telemetry" ? (
          <>
            <div className="p-2 bg-zinc-950 border border-zinc-900 text-center flex flex-col justify-center items-center">
              <div ref={mountRef} className="w-full h-48 cursor-grab active:cursor-grabbing" />
              <div className="mt-2">
                <h3 className="text-white font-black text-sm tracking-widest uppercase">
                  {luna.phaseName}
                </h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-0.5">
                  Illumination: <span className="text-yellow-500 font-bold">{luna.illumination}%</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-zinc-500 text-[9px] font-bold tracking-wider uppercase">
                EPHEMERIS ({targetDate})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                  <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-cyan-500" /> Distance
                  </span>
                  <span className="text-white font-bold text-xs">
                    {luna.distanceKm.toLocaleString()} km
                  </span>
                  <span className="text-zinc-400 text-[9px]">{luna.distanceLd} LD</span>
                </div>

                <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                  <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                    <Compass className="w-3 h-3 text-yellow-500" /> Lunation
                  </span>
                  <span className="text-white font-bold text-xs">{luna.age} Days</span>
                  <span className="text-zinc-400 text-[9px]">Cycle: {Math.round(luna.progress * 100)}%</span>
                </div>

                <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                  <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-emerald-500" /> Velocity
                  </span>
                  <span className="text-white font-bold text-xs">{luna.velocityKms} km/s</span>
                  <span className="text-zinc-400 text-[9px]">
                    {(luna.velocityKms * 3600).toLocaleString()} km/h
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-950 border border-zinc-900 flex flex-col gap-1">
                  <span className="text-zinc-500 uppercase text-[9px] flex items-center gap-1">
                    <Waves className="w-3 h-3 text-blue-500" /> Tidal Effect
                  </span>
                  <span className="text-white font-bold text-xs">{luna.tideForceCoeff}x</span>
                  <span className="text-zinc-400 text-[9px]">Relative Pull</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="p-2.5 bg-zinc-950 border border-zinc-900 text-zinc-400 text-[9px] flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed uppercase">
                Data based on NASA GRAIL and Apollo seismic experiment models.
              </p>
            </div>

            <div className="p-2 bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center">
              <span className="text-[9px] text-zinc-500 uppercase mb-1 font-bold tracking-wider">
                Internal Structure Cutaway
              </span>
              <div ref={geoMountRef} className="w-full h-52" />
            </div>

            <div className="space-y-2">
              <h4 className="text-zinc-500 text-[9px] font-bold tracking-wider uppercase">
                STRATIGRAPHY
              </h4>
              <div className="space-y-1.5">
                {LUNAR_LAYERS.map((layer, index) => (
                  <div
                    key={layer.name}
                    onMouseEnter={() => setHoveredLayer(index)}
                    onMouseLeave={() => setHoveredLayer(null)}
                    className={`p-2.5 border transition-all ${layer.color} ${
                      hoveredLayer === index ? "brightness-125 ring-1 ring-white/20" : ""
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
                        <span className="text-zinc-500 uppercase">Comp:</span> <span>{layer.comp}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 uppercase">Radius:</span>{" "}
                        <span className="text-amber-400 font-bold">{layer.radiusKm}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
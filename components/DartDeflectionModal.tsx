"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { X, Rocket, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { Asteroid } from "@/lib/nasa";

interface Props {
  asteroid: Asteroid;
  onClose: () => void;
}

export default function DartDeflectionModal({ asteroid, onClose }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Parameter State
  const [impactorMass, setImpactorMass] = useState<number>(600); // kg
  const [impactorSpeed, setImpactorSpeed] = useState<number>(6.6); // km/s
  const [isLaunched, setIsLaunched] = useState<boolean>(false);
  const [isDeflected, setIsDeflected] = useState<boolean>(false);
  const [impactOccurred, setImpactOccurred] = useState<boolean>(false);

  // Kinetic momentum transfer calculation (Δp = m * v)
  const avgDiameter = Math.round((asteroid.diameterMinMeters + asteroid.diameterMaxMeters) / 2);
  const radiusMeters = avgDiameter / 2;
  const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);
  const asteroidMassKg = volumeM3 * 2500; // Standard rock density 2,500 kg/m³

  const momentumTransfer = impactorMass * (impactorSpeed * 1000); // kg * m/s
  const deltaVKms = momentumTransfer / asteroidMassKg; // m/s
  const deltaVCms = deltaVKms * 100; // cm/s

  const minRequiredDeltaVCms = 0.02;

  // References for Three.js animation loop control
  const sceneRef = useRef<THREE.Scene | null>(null);
  const asteroidMeshRef = useRef<THREE.Mesh | null>(null);
  const dartMeshRef = useRef<THREE.Mesh | null>(null);
  const isLaunchedRef = useRef(isLaunched);
  const isDeflectedRef = useRef(isDeflected);
  const impactHandledRef = useRef(false);

  // Sync state refs for requestAnimationFrame closure
  useEffect(() => {
    isLaunchedRef.current = isLaunched;
  }, [isLaunched]);

  useEffect(() => {
    isDeflectedRef.current = isDeflected;
  }, [isDeflected]);

  // Three.js Scene Setup
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Scene, Camera, Renderer
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 10, 5);
    scene.add(dirLight);

    // 3. Starfield Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 100;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x888888, size: 0.2 });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 4. Earth Model Representation
    const earthGeo = new THREE.SphereGeometry(1.8, 24, 24);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, wireframe: true });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(-5, -1, -4);
    scene.add(earthMesh);

    // 5. Target Asteroid
    const asteroidGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const asteroidMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, wireframe: true });
    const asteroidMesh = new THREE.Mesh(asteroidGeo, asteroidMat);
    asteroidMesh.position.set(1, 0, 0);
    scene.add(asteroidMesh);
    asteroidMeshRef.current = asteroidMesh;

    // 6. DART Impactor Probe
    const dartGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const dartMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const dartMesh = new THREE.Mesh(dartGeo, dartMat);
    dartMesh.position.set(-6, 0, 3.5);
    dartMesh.visible = false;
    scene.add(dartMesh);
    dartMeshRef.current = dartMesh;

    // Render loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Asteroid rotation
      if (asteroidMeshRef.current) {
        asteroidMeshRef.current.rotation.y += delta * 0.5;

        // Shift orbit away from Earth after deflected impact
        if (isDeflectedRef.current && impactHandledRef.current) {
          asteroidMeshRef.current.position.x += delta * 0.8;
          asteroidMeshRef.current.position.z += delta * 0.2;
        }
      }

      // Spacecraft flight trajectory
      if (isLaunchedRef.current && dartMeshRef.current && !impactHandledRef.current) {
        dartMeshRef.current.visible = true;
        dartMeshRef.current.position.x += delta * 5;
        dartMeshRef.current.position.z -= delta * 2.5;

        // Collision detection threshold near x=1, z=0
        if (dartMeshRef.current.position.x >= 0.8) {
          impactHandledRef.current = true;
          dartMeshRef.current.visible = false;
          
          if (asteroidMeshRef.current) {
            // Change color dynamically upon impact
            const color = (asteroidMeshRef.current.material as THREE.MeshStandardMaterial).color;
            if (deltaVCms >= minRequiredDeltaVCms) {
              color.setHex(0x22c55e); // Green = deflected
            }
          }
          handleImpactComplete();
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Window Resize
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleLaunch = () => {
    setIsLaunched(true);
    setImpactOccurred(false);
    setIsDeflected(false);
    impactHandledRef.current = false;

    if (dartMeshRef.current) {
      dartMeshRef.current.position.set(-6, 0, 3.5);
      dartMeshRef.current.visible = true;
    }
  };

  const handleImpactComplete = () => {
    setImpactOccurred(true);
    if (deltaVCms >= minRequiredDeltaVCms) {
      setIsDeflected(true);
    }
  };

  const handleReset = () => {
    setIsLaunched(false);
    setIsDeflected(false);
    setImpactOccurred(false);
    impactHandledRef.current = false;

    if (asteroidMeshRef.current) {
      asteroidMeshRef.current.position.set(1, 0, 0);
      (asteroidMeshRef.current.material as THREE.MeshStandardMaterial).color.setHex(0xe11d48);
    }
    if (dartMeshRef.current) {
      dartMeshRef.current.position.set(-6, 0, 3.5);
      dartMeshRef.current.visible = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="relative w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-800 flex flex-col overflow-hidden text-zinc-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xs font-black uppercase text-white tracking-widest">
              DART KINETIC IMPACTOR SANDBOX // {asteroid.name}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Scene + Control Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Pure Three.js Canvas Container */}
          <div className="flex-1 relative bg-black">
            <div ref={mountRef} className="w-full h-full" />

            {/* Impact Banner Overlay */}
            {impactOccurred && (
              <div className="absolute top-4 left-4 right-4 z-10">
                {isDeflected ? (
                  <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-400 p-3 text-xs flex items-center gap-2.5 shadow-xl">
                    <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                    <span>
                      <b className="uppercase">SUCCESSFUL ORBIT DEFLECTION:</b> Impulse transfer delivered Δv = {deltaVCms.toFixed(4)} cm/s. Earth impact averted!
                    </span>
                  </div>
                ) : (
                  <div className="bg-red-950/90 border border-red-800 text-red-400 p-3 text-xs flex items-center gap-2.5 shadow-xl">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
                    <span>
                      <b className="uppercase">INSUFFICIENT MOMENTUM:</b> Impulse transfer delivered Δv = {deltaVCms.toFixed(4)} cm/s (Below {minRequiredDeltaVCms} cm/s threshold).
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 p-4 bg-zinc-950 flex flex-col gap-4 text-[10px] overflow-y-auto">
            <h3 className="text-white font-black uppercase tracking-wider border-b border-zinc-800 pb-2">
              Mission Parameters
            </h3>

            <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 uppercase block text-[8px]">Target Dimensions</span>
              <p className="text-white font-bold">{avgDiameter} Meters Target</p>
              <p className="text-zinc-400 text-[9px]">Est. Mass: {asteroidMassKg.toExponential(2)} kg</p>
            </div>

            {/* Mass Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>PROBE MASS</span>
                <span className="text-white font-bold">{impactorMass} KG</span>
              </div>
              <input
                type="range"
                min="300"
                max="10000"
                step="100"
                value={impactorMass}
                onChange={(e) => setImpactorMass(Number(e.target.value))}
                disabled={isLaunched}
                className="w-full accent-cyan-400 bg-zinc-800 cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Speed Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>IMPACT VELOCITY</span>
                <span className="text-white font-bold">{impactorSpeed.toFixed(1)} KM/S</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={impactorSpeed}
                onChange={(e) => setImpactorSpeed(Number(e.target.value))}
                disabled={isLaunched}
                className="w-full accent-cyan-400 bg-zinc-800 cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Calculated Δv Display */}
            <div className="p-3 bg-zinc-900 border border-zinc-800 space-y-1.5">
              <span className="text-zinc-500 uppercase block text-[8px]">Calculated Delta-V (Δv)</span>
              <p className="text-cyan-400 font-black text-sm">{deltaVCms.toFixed(5)} cm/s</p>
              <p className="text-[8px] text-zinc-500">
                Required Δv for evasion: ≥ {minRequiredDeltaVCms} cm/s
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-2">
              {!isLaunched ? (
                <button
                  onClick={handleLaunch}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  <Rocket className="w-4 h-4" />
                  Launch DART Mission
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase flex items-center justify-center gap-2 transition-colors border border-zinc-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Mission
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
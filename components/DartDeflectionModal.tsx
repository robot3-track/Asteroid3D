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

  const [impactorMass, setImpactorMass] = useState<number>(600);
  const [impactorSpeed, setImpactorSpeed] = useState<number>(6.6);
  const [isLaunched, setIsLaunched] = useState<boolean>(false);
  const [isDeflected, setIsDeflected] = useState<boolean>(false);
  const [impactOccurred, setImpactOccurred] = useState<boolean>(false);

  const avgDiameter = Math.round((asteroid.diameterMinMeters + asteroid.diameterMaxMeters) / 2);
  const radiusMeters = avgDiameter / 2;
  const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);
  const asteroidMassKg = volumeM3 * 2500;

  const momentumTransfer = impactorMass * (impactorSpeed * 1000);
  const deltaVKms = momentumTransfer / asteroidMassKg;
  const deltaVCms = deltaVKms * 100;

  const minRequiredDeltaVCms = 0.02;

  const asteroidMeshRef = useRef<THREE.Mesh | null>(null);
  const dartMeshRef = useRef<THREE.Mesh | null>(null);
  const isLaunchedRef = useRef(isLaunched);
  const isDeflectedRef = useRef(isDeflected);
  const impactHandledRef = useRef(false);

  useEffect(() => {
    isLaunchedRef.current = isLaunched;
  }, [isLaunched]);

  useEffect(() => {
    isDeflectedRef.current = isDeflected;
  }, [isDeflected]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Realistic Solar Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(12, 6, 10);
    scene.add(sunLight);

    // Starfield Background
    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000 * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 120;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.15 })));

    // Load High-Res Earth Textures
    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg");
    const earthSpecular = textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg");
    const earthNormal = textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg");

    // Realistic Textured Earth
    const earthGeo = new THREE.SphereGeometry(1.8, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthMap,
      specularMap: earthSpecular,
      normalMap: earthNormal,
      specular: new THREE.Color(0x333333),
      shininess: 15,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(-4.5, -0.5, -2);
    scene.add(earthMesh);

    // Earth Atmosphere Glow Ring
    const atmosGeo = new THREE.SphereGeometry(1.85, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide
    });
    earthMesh.add(new THREE.Mesh(atmosGeo, atmosMat));

    // Realistic Procedural Asteroid
    const asteroidGeo = new THREE.DodecahedronGeometry(0.55, 3);
    const pos = asteroidGeo.attributes.position;

    // Deform sphere vertices to create realistic irregular asteroid rock geometry
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const noise = (Math.sin(v.x * 5) + Math.cos(v.y * 5) + Math.sin(v.z * 5)) * 0.08;
      v.addScaledVector(v.clone().normalize(), noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    asteroidGeo.computeVertexNormals();

    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.2,
      bumpScale: 0.05
    });
    const asteroidMesh = new THREE.Mesh(asteroidGeo, asteroidMat);
    asteroidMesh.position.set(1.5, 0, 0);
    scene.add(asteroidMesh);
    asteroidMeshRef.current = asteroidMesh;

    // Craft Probe
    const dartGeo = new THREE.BoxGeometry(0.2, 0.2, 0.3);
    const dartMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    const dartMesh = new THREE.Mesh(dartGeo, dartMat);
    dartMesh.position.set(-5, 0, 3);
    dartMesh.visible = false;
    scene.add(dartMesh);
    dartMeshRef.current = dartMesh;

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      earthMesh.rotation.y += delta * 0.05;

      if (asteroidMeshRef.current) {
        asteroidMeshRef.current.rotation.x += delta * 0.2;
        asteroidMeshRef.current.rotation.y += delta * 0.3;

        if (isDeflectedRef.current && impactHandledRef.current) {
          asteroidMeshRef.current.position.x += delta * 0.8;
          asteroidMeshRef.current.position.z += delta * 0.2;
        }
      }

      if (isLaunchedRef.current && dartMeshRef.current && !impactHandledRef.current) {
        dartMeshRef.current.visible = true;
        dartMeshRef.current.position.x += delta * 6;
        dartMeshRef.current.position.z -= delta * 2.8;

        if (dartMeshRef.current.position.x >= 1.2) {
          impactHandledRef.current = true;
          dartMeshRef.current.visible = false;

          handleImpactComplete();
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

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
      dartMeshRef.current.position.set(-5, 0, 3);
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
      asteroidMeshRef.current.position.set(1.5, 0, 0);
    }
    if (dartMeshRef.current) {
      dartMeshRef.current.position.set(-5, 0, 3);
      dartMeshRef.current.visible = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="relative w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-800 flex flex-col overflow-hidden text-zinc-300">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xs font-black uppercase text-white tracking-widest">
              DART KINETIC IMPACTOR SANDBOX // {asteroid.name}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 relative bg-black">
            <div ref={mountRef} className="w-full h-full" />

            {impactOccurred && (
              <div className="absolute top-4 left-4 right-4 z-10">
                {isDeflected ? (
                  <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-400 p-3 text-xs flex items-center gap-2.5 shadow-xl">
                    <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                    <span>
                      <b className="uppercase">SUCCESSFUL ORBIT DEFLECTION:</b> Impulse transfer delivered Δv = {deltaVCms.toFixed(4)} cm/s. Earth impact averted!
                    </span>
                  </div>
                ) : (
                  <div className="bg-red-950/90 border border-red-800 text-red-400 p-3 text-xs flex items-center gap-2.5 shadow-xl">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>
                      <b className="uppercase">INSUFFICIENT MOMENTUM:</b> Impulse transfer delivered Δv = {deltaVCms.toFixed(4)} cm/s (Below {minRequiredDeltaVCms} cm/s threshold).
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 p-4 bg-zinc-950 flex flex-col gap-4 text-[10px] overflow-y-auto">
            <h3 className="text-white font-black uppercase tracking-wider border-b border-zinc-800 pb-2">
              Mission Parameters
            </h3>

            <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 uppercase block text-[8px]">Target Dimensions</span>
              <p className="text-white font-bold">{avgDiameter} Meters Target</p>
              <p className="text-zinc-400 text-[9px]">Est. Mass: {asteroidMassKg.toExponential(2)} kg</p>
            </div>

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

            <div className="p-3 bg-zinc-900 border border-zinc-800 space-y-1.5">
              <span className="text-zinc-500 uppercase block text-[8px]">Calculated Delta-V (Δv)</span>
              <p className="text-cyan-400 font-black text-sm">{deltaVCms.toFixed(5)} cm/s</p>
            </div>

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
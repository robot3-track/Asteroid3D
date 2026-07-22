"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Globe } from "lucide-react";
import { Asteroid } from "@/lib/nasa";

interface AsteroidSimulatorProps {
  asteroids: Asteroid[];
  selectedId: string | null;
  onSelectAsteroid: (id: string | null) => void;
  simulationSpeed: number; // 1 = normal, 10 = fast, 100 = hyper, etc.
  filterHazardousOnly: boolean;
  filterSizeMin: number;
  showPredictedRoute: boolean;
}

export default function AsteroidSimulator({
  asteroids,
  selectedId,
  onSelectAsteroid,
  simulationSpeed,
  filterHazardousOnly,
  filterSizeMin,
  showPredictedRoute
}: AsteroidSimulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs for scene components to allow updates inside the animation loop
  const stateRef = useRef({
    selectedId,
    simulationSpeed,
    filterHazardousOnly,
    filterSizeMin,
    asteroids,
    showPredictedRoute,
    hoveredId: null as string | null
  });

  const [loading, setLoading] = useState(true);
  const [hoveredAsteroid, setHoveredAsteroid] = useState<Asteroid | null>(null);
  const [hoveredIsMoon, setHoveredIsMoon] = useState<boolean>(false);

  // Keep stateRef in sync with changing props
  useEffect(() => {
    stateRef.current = {
      selectedId,
      simulationSpeed,
      filterHazardousOnly,
      filterSizeMin,
      asteroids,
      showPredictedRoute,
      hoveredId: stateRef.current.hoveredId
    };
  }, [selectedId, simulationSpeed, filterHazardousOnly, filterSizeMin, asteroids, showPredictedRoute]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let isDestroyed = false;
    const container = containerRef.current;
    const canvas = canvasRef.current;

    // 1. SETUP THREE.JS SCENE & RENDERER
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06060c, 0.001);

    // Create Camera
    const initialWidth = container.clientWidth || window.innerWidth;
    const initialHeight = container.clientHeight || Math.max(window.innerHeight - 80, 400);

    const camera = new THREE.PerspectiveCamera(
      60,
      initialWidth / initialHeight,
      0.1,
      1000
    );
    camera.position.set(0, 12, 18);

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x06060c, 1);

    // Add Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0x22223b, 1.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(50, 30, 50);
    scene.add(sunLight);

    const blueLight = new THREE.PointLight(0x00f2ff, 1.5, 50);
    blueLight.position.set(-10, 5, -10);
    scene.add(blueLight);

    // Controls - limit zoom to stay beautifully framed inside our celestial system
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 100;
    controls.minDistance = 3.5;

    // 2. HELPER: CREATE PROCEDURAL TEXTURE FOR EARTH
    // Avoids fetching megabytes of satellite maps - loads instantly with premium sci-fi style
    const createEarthCanvasTexture = (): THREE.CanvasTexture => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 512;
      const ctx = c.getContext("2d")!;

      // Deep space grid background
      ctx.fillStyle = "#0c0e17";
      ctx.fillRect(0, 0, 1024, 512);

      // Draw latitude / longitude grid
      ctx.strokeStyle = "rgba(0, 132, 255, 0.15)";
      ctx.lineWidth = 1;
      
      // Parallels (Latitudes)
      const latCount = 18;
      for (let i = 0; i <= latCount; i++) {
        const y = (512 / latCount) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }
      
      // Meridians (Longitudes)
      const lonCount = 36;
      for (let i = 0; i <= lonCount; i++) {
        const x = (1024 / lonCount) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }

      // Draw procedural futuristic continent wireframes
      ctx.fillStyle = "rgba(0, 242, 255, 0.25)";
      ctx.strokeStyle = "rgba(0, 242, 255, 0.7)";
      ctx.lineWidth = 1.5;

      // Draw styled blocks representing continents
      const drawContinent = (x: number, y: number, w: number, h: number, points: [number, number][]) => {
        ctx.beginPath();
        ctx.moveTo(x + points[0][0], y + points[0][1]);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(x + points[i][0], y + points[i][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      // North America
      drawContinent(100, 80, 200, 150, [[0,0], [180,20], [220,110], [140,150], [70,120], [0,60]]);
      // South America
      drawContinent(250, 230, 120, 180, [[0,0], [90,40], [60,180], [10,130], [-10,50]]);
      // Eurasia
      drawContinent(480, 60, 350, 160, [[0,40], [120,-10], [320,0], [350,110], [250,150], [110,140], [50,90]]);
      // Africa
      drawContinent(520, 200, 140, 160, [[10,0], [120,20], [130,90], [80,160], [40,160], [0,60]]);
      // Australia
      drawContinent(820, 260, 110, 80, [[0,20], [80,0], [110,40], [60,80], [10,70]]);

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    // Helper: Create a high-fidelity procedural Moon texture map to ensure beautiful craters with no network load latency
    const createMoonCanvasTexture = (): THREE.CanvasTexture => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext("2d")!;

      // Dusty lunar grey background
      ctx.fillStyle = "#838c99";
      ctx.fillRect(0, 0, 512, 256);

      // Dark basaltic plains (Maria)
      ctx.fillStyle = "#555d6b";
      const maria = [
        { x: 100, y: 70, rx: 55, ry: 40 },
        { x: 190, y: 110, rx: 75, ry: 45 },
        { x: 320, y: 80, rx: 65, ry: 35 },
        { x: 410, y: 150, rx: 45, ry: 30 },
        { x: 75, y: 170, rx: 35, ry: 25 },
      ];
      maria.forEach((m) => {
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, m.rx, m.ry, Math.random() * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(85, 93, 107, 0.35)";
        ctx.lineWidth = 8;
        ctx.stroke();
      });

      // Crater renderer
      const drawCrater = (x: number, y: number, r: number) => {
        ctx.strokeStyle = "rgba(25, 28, 33, 0.75)";
        ctx.lineWidth = Math.max(1, r * 0.16);
        ctx.beginPath();
        ctx.arc(x, y, r, Math.PI, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI);
        ctx.stroke();

        ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.85, 0, Math.PI * 2);
        ctx.fill();

        if (r > 6) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      };

      // Famous large craters (Tycho, Copernicus, Kepler)
      const craters = [
        { x: 240, y: 180, r: 13, rays: true },
        { x: 160, y: 80, r: 8, rays: false },
        { x: 310, y: 100, r: 9, rays: false },
        { x: 370, y: 120, r: 7, rays: false },
        { x: 90, y: 130, r: 11, rays: true },
      ];
      craters.forEach((bc) => {
        if (bc.rays) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 0.5;
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const len = bc.r * (3 + Math.random() * 5);
            ctx.beginPath();
            ctx.moveTo(bc.x, bc.y);
            ctx.lineTo(bc.x + Math.cos(angle) * len, bc.y + Math.sin(angle) * len);
            ctx.stroke();
          }
        }
        drawCrater(bc.x, bc.y, bc.r);
      });

      // Scattered impact craters for realistic feel
      for (let i = 0; i < 45; i++) {
        drawCrater(Math.random() * 512, Math.random() * 256, 1.5 + Math.random() * 4);
      }

      // Coordinate grids
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 8; i++) {
        const x = (512 / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 256);
        ctx.stroke();
      }
      for (let i = 1; i < 4; i++) {
        const y = (256 / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    // 3. CREATE PROCEDURAL STARFIELD
    const starsCount = 800;
    const starsGeo = new THREE.BufferGeometry();
    const starsPositions = new Float32Array(starsCount * 3);
    const starsSizes = new Float32Array(starsCount);
    const starsColors = new Float32Array(starsCount * 3);

    const colorOptions = [
      new THREE.Color(0x8bc7ff), // Cool blue
      new THREE.Color(0xfff5eb), // Soft warm yellow
      new THREE.Color(0xffffff), // Crisp white
      new THREE.Color(0xd1f0ff)  // Teal star
    ];

    for (let i = 0; i < starsCount; i++) {
      // Position inside a large sphere
      const r = 200 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starsPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starsPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starsPositions[i * 3 + 2] = r * Math.cos(phi);

      starsSizes[i] = 1.0 + Math.random() * 2.5;

      // Color variation
      const col = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      starsColors[i * 3] = col.r;
      starsColors[i * 3 + 1] = col.g;
      starsColors[i * 3 + 2] = col.b;
    }

    starsGeo.setAttribute("position", new THREE.BufferAttribute(starsPositions, 3));
    starsGeo.setAttribute("color", new THREE.BufferAttribute(starsColors, 3));

    const starsMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    const starfield = new THREE.Points(starsGeo, starsMat);
    scene.add(starfield);

    // 4. SCENE OBJECT GROUPINGS
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // Geocentric visual indicators
    const geocentricIndicators = new THREE.Group();
    scene.add(geocentricIndicators);

    // 5. BUILD GEOCENTRIC OBJECTS (EARTH & MOON)
    const earthRadius = 1.8;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 40, 40);
    const earthTex = createEarthCanvasTexture();
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTex,
      shininess: 40,
      bumpScale: 0.05,
      specular: new THREE.Color(0x00f2ff)
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Asynchronously load actual NASA Blue Marble satellite imagery globe texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    textureLoader.load(
      "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      (loadedTex) => {
        loadedTex.wrapS = THREE.RepeatWrapping;
        loadedTex.wrapT = THREE.ClampToEdgeWrapping;
        earthMat.map = loadedTex;
        earthMat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn("Failed to load satellite imagery, falling back to procedural sci-fi globe:", err);
      }
    );

    // Atmospheric Glow Sphere
    const glowGeo = new THREE.SphereGeometry(earthRadius * 1.15, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00a2ff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const earthGlow = new THREE.Mesh(glowGeo, glowMat);
    earthGroup.add(earthGlow);

    // Tactical outer coordinate rings around Earth
    const ringGeo = new THREE.RingGeometry(earthRadius * 1.4, earthRadius * 1.42, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const tacticalRing = new THREE.Mesh(ringGeo, ringMat);
    tacticalRing.rotation.x = Math.PI / 2;
    geocentricIndicators.add(tacticalRing);

    // Moon representation
    const moonGroup = new THREE.Group();
    earthGroup.add(moonGroup);

    const moonRadius = 0.45; 
    const moonGeo = new THREE.SphereGeometry(moonRadius, 32, 32);
    const moonTex = createMoonCanvasTexture();
    const moonMat = new THREE.MeshPhongMaterial({
      map: moonTex,
      bumpMap: moonTex,
      bumpScale: 0.05,
      shininess: 15,
      flatShading: false
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.userData = { asteroidId: "moon", isMoon: true };
    
    const moonOrbitRadius = 8.5;
    moonMesh.position.set(moonOrbitRadius, 0, 0);
    moonGroup.add(moonMesh);

    // Moon Orbit line (dotted ring)
    const moonOrbitPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const angle = (i / 120) * Math.PI * 2;
      moonOrbitPoints.push(new THREE.Vector3(Math.cos(angle) * moonOrbitRadius, 0, Math.sin(angle) * moonOrbitRadius));
    }
    const moonOrbitGeo = new THREE.BufferGeometry().setFromPoints(moonOrbitPoints);
    const moonOrbitMat = new THREE.LineDashedMaterial({
      color: 0x5a6e85,
      dashSize: 0.3,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.4
    });
    const moonOrbitLine = new THREE.Line(moonOrbitGeo, moonOrbitMat);
    moonOrbitLine.computeLineDistances();
    geocentricIndicators.add(moonOrbitLine);

    // 6. ASTEROID RENDERING REFS & POOL
    interface RenderedAsteroid {
      id: string;
      asteroid: Asteroid;
      mesh: THREE.Mesh;
      trailLine?: THREE.Line;
      vectorLine?: THREE.Line;
      directionArrow?: THREE.ArrowHelper;
      phaseOffset: number;
    }

    let renderedAsteroidsPool: RenderedAsteroid[] = [];
    const asteroidGroup = new THREE.Group();
    scene.add(asteroidGroup);

    // Procedural Asteroid geometry helper - returns a unique space rock
    const createProceduralAsteroidGeometry = (radius: number, seed: number): THREE.BufferGeometry => {
      const geo = new THREE.IcosahedronGeometry(radius, 1);
      const posAttr = geo.attributes.position;
      const v = new THREE.Vector3();
      const s = Math.sin(seed);
      const c = Math.cos(seed);

      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        v.normalize();
        
        const nx = v.x * 3.1 + s * 2.5;
        const ny = v.y * 2.7 + c * 3.1;
        const nz = v.z * 3.5 + s * 1.5;
        const noise = Math.sin(nx) * Math.cos(ny) + Math.sin(nz) * Math.cos(nx);
        
        const displacement = 1 + noise * 0.18;
        v.multiplyScalar(radius * displacement);

        posAttr.setXYZ(i, v.x, v.y, v.z);
      }

      geo.computeVertexNormals();
      return geo;
    };

    // 8. UPDATE ACTIVE ASTEROIDS SCENE OBJECTS
    const rebuildAsteroidsInScene = () => {
      // Clear all active asteroid meshes
      renderedAsteroidsPool.forEach((item) => {
        asteroidGroup.remove(item.mesh);
        if (item.trailLine) asteroidGroup.remove(item.trailLine);
        if (item.vectorLine) asteroidGroup.remove(item.vectorLine);
        if (item.directionArrow) asteroidGroup.remove(item.directionArrow);
        
        item.mesh.geometry.dispose();
        (item.mesh.material as THREE.Material).dispose();
        if (item.trailLine) {
          item.trailLine.geometry.dispose();
          (item.trailLine.material as THREE.Material).dispose();
        }
        if (item.vectorLine) {
          item.vectorLine.geometry.dispose();
          (item.vectorLine.material as THREE.Material).dispose();
        }
      });
      renderedAsteroidsPool = [];

      const current = stateRef.current;
      const targetAsteroids = current.asteroids;

      targetAsteroids.forEach((ast, idx) => {
        if (current.filterHazardousOnly && !ast.isHazardous) return;
        
        const avgDiameter = (ast.diameterMinMeters + ast.diameterMaxMeters) / 2;
        if (avgDiameter < current.filterSizeMin) return;

        const visualRadius = 0.15 + Math.log10(avgDiameter / 10 + 1) * 0.16;

        const isSelected = ast.id === current.selectedId;
        const isHovered = ast.id === current.hoveredId;
        
        let color = 0x94a3b8; 
        if (ast.isHazardous) {
          color = 0xff5533; 
        } else if (avgDiameter > 1000) {
          color = 0xbc9dff; 
        }

        const rockGeo = createProceduralAsteroidGeometry(visualRadius, parseFloat(ast.id) || idx);
        const rockMat = new THREE.MeshPhongMaterial({
          color: color,
          flatShading: true,
          shininess: 12,
          bumpScale: 0.1,
          emissive: isSelected ? 0x00f2ff : isHovered ? 0x0088ff : 0x000000,
          emissiveIntensity: isSelected ? 0.6 : isHovered ? 0.35 : 0
        });

        const rockMesh = new THREE.Mesh(rockGeo, rockMat);
        rockMesh.userData = { asteroidId: ast.id };
        asteroidGroup.add(rockMesh);

        let trailLine: THREE.Line | undefined;
        let vectorLine: THREE.Line | undefined;
        let directionArrow: THREE.ArrowHelper | undefined;

        const trailPoints: THREE.Vector3[] = [];
        const scaledMissDistance = 1.2 + Math.log2(ast.missDistanceLd + 1) * 2.2;
        
        const seedAngle = ((parseFloat(ast.id) * 31) % 100) / 100 * Math.PI * 2;
        const seedInclination = (((parseFloat(ast.id) * 7) % 50) - 25) / 180 * Math.PI;

        const p0 = new THREE.Vector3(
          Math.cos(seedAngle) * scaledMissDistance,
          Math.sin(seedInclination) * scaledMissDistance,
          Math.sin(seedAngle) * scaledMissDistance
        );

        const flybyDir = new THREE.Vector3(-p0.z, p0.y * 0.3, p0.x).normalize();

        for (let step = -50; step <= 50; step++) {
          const pos = p0.clone().addScaledVector(flybyDir, step * 0.6);
          trailPoints.push(pos);
        }

        const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
        const trailMat = new THREE.LineBasicMaterial({
          color: ast.isHazardous ? 0xff4433 : 0x00f2ff,
          transparent: true,
          opacity: isSelected ? 0.8 : isHovered ? 0.5 : 0.18,
          linewidth: isSelected ? 2 : 1
        });
        trailLine = new THREE.Line(trailGeo, trailMat);
        trailLine.visible = isSelected;
        asteroidGroup.add(trailLine);

        if (isSelected) {
          const vecPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
          const vecGeo = new THREE.BufferGeometry().setFromPoints(vecPoints);
          const vecMat = new THREE.LineBasicMaterial({
            color: 0x00ffcc,
            transparent: true,
            opacity: 0.8
          });
          vectorLine = new THREE.Line(vecGeo, vecMat);
          asteroidGroup.add(vectorLine);
        }

        renderedAsteroidsPool.push({
          id: ast.id,
          asteroid: ast,
          mesh: rockMesh,
          trailLine,
          vectorLine,
          directionArrow,
          phaseOffset: (parseFloat(ast.id) * 37) % 1000
        });
      });

      setLoading(false);
    };

    rebuildAsteroidsInScene();

    let prevSelectedId = selectedId;
    let prevFilterHazardous = filterHazardousOnly;
    let prevFilterSize = filterSizeMin;
    let prevAsteroidsLength = asteroids.length;

    // 9. EVENT LISTENERS: INTERACTIVE SELECTION VIA RAYCASTING
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const checkList = [
        moonMesh,
        ...renderedAsteroidsPool.map((ra) => ra.mesh)
      ];
      const intersects = raycaster.intersectObjects(checkList);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const clickedId = clickedMesh.userData.asteroidId;
        onSelectAsteroid(clickedId);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const checkList = [
        moonMesh,
        ...renderedAsteroidsPool.map((ra) => ra.mesh)
      ];
      const intersects = raycaster.intersectObjects(checkList);

      if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        const hoveredId = hoveredMesh.userData.asteroidId;
        if (stateRef.current.hoveredId !== hoveredId) {
          stateRef.current.hoveredId = hoveredId;
          
          if (hoveredId === "moon") {
            setHoveredIsMoon(true);
            setHoveredAsteroid(null);
          } else {
            setHoveredIsMoon(false);
            const found = stateRef.current.asteroids.find((a) => a.id === hoveredId);
            setHoveredAsteroid(found || null);
          }
          
          renderedAsteroidsPool.forEach((item) => {
            const isHovered = item.id === hoveredId;
            const isSelected = item.id === stateRef.current.selectedId;
            const mat = item.mesh.material as THREE.MeshPhongMaterial;
            mat.emissive.setHex(isSelected ? 0x00f2ff : isHovered ? 0x0088ff : 0x000000);
            mat.emissiveIntensity = isSelected ? 0.6 : isHovered ? 0.35 : 0;
            
            if (item.trailLine) {
              const lineMat = item.trailLine.material as THREE.LineBasicMaterial;
              lineMat.opacity = isSelected ? 0.8 : isHovered ? 0.5 : 0.18;
            }
          });
        }
      } else {
        if (stateRef.current.hoveredId !== null) {
          stateRef.current.hoveredId = null;
          setHoveredAsteroid(null);
          setHoveredIsMoon(false);
          
          renderedAsteroidsPool.forEach((item) => {
            const isSelected = item.id === stateRef.current.selectedId;
            const mat = item.mesh.material as THREE.MeshPhongMaterial;
            mat.emissive.setHex(isSelected ? 0x00f2ff : 0x000000);
            mat.emissiveIntensity = isSelected ? 0.6 : 0;
            
            if (item.trailLine) {
              const lineMat = item.trailLine.material as THREE.LineBasicMaterial;
              lineMat.opacity = isSelected ? 0.8 : 0.18;
            }
          });
        }
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);

    // 10. ANIMATION LOOP
    const clock = new THREE.Clock();
    let accumulatedTime = 0;

    const animate = () => {
      if (isDestroyed) return;

      requestAnimationFrame(animate);

      const current = stateRef.current;

      if (
        prevSelectedId !== current.selectedId ||
        prevFilterHazardous !== current.filterHazardousOnly ||
        prevFilterSize !== current.filterSizeMin ||
        prevAsteroidsLength !== current.asteroids.length
      ) {
        prevSelectedId = current.selectedId;
        prevFilterHazardous = current.filterHazardousOnly;
        prevFilterSize = current.filterSizeMin;
        prevAsteroidsLength = current.asteroids.length;
        rebuildAsteroidsInScene();
      }

      const delta = clock.getDelta();
      accumulatedTime += delta * current.simulationSpeed;

      // Rotate Earth
      earthMesh.rotation.y += 0.05 * delta;

      // Rotate Moon around Earth
      moonGroup.rotation.y += 0.03 * delta * (1.0 + Math.log10(current.simulationSpeed + 1));

      const isMoonSelected = current.selectedId === "moon";
      const isMoonHovered = current.hoveredId === "moon";
      moonMat.emissive.setHex(isMoonSelected ? 0x00f2ff : isMoonHovered ? 0x0088ff : 0x000000);
      moonMat.emissiveIntensity = isMoonSelected ? 0.6 : isMoonHovered ? 0.35 : 0;

      starfield.rotation.y += 0.002 * delta;

      renderedAsteroidsPool.forEach((item) => {
        const ast = item.asteroid;
        const mesh = item.mesh;

        mesh.rotation.x += 0.15 * delta;
        mesh.rotation.y += 0.08 * delta;

        const scaledMissDistance = 1.2 + Math.log2(ast.missDistanceLd + 1) * 2.2;
        const seedAngle = ((parseFloat(ast.id) * 31) % 100) / 100 * Math.PI * 2;
        const seedInclination = (((parseFloat(ast.id) * 7) % 50) - 25) / 180 * Math.PI;

        const p0 = new THREE.Vector3(
          Math.cos(seedAngle) * scaledMissDistance,
          Math.sin(seedInclination) * scaledMissDistance,
          Math.sin(seedAngle) * scaledMissDistance
        );

        const flybyDir = new THREE.Vector3(-p0.z, p0.y * 0.3, p0.x).normalize();

        let speedFactor;
        if (ast.id === current.selectedId && current.showPredictedRoute) {
          speedFactor = (ast.velocityKms / 10.0) * 0.45;
        } else {
          speedFactor = ast.velocityKms * 0.0015;
        }

        const animOffset = ((accumulatedTime * 0.1 * speedFactor) % 60) - 30;

        const currentPos = p0.clone().addScaledVector(flybyDir, animOffset);
        mesh.position.copy(currentPos);

        if (item.vectorLine && ast.id === current.selectedId) {
          const posAttr = item.vectorLine.geometry.attributes.position;
          posAttr.setXYZ(1, currentPos.x, currentPos.y, currentPos.z);
          posAttr.needsUpdate = true;
        }
      });

      if (current.selectedId === "moon") {
        const moonWorldPos = new THREE.Vector3();
        moonMesh.getWorldPosition(moonWorldPos);
        controls.target.lerp(moonWorldPos, 0.08);
      } else if (current.selectedId) {
        const targetRa = renderedAsteroidsPool.find((ra) => ra.id === current.selectedId);
        if (targetRa) {
          controls.target.lerp(targetRa.mesh.position, 0.08);
        }
      } else {
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.08);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 11. RESIZE HANDLER
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || Math.max(window.innerHeight - 80, 400);

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // 12. CLEANUP & MEMORY DISPOSAL ON UNMOUNT
    return () => {
      isDestroyed = true;
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
        if (obj instanceof THREE.Line) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) (obj.material as THREE.Material).dispose();
        }
      });

      controls.dispose();
      renderer.dispose();
      earthTex.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none outline-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing outline-none" />

      {/* UNIFIED NOT-TO-SCALE SIMULATION DISCLAIMER & CONTROLS BADGE */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5 max-w-[85vw] sm:max-w-xl text-center">
        <div className="bg-black/90 backdrop-blur-md border border-zinc-800 px-3.5 py-1.5 flex items-center gap-2.5 text-[10px] font-mono text-zinc-300 shadow-xl">
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse flex-shrink-0" />
          <span>
            <strong className="text-white uppercase tracking-wider">Simulation Scale Notice:</strong> Orbital distances & sizes scaled for 3D visibility. Real data (km & LD) in telemetry.
          </span>
        </div>
        <div className="hidden sm:block text-[9px] font-mono text-zinc-400 uppercase tracking-widest bg-black/80 backdrop-blur-sm px-3 py-0.5 border border-zinc-800/80 shadow-md">
          Drag canvas to rotate • Scroll to zoom • Click object to inspect
        </div>
      </div>

      {/* HIGH-TECH SCI-FI OBSERVATORY LOADER SCREEN */}
      {loading && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center gap-5 z-50 transition-opacity duration-700 pointer-events-auto">
          {/* Animated Orbital Scanner Reticle */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Outer Spinning Ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/40 animate-[spin_8s_linear_infinite]" />
            
            {/* Counter-rotating Ring */}
            <div className="absolute inset-2 rounded-full border border-zinc-800 border-t-cyan-400 animate-[spin_4s_linear_infinite_reverse]" />
            
            {/* Pulsing Core Globe Icon */}
            <div className="relative z-10 w-10 h-10 bg-zinc-950 border border-cyan-500/60 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>

            {/* Target Crosshairs */}
            <div className="absolute -inset-2 flex items-center justify-between pointer-events-none">
              <div className="w-2 h-0.5 bg-cyan-400/60" />
              <div className="w-2 h-0.5 bg-cyan-400/60" />
            </div>
            <div className="absolute -inset-2 flex flex-col items-center justify-between pointer-events-none">
              <div className="w-0.5 h-2 bg-cyan-400/60" />
              <div className="w-0.5 h-2 bg-cyan-400/60" />
            </div>
          </div>

          {/* Telemetry Status text */}
          <div className="text-center space-y-1.5 px-4">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              <h3 className="text-white font-black text-xs tracking-widest uppercase">
                NASA NEO OBSERVATION STREAM
              </h3>
            </div>
            <p className="text-zinc-400 font-mono text-[10px] tracking-wider uppercase">
              Calibrating 3D Geocentric Celestial Vectors...
            </p>
          </div>

          {/* Live Status Checklist Ticker */}
          <div className="border border-zinc-800 bg-zinc-950/90 px-4 py-2.5 font-mono text-[9px] text-zinc-400 space-y-1 w-64 text-left shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 uppercase">Geocentric Grid</span>
              <span className="text-emerald-400 font-bold">[ONLINE]</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 uppercase">Ephemeris Sync</span>
              <span className="text-cyan-400 font-bold animate-pulse">[PROCESSING]</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 uppercase">3D Meshes</span>
              <span className="text-zinc-500">[CALIBRATING]</span>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING HOVER TOOLTIP */}
      {hoveredIsMoon && (
        <div 
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 bg-black/95 border border-zinc-800 px-4 py-2.5 rounded-none shadow-2xl pointer-events-none max-w-sm w-max animate-fade-in"
          style={{ contentVisibility: "auto" }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <h4 className="text-white font-bold tracking-wider text-xs uppercase">LUNA (EARTH&apos;S MOON)</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-[10px] text-zinc-400 font-mono">
            <div>
              <span className="text-zinc-500 uppercase">Type:</span> Natural Satellite
            </div>
            <div>
              <span className="text-zinc-500 uppercase">Diameter:</span> 3,474 km
            </div>
            <div className="col-span-2">
              <span className="text-zinc-500 uppercase">Avg Distance:</span> 384,400 km (1.0 LD)
            </div>
          </div>
        </div>
      )}

      {hoveredAsteroid && (
        <div 
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 bg-black/95 border border-zinc-800 px-4 py-2.5 rounded-none shadow-2xl pointer-events-none max-w-sm w-max animate-fade-in"
          style={{ contentVisibility: "auto" }}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${hoveredAsteroid.isHazardous ? "bg-red-500 animate-pulse" : "bg-cyan-500"}`} />
            <h4 className="text-white font-bold tracking-wider text-xs uppercase">{hoveredAsteroid.name}</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-[10px] text-zinc-400 font-mono">
            <div>
              <span className="text-zinc-500 uppercase">Diameter:</span>{" "}
              {Math.round((hoveredAsteroid.diameterMinMeters + hoveredAsteroid.diameterMaxMeters) / 2)}m
            </div>
            <div>
              <span className="text-zinc-500 uppercase">Velocity:</span>{" "}
              {hoveredAsteroid.velocityKms.toFixed(1)} km/s
            </div>
            <div className="col-span-2">
              <span className="text-zinc-500 uppercase">Miss Distance:</span>{" "}
              {hoveredAsteroid.missDistanceLd.toFixed(2)} LD ({hoveredAsteroid.missDistanceKm.toLocaleString()} km)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
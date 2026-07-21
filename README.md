# NASA Live Asteroid 3D Simulator

An interactive, high-performance 3D simulator that tracks near-Earth asteroids using live scientific observation data from NASA's Near Earth Object Web Service (NeoWs) API.

## What is this app?

This application acts as a space observation console that lets you visualize asteroids passing close to Earth today, yesterday, or any chosen calendar date. It renders real-world astronomical measurements of asteroid sizes, velocities, and trajectories into a fully interactive 3D universe.

## Live Data Sources & Architecture

- **NASA NeoWs Integration**: Connects directly to the NASA Near Earth Object Web Service (NeoWs) API to fetch real-time close approach telemetry for near-Earth asteroids.
- **Server-Side Proxy (`/api/asteroids`)**: Requests are proxied via a server-side route to securely handle API keys, sanitize responses, and optimize payload size.
- **Real-Time Astronomical Telemetry**: Extracted live fields include:
  - Estimated asteroid diameter range (meters & feet)
  - Relative velocity (km/h and km/s)
  - Close approach distance in Kilometers (km), Astronomical Units (AU), and Lunar Distances (LD)
  - Potential hazard classification (`is_potentially_hazardous_asteroid`)
  - Orbit class parameters and epoch dates
- **Resilient Fallback Telemetry**: If network outages or NASA rate limits occur, the app seamlessly transitions to a calibrated astronomical data generator built on historical NEO distributions.

## Simulation Scale Notice (Visual Model vs. Telemetry Data)

- **Logarithmic Distance & Size Scaling**: In real space, astronomical distances are immensely vast (1 Lunar Distance = 384,400 km). Rendering objects to exact 1:1 spatial scale would make Earth a tiny sub-pixel dot and render multi-meter asteroids completely invisible on screen.
- **Enhanced Visual Models**: For interactive utility, orbital radii and 3D mesh geometries in the simulator canvas are proportionally scaled so users can visually track trajectories, zoom in, hover, and click on target space rocks.
- **Accurate Telemetry Display**: While visual models are scaled for 3D web visibility, all numbers in the details panels, telemetry overlays, and comparative size metrics represent exact, real-world scientific values.

## Core Features

- **Geocentric & Heliocentric Views**: Switch between a Geocentric orbital grid centered on Earth (tracking the Moon and passing asteroids) and a Heliocentric view centered on the Sun.
- **Real-Time Interactive 3D Canvas**: Built with high-performance, raw Three.js rendering with orbital camera controls, dynamic glow shaders, and camera focus lock.
- **Visual Size Comparison**: Proportional graphics comparing any selected asteroid's diameter with recognizable structures (a Human, Boeing 747, Great Pyramid of Giza, Eiffel Tower, or Burj Khalifa).
- **Time Dilation Controls**: Pause or speed up simulation time (up to 150x speed) to observe intersection vectors and orbital progression.
- **Filtered Target Controls**: Filter asteroids by size threshold or isolate potentially hazardous space objects in real-time.

## Procedural Asset Engine

To maximize rendering performance and eliminate texture download overhead:
1. **Procedural Holographic Earth**: Generates dynamic cloud layers, continental landmasses, and atmospheric haze using in-memory HTML5 Canvas textures with 0ms network loading latency.
2. **Procedural Asteroid Meshes**: Generates organic, non-uniform irregular polyhedral structures using vertex noise perturbation algorithms.


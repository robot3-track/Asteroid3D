// Physics and planetary defense calculations

export interface ImpactDamageReport {
  energyJoules: number;
  megatonsTNT: string;
  craterDiameterMeters: number;
  craterDepthMeters: number;
  fireballRadiusMeters: number;
  airBlastRadiusMeters: number; // 5 psi overpressure (structural collapse zone)
  seismicMagnitude: number;
}

export interface DeflectionSimResult {
  deltaV: number; // m/s impulse added
  missDistanceKm: number; // New miss distance after momentum accumulation
  deflectedSuccessfully: boolean;
  timeToImpactYears: number;
}

// Calculates impact blast radius and crater metrics using scaling laws
export function calculateImpactDamage(
  diameterMeters: number,
  velocityKms: number,
  densityKgM3: number = 2500 // Typical stony asteroid density
): ImpactDamageReport {
  const radius = diameterMeters / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  const massKg = volume * densityKgM3;
  const velocityMs = velocityKms * 1000;

  // Kinetic Energy = 0.5 * m * v^2
  const energyJoules = 0.5 * massKg * Math.pow(velocityMs, 2);
  const megatonsTNT = (energyJoules / 4.184e15).toFixed(2);

  // Transient Crater Scaling Law (Gault/Melosh approximations)
  // D_crater ~ 1.16 * (rho_p / rho_t)^0.33 * D_p^0.78 * v^0.44 * g^-0.22
  const craterDiameterMeters = Math.round(
    1.16 * Math.pow(diameterMeters, 0.78) * Math.pow(velocityMs, 0.44)
  );
  const craterDepthMeters = Math.round(craterDiameterMeters / 4.5);

  // Fireball thermal radiation radius approximation
  const fireballRadiusMeters = Math.round(
    0.002 * Math.pow(energyJoules, 0.33)
  );

  // Heavy structural damage airblast (5 psi overpressure radius)
  const airBlastRadiusMeters = Math.round(
    0.07 * Math.pow(energyJoules, 0.33)
  );

  // Richter scale seismic magnitude equivalent at impact
  const seismicMagnitude = Number(
    (0.67 * (Math.log10(energyJoules) - 4.87)).toFixed(1)
  );

  return {
    energyJoules,
    megatonsTNT,
    craterDiameterMeters,
    craterDepthMeters,
    fireballRadiusMeters,
    airBlastRadiusMeters,
    seismicMagnitude,
  };
}

// Calculates momentum transfer delta-V (DART-like kinetic impactor)
export function calculateDeflection(
  asteroidDiameterMeters: number,
  spacecraftMassKg: number,
  impactVelocityKms: number,
  betaMomentumFactor: number = 2.0, // Momentum enhancement from debris recoil
  leadTimeYears: number = 5,
  originalMissDistanceKm: number = 0
): DeflectionSimResult {
  const radius = asteroidDiameterMeters / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  const asteroidMassKg = volume * 2500;
  const velocityMs = impactVelocityKms * 1000;

  // delta_v = beta * (m_sc / M_ast) * v_rel
  const deltaV =
    (betaMomentumFactor * (spacecraftMassKg / asteroidMassKg) * velocityMs);

  // Drift = deltaV * time_in_seconds (orbital mechanics accumulation approximation)
  const leadTimeSeconds = leadTimeYears * 365.25 * 24 * 3600;
  const positionDriftKm = (deltaV * leadTimeSeconds) / 1000;

  const missDistanceKm = originalMissDistanceKm + positionDriftKm;
  const earthRadiusKm = 6371;

  return {
    deltaV,
    missDistanceKm,
    deflectedSuccessfully: missDistanceKm > earthRadiusKm,
    timeToImpactYears: leadTimeYears,
  };
}
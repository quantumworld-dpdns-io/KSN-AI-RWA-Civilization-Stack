import { InfrastructureAsset } from '../types';

export interface OrbitalAsset extends InfrastructureAsset {
  orbitalClass: "LEO" | "MEO" | "GEO" | "L1" | "L2";
  inclination: number;
  launchDate: string;
}

export interface FusionAsset extends InfrastructureAsset {
  confinementType: "MAGNETIC" | "INERTIAL" | "Z_PINCH";
  plasmaTemperatureK: number;
  qFactor: number;
}

export interface DysonSwarmNode extends InfrastructureAsset {
  stellarOrbitRadiusAu: number;
  collectorAreaSqKm: number;
  beamEfficiency: number;
}

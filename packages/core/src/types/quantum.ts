import { InfrastructureAsset } from '../types';

export interface QuantumComputeAsset extends InfrastructureAsset {
  qubits: number;
  coherenceTimeMs: number;
  errorRate: number;
  topology: NetworkTopology;
}

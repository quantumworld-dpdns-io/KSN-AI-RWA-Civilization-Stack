import { InfrastructureAsset } from '../types';
import { NetworkTopology } from './network';

export interface QuantumComputeAsset extends InfrastructureAsset {
  qubits: number;
  coherenceTimeMs: number;
  errorRate: number;
  topology: NetworkTopology;
}

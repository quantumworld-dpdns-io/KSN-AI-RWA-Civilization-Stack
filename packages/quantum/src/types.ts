export interface QuantumCircuit {
  id: string;
  numQubits: number;
  gates: QuantumGate[];
  metadata?: Record<string, any>;
}

export interface QuantumGate {
  type: string;
  qubits: number[];
  params?: number[];
}

export interface QuantumState {
  amplitudes: number[]; // Real and imaginary parts or just magnitudes for simple sims
  numQubits: number;
}

export interface QuantumMeasurement {
  counts: Record<string, number>;
  shots: number;
}

export interface BackendCapabilities {
  maxQubits: number;
  supportedGates: string[];
  noiseModel?: string;
  isGpuAccelerated: boolean;
}

export type BackendStatus = "online" | "offline" | "degraded";

export interface QuantumBackend {
  id: string;
  capabilities: BackendCapabilities;
  status: BackendStatus;
  run(circuit: QuantumCircuit, shots?: number): Promise<QuantumMeasurement>;
}

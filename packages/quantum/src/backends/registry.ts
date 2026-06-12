import { QuantumBackend } from '../types';

export class BackendRegistry {
  private backends: Map<string, QuantumBackend> = new Map();

  register(backend: QuantumBackend) {
    this.backends.set(backend.id, backend);
  }

  getBackend(id: string): QuantumBackend | undefined {
    return this.backends.get(id);
  }

  listBackends(): QuantumBackend[] {
    return Array.from(this.backends.values());
  }

  findBestBackend(requiredQubits: number): QuantumBackend | undefined {
    return this.listBackends()
      .filter(b => b.status === "online" && b.capabilities.maxQubits >= requiredQubits)
      .sort((a, b) => (b.capabilities.isGpuAccelerated ? 1 : 0) - (a.capabilities.isGpuAccelerated ? 1 : 0))[0];
  }
}

export const globalBackendRegistry = new BackendRegistry();

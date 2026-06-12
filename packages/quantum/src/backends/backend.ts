import { QuantumBackend, QuantumCircuit, QuantumMeasurement } from '../types';

export abstract class BaseQuantumBackend implements QuantumBackend {
  abstract id: string;
  abstract capabilities: any;
  abstract status: any;

  abstract run(circuit: QuantumCircuit, shots?: number): Promise<QuantumMeasurement>;

  protected validateCircuit(circuit: QuantumCircuit) {
    if (circuit.numQubits > this.capabilities.maxQubits) {
      throw new Error(`Circuit requires ${circuit.numQubits} qubits, but backend only supports ${this.capabilities.maxQubits}`);
    }
  }
}

export class QuantumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuantumError";
  }
}

export class CircuitCompilationError extends QuantumError {
  constructor(message: string) {
    super(`Compilation failed: ${message}`);
  }
}

export class BackendUnavailableError extends QuantumError {
  constructor(id: string) {
    super(`Backend ${id} is unavailable`);
  }
}

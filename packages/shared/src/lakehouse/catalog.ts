export interface IcebergTableMetadata {
  formatVersion: number;
  tableUuid: string;
  location: string;
  lastSequenceNumber: number;
  lastUpdatedMs: number;
  lastColumnId: number;
  schemas: any[];
  partitionSpecs: any[];
  snapshots: any[];
}

export class MetadataCatalog {
  private tables: Map<string, IcebergTableMetadata> = new Map();

  registerTable(name: string, metadata: IcebergTableMetadata) {
    this.tables.set(name, metadata);
  }

  getTable(name: string): IcebergTableMetadata | undefined {
    return this.tables.get(name);
  }

  listTables(): string[] {
    return Array.from(this.tables.keys());
  }
}

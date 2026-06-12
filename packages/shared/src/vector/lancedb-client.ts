import { VectorStoreClient, VectorEmbedding, SearchResult } from './types';
import * as lancedb from 'vectordb';

export class LanceDBClient implements VectorStoreClient {
  private db?: lancedb.Connection;

  constructor(private uri: string = './data/lancedb') {}

  async init(): Promise<void> {
    this.db = await lancedb.connect(this.uri);
  }

  async upsert(collection: string, embeddings: VectorEmbedding[]): Promise<void> {
    if (!this.db) throw new Error('LanceDB not initialized');
    
    const data = embeddings.map(e => ({
      vector: e.vector,
      id: e.id,
      text: e.text || '',
      ...e.metadata
    }));

    try {
      const tbl = await this.db.openTable(collection);
      await tbl.add(data);
    } catch {
      // Create if doesn't exist
      await this.db.createTable(collection, data);
    }
  }

  async search(collection: string, queryVector: number[], limit: number = 10, filter?: Record<string, any>): Promise<SearchResult[]> {
    if (!this.db) throw new Error('LanceDB not initialized');
    
    try {
      const tbl = await this.db.openTable(collection);
      let query = tbl.search(queryVector).limit(limit);
      
      // LanceDB supports SQL-like filters
      if (filter && Object.keys(filter).length > 0) {
        const filterStr = Object.entries(filter).map(([k, v]) => `${k} = '${v}'`).join(' AND ');
        query = query.filter(filterStr);
      }
      
      const results = await query.execute();
      
      return results.map((r: any) => {
        const { vector, id, text, _distance, ...metadata } = r;
        return {
          id: id as string,
          vector: vector as number[],
          metadata,
          text: text as string,
          score: _distance || 0 // Usually distance
        };
      });
    } catch {
      return []; // Table might not exist yet
    }
  }

  async healthCheck(): Promise<boolean> {
    return !!this.db;
  }
}

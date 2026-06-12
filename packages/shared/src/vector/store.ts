import { VectorStoreClient, SearchResult, VectorEmbedding } from './types';

export class UnifiedVectorStore {
  constructor(private client: VectorStoreClient) {}

  async init() {
    await this.client.init();
  }

  async addDocuments(collection: string, documents: { id: string, text: string, vector: number[], metadata?: any }[]) {
    const embeddings: VectorEmbedding[] = documents.map(d => ({
      id: d.id,
      text: d.text,
      vector: d.vector,
      metadata: d.metadata
    }));
    await this.client.upsert(collection, embeddings);
  }

  async searchSimilar(collection: string, queryVector: number[], limit = 5, filter?: Record<string, any>): Promise<SearchResult[]> {
    return this.client.search(collection, queryVector, limit, filter);
  }

  async isHealthy(): Promise<boolean> {
    return this.client.healthCheck();
  }
}

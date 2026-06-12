import { VectorStoreClient, VectorEmbedding, SearchResult } from './types';
import { ChromaClient as Chroma } from 'chromadb';

export class ChromaDBClient implements VectorStoreClient {
  private client: Chroma;

  constructor(url: string = 'http://localhost:8000') {
    this.client = new Chroma({ path: url });
  }

  async init(): Promise<void> {
    // Chroma initializes collections on demand or lazily.
  }

  async upsert(collection: string, embeddings: VectorEmbedding[]): Promise<void> {
    const col = await this.client.getOrCreateCollection({ name: collection });
    await col.upsert({
      ids: embeddings.map(e => e.id),
      embeddings: embeddings.map(e => e.vector),
      metadatas: embeddings.map(e => e.metadata || {}),
      documents: embeddings.map(e => e.text || ''),
    });
  }

  async search(collection: string, queryVector: number[], limit: number = 10, filter?: Record<string, any>): Promise<SearchResult[]> {
    const col = await this.client.getCollection({ name: collection });
    const results = await col.query({
      queryEmbeddings: [queryVector],
      nResults: limit,
      where: filter as any,
    });

    if (!results.ids[0]) return [];

    return results.ids[0].map((id, index) => ({
      id,
      vector: results.embeddings?.[0]?.[index] || [],
      metadata: results.metadatas?.[0]?.[index] as Record<string, any> || undefined,
      text: results.documents?.[0]?.[index] || undefined,
      score: results.distances?.[0]?.[index] ?? 0, // In chroma, distance is returned. Lower is better.
    }));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.heartbeat();
      return true;
    } catch {
      return false;
    }
  }
}

import { VectorStoreClient, VectorEmbedding, SearchResult } from './types';
import { QdrantClient } from '@qdrant/js-client-rest';

export class QdrantVectorClient implements VectorStoreClient {
  private client: QdrantClient;

  constructor(url: string = 'http://localhost:6333') {
    this.client = new QdrantClient({ url });
  }

  async init(): Promise<void> {
    // Qdrant collections usually need explicit creation, but we'll assume they exist or handle elsewhere.
  }

  async upsert(collection: string, embeddings: VectorEmbedding[]): Promise<void> {
    const points = embeddings.map(e => ({
      id: e.id,
      vector: e.vector,
      payload: { ...e.metadata, text: e.text }
    }));
    await this.client.upsert(collection, { wait: true, points });
  }

  async search(collection: string, queryVector: number[], limit: number = 10, filter?: Record<string, any>): Promise<SearchResult[]> {
    // Basic filter mapping, Qdrant filters are complex
    const qdrantFilter = filter ? {
      must: Object.entries(filter).map(([key, match]) => ({
        key, match: { value: match }
      }))
    } : undefined;

    const results = await this.client.search(collection, {
      vector: queryVector,
      limit,
      filter: qdrantFilter,
      with_payload: true,
      with_vector: true
    });

    return results.map(r => ({
      id: String(r.id),
      vector: r.vector as number[],
      metadata: r.payload as Record<string, any>,
      text: r.payload?.text as string,
      score: r.score
    }));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const aliases = await this.client.getAliases();
      return !!aliases;
    } catch {
      return false;
    }
  }
}

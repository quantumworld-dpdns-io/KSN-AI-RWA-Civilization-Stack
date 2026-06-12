export interface VectorEmbedding {
  vector: number[];
  id: string;
  metadata?: Record<string, any>;
  text?: string;
}

export interface SearchResult extends VectorEmbedding {
  score: number;
}

export interface VectorStoreClient {
  init(): Promise<void>;
  upsert(collection: string, embeddings: VectorEmbedding[]): Promise<void>;
  search(collection: string, queryVector: number[], limit?: number, filter?: Record<string, any>): Promise<SearchResult[]>;
  healthCheck(): Promise<boolean>;
}

export type EmbeddingProvider = 'openai' | 'local';

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  model: string;
  apiKey?: string;
}
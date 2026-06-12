import { EmbeddingConfig } from './types';
import OpenAI from 'openai';
import { pipeline, env } from '@xenova/transformers';

// Configure local models to not download unnecessarily if cached
env.allowLocalModels = true;

export class EmbeddingService {
  private openai?: OpenAI;
  private localPipeline?: any;

  constructor(private config: EmbeddingConfig) {
    if (config.provider === 'openai') {
      this.openai = new OpenAI({ apiKey: config.apiKey || process.env.OPENAI_API_KEY });
    }
  }

  async init() {
    if (this.config.provider === 'local') {
      this.localPipeline = await pipeline('feature-extraction', this.config.model);
    }
  }

  async embed(text: string): Promise<number[]> {
    if (this.config.provider === 'openai' && this.openai) {
      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: text,
      });
      return response.data[0].embedding;
    } else if (this.config.provider === 'local' && this.localPipeline) {
      const output = await this.localPipeline(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    }
    throw new Error('Embedding provider not properly initialized');
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.embed(t)));
  }
}

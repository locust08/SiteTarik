type D1Result<T = unknown> = {
  results?: T[];
  success: boolean;
  meta: Record<string, unknown>;
};

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

type R2PutOptions = {
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
};

type R2ObjectBody = {
  httpMetadata?: {
    contentType?: string;
  };
  httpEtag: string;
  body: ReadableStream;
  writeHttpMetadata(headers: Headers): void;
};

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: ArrayBuffer | ReadableStream | string, options?: R2PutOptions): Promise<unknown>;
}

export interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StoredObject {
  url: string;
  key: string;
}

export interface StorageProvider {
  readonly name: "local" | "vercel-blob";
  putObject(input: PutObjectInput): Promise<StoredObject>;
  existsByHash(hash: string): Promise<StoredObject | null>;
  publicUrl(key: string): string;
}

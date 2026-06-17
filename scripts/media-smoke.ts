import { del } from "@vercel/blob";
import { loadEnvConfig } from "@next/env";
import {
  getVercelBlobAuthMode,
  getVercelBlobAuthOptions,
  VercelBlobStorageProvider,
} from "@/lib/storage/vercel-blob-provider";

loadEnvConfig(process.cwd());

async function main() {
  console.log(`Blob auth mode: ${getVercelBlobAuthMode()} (token values never printed)`);
  const provider = new VercelBlobStorageProvider();
  const key = `smoke/media-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  const body = Buffer.from(`multistore media smoke ${new Date().toISOString()}\n`, "utf8");

  const uploaded = await provider.putObject({
    key,
    body,
    contentType: "text/plain; charset=utf-8",
  });

  console.log(`Uploaded test blob: ${uploaded.key}`);
  console.log(`URL: ${uploaded.url}`);

  await del(uploaded.url, getVercelBlobAuthOptions());
  console.log("Deleted test blob.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`media:smoke failed: ${message}`);
  if (message.includes("storeId") || message.includes("BLOB_STORE_ID")) {
    console.error(
      "OIDC Blob auth may also need BLOB_STORE_ID locally. Run `vercel env pull` for the connected Blob store or set BLOB_STORE_ID explicitly."
    );
  }
  process.exitCode = 1;
});

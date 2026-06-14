export async function fetchReadablePage(_targetUrl: string): Promise<string> {
  void _targetUrl;
  throw new Error("Reader-based marketplace fetching is disabled. Use official provider APIs.");
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

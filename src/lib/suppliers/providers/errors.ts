export class ProviderError extends Error {
  constructor(
    message: string,
    readonly providerKey: string,
    readonly code: string
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export class ProviderAuthMissingError extends ProviderError {
  constructor(providerKey: string, missingEnv: string[]) {
    super(
      `${providerKey} is not configured. Missing: ${missingEnv.join(", ")}`,
      providerKey,
      "AUTH_MISSING"
    );
    this.name = "ProviderAuthMissingError";
  }
}

export class UnsupportedCapabilityError extends ProviderError {
  constructor(providerKey: string, capability: string) {
    super(`${providerKey} does not support ${capability} in this configuration.`, providerKey, "UNSUPPORTED_CAPABILITY");
    this.name = "UnsupportedCapabilityError";
  }
}

export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof ProviderError;
}


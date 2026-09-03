import { createHash } from "node:crypto";
import {
  CatalogReferenceFixtureV2Schema,
  ProductRevisionV2Schema,
} from "./contracts";

export type CanonicalJsonValue =
  | null
  | boolean
  | number
  | string
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };

function canonicalizeValue(
  value: unknown,
  ancestors: WeakSet<object>,
  path: string
): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Cannot canonicalize a non-finite number at ${path}`);
    }
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (
    typeof value === "undefined" ||
    typeof value === "bigint" ||
    typeof value === "symbol" ||
    typeof value === "function"
  ) {
    throw new TypeError(`Cannot canonicalize ${typeof value} at ${path}`);
  }
  if (typeof value !== "object") {
    throw new TypeError(`Cannot canonicalize value at ${path}`);
  }
  if (ancestors.has(value)) {
    throw new TypeError(`Cannot canonicalize a circular value at ${path}`);
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const enumerableKeys = Object.keys(value);
      const ownKeys = Reflect.ownKeys(value);
      if (
        enumerableKeys.length !== value.length ||
        value.some((_, index) => enumerableKeys[index] !== String(index)) ||
        ownKeys.some(
          (key) =>
            typeof key === "symbol" ||
            (key !== "length" && !/^(?:0|[1-9]\d*)$/.test(key))
        ) ||
        ownKeys.length !== value.length + 1
      ) {
        throw new TypeError(
          `Cannot canonicalize sparse arrays or arrays with extra keys at ${path}`
        );
      }
      return `[${value
        .map((entry, index) =>
          canonicalizeValue(entry, ancestors, `${path}[${index}]`)
        )
        .join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`Cannot canonicalize a non-plain object at ${path}`);
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError(`Cannot canonicalize symbol keys at ${path}`);
    }

    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors).sort((left, right) =>
      left < right ? -1 : left > right ? 1 : 0
    );
    const fields = keys.map((key) => {
      const descriptor = descriptors[key];
      if (
        !descriptor ||
        !descriptor.enumerable ||
        !("value" in descriptor)
      ) {
        throw new TypeError(
          `Cannot canonicalize accessors or hidden fields at ${path}.${key}`
        );
      }
      return `${JSON.stringify(key)}:${canonicalizeValue(
        descriptor.value,
        ancestors,
        `${path}.${key}`
      )}`;
    });
    return `{${fields.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

/**
 * Produces compact deterministic JSON. Object keys are sorted, array order is
 * preserved, and values that JSON would silently erase or coerce are refused.
 */
export function canonicalizeCatalogValue(value: unknown): string {
  return canonicalizeValue(value, new WeakSet(), "$");
}

/** Returns a self-describing lowercase SHA-256 digest of canonical JSON. */
export function digestCatalogValue(value: unknown): `sha256:${string}` {
  const canonical = canonicalizeCatalogValue(value);
  return `sha256:${createHash("sha256").update(canonical, "utf8").digest("hex")}`;
}

export function canonicalizeProductRevisionV2(input: unknown): string {
  return canonicalizeCatalogValue(ProductRevisionV2Schema.parse(input));
}

export function digestProductRevisionV2(input: unknown): `sha256:${string}` {
  return digestCatalogValue(ProductRevisionV2Schema.parse(input));
}

export function canonicalizeReferenceFixtureV2(input: unknown): string {
  return canonicalizeCatalogValue(CatalogReferenceFixtureV2Schema.parse(input));
}

export function digestReferenceFixtureV2(input: unknown): `sha256:${string}` {
  return digestCatalogValue(CatalogReferenceFixtureV2Schema.parse(input));
}

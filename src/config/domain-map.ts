/**
 * Development-only hostname aliases.
 *
 * Production Node.js middleware resolves the Domain table as its single
 * authority. This map keeps seeded localhost/dev host simulations convenient;
 * it must never activate or override a production tenant.
 */

export const DEFAULT_STORE_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_STORE ?? "drones";

export const STORE_COOKIE = "msdf_store";

export const DOMAIN_MAP: Record<string, string> = {
  // ---- Seeded stores (live in the local database) ----
  "dronestore.example": "drones",
  "www.dronestore.example": "drones",
  "bambussmil.example": "bamboo-toothbrushes",
  "www.bambussmil.example": "bamboo-toothbrushes",
  "ergonomikontor.example": "ergonomic-office",
  "www.ergonomikontor.example": "ergonomic-office",
  "pelspleie.example": "pet-grooming",
  "www.pelspleie.example": "pet-grooming",
  "turklar.example": "hiking-gear",
  "www.turklar.example": "hiking-gear",

  // ---- Optional local-development aliases. ----
  "espressohjem.example": "espresso-home",
  "kjokkenproff.example": "kitchen-pro",
  "babytrygg.example": "baby-safety",
  "sykkeldeler.example": "bike-parts",
  "yogarom.example": "yoga-room",
  "vinterlys.example": "winter-lighting",
  "hagedrom.example": "garden-dream",
  "kontorstol.example": "office-chairs",
  "lopesko.example": "running-shoes",
  "fiskelykke.example": "fishing-luck",
  "kattelek.example": "cat-toys",
  "hundeseng.example": "dog-beds",
  "soverom.example": "sleep-comfort",
  "badstue.example": "sauna-supply",
  "gamingrom.example": "gaming-room",
  "fotostudio.example": "photo-studio",
  "tegnesaker.example": "art-supplies",
  "strikkegarn.example": "knitting-yarn",
  "akvarium.example": "aquarium-life",
  "terrarium.example": "terrarium-world",
  "droneproff.example": "drones-pro",
  "elsparkesykkel.example": "e-scooters",
  "campingmat.example": "camp-kitchen",
  "klatregrep.example": "climbing-gear",
  "padlebrett.example": "paddle-boards",
  "skiutstyr.example": "ski-equipment",
  "barnerom.example": "kids-room",
  "smartlys.example": "smart-lighting",
  "verktoykasse.example": "tool-box",
  "grillmester.example": "bbq-master",
  "kaffebar.example": "coffee-bar",
  "tehjorne.example": "tea-corner",
  "massasje.example": "massage-recovery",
  "reiseutstyr.example": "travel-gear",
  "musikkrom.example": "music-room",
};

export function resolveStoreSlugFromHost(hostname: string): string | null {
  const host = hostname.toLowerCase().split(":")[0];
  return DOMAIN_MAP[host] ?? null;
}

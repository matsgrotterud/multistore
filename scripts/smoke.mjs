const paths = [
  "/?store=drones",
  "/s/bamboo-toothbrushes",
  "/s/drones/c/fpv-racing",
  "/s/drones/p/aero-s1-mini-4k",
  "/s/hiking-gear/guides",
  "/s/ergonomic-office/compare",
  "/s/pet-grooming/quiz",
  "/s/drones/cart",
  "/s/drones/checkout",
  "/s/drones/search?q=drone",
  "/s/bamboo-toothbrushes/policies/shipping",
  "/s/drones/policies/returns",
  "/s/drones/policies/privacy",
  "/s/drones/policies/terms",
  "/admin",
  "/admin/login",
  "/robots.txt",
  "/sitemap.xml",
  "/api/feeds/google?store=drones",
  "/api/placeholder?label=Test&seed=x",
];

let failures = 0;
for (const path of paths) {
  const res = await fetch(`http://localhost:3000${path}`, { redirect: "follow" });
  const ok = res.status === 200;
  if (!ok) failures += 1;
  console.log(`${ok ? "OK " : "FAIL"} ${res.status} ${path}`);
}
process.exit(failures === 0 ? 0 : 1);

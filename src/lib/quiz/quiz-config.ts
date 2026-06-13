/**
 * Product-finder quiz configuration per niche.
 *
 * Option `tags` match the `useCases` tags on seeded products; the quiz
 * scores each product by tag overlap + productScore, optionally capped by
 * the selected budget. Stores without a bespoke quiz get a generic one
 * derived from their categories.
 */

export interface QuizOption {
  value: string;
  label: string;
  tags: string[];
  /** When set, products above this price are excluded. */
  priceMax?: number;
}

export interface QuizQuestion {
  id: string;
  label: string;
  options: QuizOption[];
}

export const QUIZ_CONFIGS: Record<string, QuizQuestion[]> = {
  drones: [
    {
      id: "experience",
      label: "How much flying experience do you have?",
      options: [
        { value: "none", label: "None — total beginner", tags: ["beginner", "easy-fly"] },
        { value: "some", label: "Some — flown a few times", tags: ["beginner", "camera"] },
        { value: "lots", label: "Experienced pilot", tags: ["pro", "performance"] },
      ],
    },
    {
      id: "camera",
      label: "How important is camera quality?",
      options: [
        { value: "essential", label: "Essential — it is for photo/video", tags: ["camera", "4k"] },
        { value: "nice", label: "Nice to have", tags: ["camera"] },
        { value: "no", label: "Not important — I just want to fly", tags: ["racing", "easy-fly"] },
      ],
    },
    {
      id: "where",
      label: "Where will you fly most?",
      options: [
        { value: "indoor", label: "Indoors", tags: ["indoor", "compact"] },
        { value: "outdoor", label: "Outdoors", tags: ["outdoor", "gps"] },
        { value: "both", label: "Both", tags: ["compact", "outdoor"] },
      ],
    },
    {
      id: "budget",
      label: "What is your budget?",
      options: [
        { value: "low", label: "Under $150", tags: ["budget"], priceMax: 150 },
        { value: "mid", label: "$150-$400", tags: [], priceMax: 400 },
        { value: "high", label: "Above $400", tags: ["pro", "performance"] },
      ],
    },
  ],
  "bamboo-toothbrushes": [
    {
      id: "household",
      label: "Who is brushing?",
      options: [
        { value: "solo", label: "Just me", tags: ["adult"] },
        { value: "couple", label: "Two adults", tags: ["adult", "multipack"] },
        { value: "family", label: "Family with kids", tags: ["family", "kids", "multipack"] },
      ],
    },
    {
      id: "softness",
      label: "Which bristle feel do you prefer?",
      options: [
        { value: "soft", label: "Soft — sensitive gums", tags: ["soft", "sensitive"] },
        { value: "medium", label: "Medium", tags: ["medium"] },
        { value: "unsure", label: "Not sure", tags: ["soft"] },
      ],
    },
    {
      id: "subscription",
      label: "Would you like automatic replacements?",
      options: [
        { value: "yes", label: "Yes — remind/replace on schedule", tags: ["subscription"] },
        { value: "no", label: "No — I will reorder myself", tags: [] },
      ],
    },
    {
      id: "sustainability",
      label: "How far do you want to go on zero-waste?",
      options: [
        { value: "max", label: "As plastic-free as possible", tags: ["zero-waste", "compostable"] },
        { value: "balanced", label: "Balanced — practical and greener", tags: ["eco"] },
      ],
    },
  ],
  "ergonomic-office": [
    {
      id: "pain",
      label: "What bothers you most after a workday?",
      options: [
        { value: "back", label: "Lower back", tags: ["back-pain", "lumbar"] },
        { value: "neck", label: "Neck and shoulders", tags: ["neck-pain", "monitor-height"] },
        { value: "wrists", label: "Wrists and forearms", tags: ["wrist-pain", "typing"] },
        { value: "fatigue", label: "General fatigue from sitting", tags: ["standing", "movement"] },
      ],
    },
    {
      id: "setup",
      label: "What does your desk setup look like?",
      options: [
        { value: "laptop", label: "Laptop only", tags: ["laptop", "monitor-height"] },
        { value: "monitor", label: "External monitor + keyboard", tags: ["typing", "lumbar"] },
        { value: "small", label: "Small or shared desk", tags: ["compact", "laptop"] },
      ],
    },
    {
      id: "budget",
      label: "How much do you want to spend right now?",
      options: [
        { value: "low", label: "Under $50", tags: ["budget"], priceMax: 50 },
        { value: "mid", label: "$50-$150", tags: [], priceMax: 150 },
        { value: "high", label: "Whatever fixes it", tags: ["premium"] },
      ],
    },
  ],
  "pet-grooming": [
    {
      id: "pet",
      label: "Who are we grooming?",
      options: [
        { value: "dog", label: "Dog", tags: ["dog"] },
        { value: "cat", label: "Cat", tags: ["cat"] },
        { value: "both", label: "Both", tags: ["dog", "cat"] },
      ],
    },
    {
      id: "coat",
      label: "What kind of coat?",
      options: [
        { value: "long", label: "Long or double coat", tags: ["long-coat", "deshedding"] },
        { value: "short", label: "Short coat", tags: ["short-coat"] },
        { value: "curly", label: "Curly or wiry", tags: ["long-coat", "detangling"] },
      ],
    },
    {
      id: "sensitivity",
      label: "Is your pet sensitive about grooming?",
      options: [
        { value: "very", label: "Very — we need gentle tools", tags: ["sensitive-skin", "quiet"] },
        { value: "somewhat", label: "A little fidgety", tags: ["sensitive-skin"] },
        { value: "no", label: "Not at all", tags: [] },
      ],
    },
  ],
  "hiking-gear": [
    {
      id: "trip",
      label: "What kind of trips are you doing?",
      options: [
        { value: "day", label: "Day hikes", tags: ["day-hike"] },
        { value: "weekend", label: "Overnighters and weekends", tags: ["multi-day"] },
        { value: "long", label: "Multi-day treks", tags: ["multi-day", "expedition"] },
      ],
    },
    {
      id: "weather",
      label: "What conditions do you usually face?",
      options: [
        { value: "fair", label: "Mostly fair weather", tags: ["summer"] },
        { value: "wet", label: "Rain and wind", tags: ["rain", "waterproof"] },
        { value: "cold", label: "Cold or shoulder season", tags: ["winter", "insulation"] },
      ],
    },
    {
      id: "weight",
      label: "How much do you care about pack weight?",
      options: [
        { value: "ultralight", label: "Count every gram", tags: ["ultralight"] },
        { value: "balanced", label: "Balance weight and comfort", tags: ["comfort"] },
        { value: "comfort", label: "Comfort first", tags: ["comfort", "padded"] },
      ],
    },
  ],
};

export function getQuizQuestions(
  storeSlug: string,
  categoryNames: string[]
): QuizQuestion[] {
  const config = QUIZ_CONFIGS[storeSlug];
  if (config) return config;

  // Generic fallback for stores generated after launch.
  return [
    {
      id: "category",
      label: "What are you shopping for?",
      options: categoryNames.slice(0, 4).map((name) => ({
        value: name.toLowerCase().replace(/\s+/g, "-"),
        label: name,
        tags: [name.toLowerCase()],
      })),
    },
    {
      id: "budget",
      label: "What is your budget?",
      options: [
        { value: "low", label: "Entry level", tags: ["budget"], priceMax: 75 },
        { value: "mid", label: "Mid range", tags: [], priceMax: 200 },
        { value: "high", label: "Premium", tags: ["premium"] },
      ],
    },
  ];
}

export interface QuizAnswerMap {
  [questionId: string]: string;
}

export interface ScoredRecommendation<T> {
  product: T;
  matchScore: number;
  matchedTags: string[];
}

export function recommendProducts<
  T extends { price: number; useCases: string[]; productScore: number },
>(
  questions: QuizQuestion[],
  answers: QuizAnswerMap,
  products: T[],
  limit = 4
): ScoredRecommendation<T>[] {
  const selectedTags: string[] = [];
  let priceMax: number | undefined;

  for (const question of questions) {
    const answer = answers[question.id];
    const option = question.options.find((candidate) => candidate.value === answer);
    if (!option) continue;
    selectedTags.push(...option.tags);
    if (option.priceMax !== undefined) {
      priceMax = priceMax === undefined ? option.priceMax : Math.min(priceMax, option.priceMax);
    }
  }

  return products
    .filter((product) => priceMax === undefined || product.price <= priceMax)
    .map((product) => {
      const matchedTags = selectedTags.filter((tag) => product.useCases.includes(tag));
      return {
        product,
        matchedTags,
        matchScore: matchedTags.length * 3 + product.productScore / 20,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

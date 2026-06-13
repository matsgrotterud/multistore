import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ProductQuiz } from "@/components/ProductQuiz";
import { buildMetadata } from "@/lib/seo/metadata";
import { getQuizQuestions } from "@/lib/quiz/quiz-config";
import {
  getCategories,
  getFeaturedProducts,
  requireStore,
  toClientProduct,
} from "@/lib/stores/queries";

interface QuizPageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: QuizPageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildMetadata({
    store,
    title: `Product finder quiz | ${store.name}`,
    description: `Answer a few questions and get ${store.niche} recommendations matched to your real use case and budget.`,
    path: "/quiz",
  });
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const [categories, products] = await Promise.all([
    getCategories(store.id),
    getFeaturedProducts(store.id, 50),
  ]);

  const questions = getQuizQuestions(
    store.slug,
    categories.map((category) => category.name)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Quiz" }]} />
      <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">
        Find your match in 60 seconds
      </h1>
      <p className="mt-3 text-base leading-7 text-ink/70">
        A few quick questions about how you will actually use it. We rank the
        catalog for your answers — no email required to see results.
      </p>
      <div className="mt-8">
        <ProductQuiz
          storeSlug={store.slug}
          locale={store.locale}
          questions={questions}
          products={products.map(toClientProduct)}
        />
      </div>
    </div>
  );
}

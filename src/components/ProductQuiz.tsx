"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { track } from "@/lib/analytics/track";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { formatCurrency } from "@/lib/pricing/calculate-price";
import {
  recommendProducts,
  type QuizAnswerMap,
  type QuizQuestion,
} from "@/lib/quiz/quiz-config";
import { useCart } from "@/lib/cart/cart-context";
import { productRelPath } from "@/lib/stores/storefront-links";
import type { ClientProduct } from "@/lib/types";

export function ProductQuiz({
  storeSlug,
  locale,
  questions,
  products,
}: {
  storeSlug: string;
  locale: string;
  questions: QuizQuestion[];
  products: ClientProduct[];
}) {
  const cart = useCart();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerMap>({});
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [email, setEmail] = useState("");
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const recommendations = useMemo(
    () => (finished ? recommendProducts(questions, answers, products) : []),
    [finished, questions, answers, products]
  );

  function selectOption(questionId: string, value: string) {
    if (!started) {
      setStarted(true);
      track(storeSlug, "quiz_start", {});
    }
    const nextAnswers = { ...answers, [questionId]: value };
    setAnswers(nextAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setFinished(true);
      track(storeSlug, "quiz_complete", { answers: nextAnswers });
    }
  }

  function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await subscribeToNewsletter({
        storeSlug,
        email,
        source: "quiz",
        preferences: { quizAnswers: answers },
      });
      setEmailResult(result.message);
      if (result.ok) setEmail("");
    });
  }

  if (finished) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-ink">Your matches</h2>
        <p className="mt-2 text-sm text-ink/70">
          Ranked by how well each product fits your answers and our internal
          product score. No sponsorships — just the best fit from our catalog.
        </p>

        {recommendations.length === 0 ? (
          <div className="card mt-6 p-8 text-center">
            <p className="font-medium text-ink">
              Nothing in the catalog fits those answers within budget.
            </p>
            <p className="mt-2 text-sm text-ink/60">
              Try the quiz again with a wider budget, or browse all products.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {recommendations.map(({ product, matchedTags }, index) => (
              <li key={product.id} className="card flex gap-4 p-4">
                <img
                  src={product.imageUrl}
                  alt={product.imageAlt}
                  className="h-20 w-20 shrink-0 rounded-theme object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {index === 0 ? "Best match" : `Match #${index + 1}`}
                  </p>
                  <Link
                    href={cart.href(productRelPath(product.slug, product.categorySlug))}
                    className="mt-0.5 block text-sm font-semibold text-ink hover:text-primary"
                  >
                    {product.title}
                  </Link>
                  <p className="mt-1 text-sm font-bold text-ink">
                    {formatCurrency(product.price, product.currency, locale)}
                  </p>
                  {matchedTags.length > 0 && (
                    <p className="mt-1 truncate text-xs text-ink/60">
                      Matches: {matchedTags.map((tag) => tag.replace(/-/g, " ")).join(", ")}
                    </p>
                  )}
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-primary underline"
                    onClick={() =>
                      cart.addItem({
                        productId: product.id,
                        slug: product.slug,
                        categorySlug: product.categorySlug,
                        title: product.title,
                        price: product.price,
                        currency: product.currency,
                        imageUrl: product.imageUrl,
                        imageAlt: product.imageAlt,
                        shippingDaysMin: product.shippingDaysMin,
                        shippingDaysMax: product.shippingDaysMax,
                      })
                    }
                  >
                    Add to cart
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="card mt-8 p-6">
          <h3 className="text-base font-semibold text-ink">
            Email me these results (optional)
          </h3>
          <p className="mt-1 text-sm text-ink/60">
            We will send your matches and a reminder — nothing else unless you
            subscribe separately.
          </p>
          <form onSubmit={handleEmailSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="quiz-email" className="sr-only">
              Email address
            </label>
            <input
              id="quiz-email"
              type="email"
              required
              className="input flex-1"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            <button type="submit" className="btn-secondary" disabled={isPending}>
              {isPending ? "Sending…" : "Send results"}
            </button>
          </form>
          {emailResult && (
            <p role="status" className="mt-2 text-sm text-ink/70">
              {emailResult}
            </p>
          )}
        </div>

        <button
          type="button"
          className="mt-6 text-sm font-medium text-primary underline"
          onClick={() => {
            setStep(0);
            setAnswers({});
            setFinished(false);
            setEmailResult(null);
          }}
        >
          Start over
        </button>
      </div>
    );
  }

  const question = questions[step];
  if (!question) return null;

  return (
    <div>
      <p className="text-sm font-medium text-ink/60" aria-live="polite">
        Question {step + 1} of {questions.length}
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={step}
        aria-label="Quiz progress"
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(step / questions.length) * 100}%` }}
        />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-ink">{question.label}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => selectOption(question.id, option.value)}
            className="card p-5 text-left text-sm font-medium text-ink transition hover:border-primary hover:bg-primary-soft"
          >
            {option.label}
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          type="button"
          className="mt-5 text-sm font-medium text-ink/60 underline hover:text-primary"
          onClick={() => setStep(step - 1)}
        >
          ← Back
        </button>
      )}
    </div>
  );
}

import assert from "node:assert/strict";
import test from "node:test";
import { getQuizQuestions, recommendProducts } from "./quiz-config";

test("generic quiz never renders a category question without options", () => {
  const questions = getQuizQuestions("generated-store", []);

  assert.deepEqual(questions.map((question) => question.id), ["budget"]);
  assert.ok(questions.every((question) => question.options.length > 0));
});

test("generic quiz exposes the projected category once and keeps budget", () => {
  const questions = getQuizQuestions("generated-store", [
    " All slippers ",
    "all slippers",
    "",
  ]);

  assert.deepEqual(questions.map((question) => question.id), ["category", "budget"]);
  assert.deepEqual(questions[0]?.options, [
    {
      value: "all-slippers",
      label: "All slippers",
      tags: ["all slippers"],
    },
  ]);
  assert.ok(questions.every((question) => question.options.length > 0));
});

test("recommendations do not require or expose an internal product score", () => {
  const questions = [
    {
      id: "use",
      label: "Use",
      options: [{ value: "warm", label: "Warm", tags: ["warm"] }],
    },
  ];
  const products = [
    { id: "catalog-first", price: 100, useCases: [] as string[] },
    { id: "tag-match", price: 100, useCases: ["warm"] },
    { id: "catalog-second", price: 100, useCases: [] as string[] },
  ];

  const ranked = recommendProducts(questions, { use: "warm" }, products);
  assert.deepEqual(ranked.map((entry) => entry.product.id), [
    "tag-match",
    "catalog-first",
    "catalog-second",
  ]);
});

test("budget filtering remains fail-closed while ties preserve server order", () => {
  const questions = getQuizQuestions("generated-store", []);
  const products = [
    { id: "first", price: 50, useCases: [] as string[] },
    { id: "too-expensive", price: 80, useCases: [] as string[] },
    { id: "second", price: 60, useCases: [] as string[] },
  ];

  const ranked = recommendProducts(questions, { budget: "low" }, products);
  assert.deepEqual(ranked.map((entry) => entry.product.id), ["first", "second"]);
});

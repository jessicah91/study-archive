"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
  isMastered: boolean;
  createdAt: string;
};

type CardForm = {
  question: string;
  answer: string;
};

const STORAGE_KEY = "study-archive-flashcards";

const initialForm: CardForm = {
  question: "",
  answer: "",
};

const sampleCards: Flashcard[] = [
  {
    id: "sample-1",
    question: "기회비용이란 무엇인가요?",
    answer:
      "어떤 선택을 했을 때 포기해야 하는 다른 선택지 중 가장 가치가 큰 것을 의미합니다.",
    isMastered: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-2",
    question: "GDP는 무엇을 측정하나요?",
    answer:
      "일정 기간 동안 한 나라 안에서 생산된 최종 재화와 서비스의 시장가치를 측정합니다.",
    isMastered: false,
    createdAt: new Date().toISOString(),
  },
];

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [form, setForm] =
    useState<CardForm>(initialForm);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [isFlipped, setIsFlipped] =
    useState(false);

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [editingCardId, setEditingCardId] =
    useState<string | null>(null);

  const [showMastered, setShowMastered] =
    useState(true);

  const [isLoaded, setIsLoaded] =
    useState(false);

  const visibleCards = useMemo(() => {
    if (showMastered) {
      return cards;
    }

    return cards.filter(
      (card) => !card.isMastered,
    );
  }, [cards, showMastered]);

  const currentCard =
    visibleCards[currentIndex] ?? null;

  const masteredCount = useMemo(() => {
    return cards.filter(
      (card) => card.isMastered,
    ).length;
  }, [cards]);

  const progressPercent = useMemo(() => {
    if (cards.length === 0) {
      return 0;
    }

    return Math.round(
      (masteredCount / cards.length) * 100,
    );
  }, [cards.length, masteredCount]);

  useEffect(() => {
    const savedCards =
      window.localStorage.getItem(STORAGE_KEY);

    if (savedCards) {
      try {
        const parsedCards =
          JSON.parse(savedCards) as Flashcard[];

        setCards(parsedCards);
      } catch (error) {
        console.error(
          "암기카드 불러오기 오류:",
          error,
        );

        setCards(sampleCards);
      }
    } else {
      setCards(sampleCards);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cards),
    );
  }, [cards, isLoaded]);

  useEffect(() => {
    if (visibleCards.length === 0) {
      setCurrentIndex(0);
      setIsFlipped(false);
      return;
    }

    if (currentIndex >= visibleCards.length) {
      setCurrentIndex(
        visibleCards.length - 1,
      );
    }
  }, [visibleCards.length, currentIndex]);

  function updateForm(
    key: keyof CardForm,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingCardId(null);
    setIsFormOpen(false);
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const question = form.question.trim();
    const answer = form.answer.trim();

    if (!question || !answer) {
      window.alert(
        "앞면과 뒷면 내용을 모두 입력해 주세요.",
      );

      return;
    }

    if (editingCardId) {
      setCards((previous) =>
        previous.map((card) =>
          card.id === editingCardId
            ? {
                ...card,
                question,
                answer,
              }
            : card,
        ),
      );
    } else {
      const newCard: Flashcard = {
        id: crypto.randomUUID(),
        question,
        answer,
        isMastered: false,
        createdAt: new Date().toISOString(),
      };

      setCards((previous) => [
        ...previous,
        newCard,
      ]);

      setCurrentIndex(cards.length);
    }

    resetForm();
    setIsFlipped(false);
  }

  function startEditing(card: Flashcard) {
    setEditingCardId(card.id);

    setForm({
      question: card.question,
      answer: card.answer,
    });

    setIsFormOpen(true);
  }

  function deleteCard(cardId: string) {
    const shouldDelete = window.confirm(
      "이 암기카드를 삭제할까요?",
    );

    if (!shouldDelete) {
      return;
    }

    setCards((previous) =>
      previous.filter(
        (card) => card.id !== cardId,
      ),
    );

    setCurrentIndex((previous) =>
      Math.max(previous - 1, 0),
    );

    setIsFlipped(false);
  }

  function toggleMastered(cardId: string) {
    setCards((previous) =>
      previous.map((card) =>
        card.id === cardId
          ? {
              ...card,
              isMastered:
                !card.isMastered,
            }
          : card,
      ),
    );

    setIsFlipped(false);
  }

  function showPreviousCard() {
    if (visibleCards.length === 0) {
      return;
    }

    setCurrentIndex((previous) =>
      previous === 0
        ? visibleCards.length - 1
        : previous - 1,
    );

    setIsFlipped(false);
  }

  function showNextCard() {
    if (visibleCards.length === 0) {
      return;
    }

    setCurrentIndex((previous) =>
      previous === visibleCards.length - 1
        ? 0
        : previous + 1,
    );

    setIsFlipped(false);
  }

  function shuffleCards() {
    setCards((previous) => {
      const shuffled = [...previous];

      for (
        let index = shuffled.length - 1;
        index > 0;
        index -= 1
      ) {
        const randomIndex = Math.floor(
          Math.random() * (index + 1),
        );

        [
          shuffled[index],
          shuffled[randomIndex],
        ] = [
          shuffled[randomIndex],
          shuffled[index],
        ];
      }

      return shuffled;
    });

    setCurrentIndex(0);
    setIsFlipped(false);
  }

  function resetMasteredCards() {
    const shouldReset = window.confirm(
      "모든 카드의 암기 완료 상태를 초기화할까요?",
    );

    if (!shouldReset) {
      return;
    }

    setCards((previous) =>
      previous.map((card) => ({
        ...card,
        isMastered: false,
      })),
    );

    setCurrentIndex(0);
    setIsFlipped(false);
  }

  if (!isLoaded) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

        <p className="mt-4 text-sm text-slate-500">
          암기카드를 불러오는 중이에요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-indigo-600">
            FLASHCARDS
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            암기카드
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            앞면의 질문을 확인한 뒤 카드를
            뒤집어 정답을 확인해 보세요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="self-start rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 sm:self-auto"
        >
          + 카드 추가
        </button>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            전체 카드
          </p>

          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {cards.length}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            암기 완료
          </p>

          <p className="mt-3 text-2xl font-extrabold text-emerald-600">
            {masteredCount}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            학습 진행률
          </p>

          <p className="mt-3 text-2xl font-extrabold text-indigo-600">
            {progressPercent}%
          </p>
        </article>
      </section>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-700">
            전체 암기 진행률
          </p>

          <p className="text-sm font-extrabold text-indigo-600">
            {masteredCount} / {cards.length}
          </p>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={shuffleCards}
              disabled={cards.length < 2}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              순서 섞기
            </button>

            <button
              type="button"
              onClick={() => {
                setShowMastered(
                  (previous) => !previous,
                );

                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              {showMastered
                ? "암기 완료 카드 숨기기"
                : "전체 카드 보기"}
            </button>

            <button
              type="button"
              onClick={resetMasteredCards}
              disabled={masteredCount === 0}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              완료 상태 초기화
            </button>
          </div>

          {visibleCards.length > 0 && (
            <p className="text-sm font-semibold text-slate-400">
              {currentIndex + 1} /{" "}
              {visibleCards.length}
            </p>
          )}
        </div>

        {currentCard ? (
          <div>
            <button
              type="button"
              onClick={() =>
                setIsFlipped(
                  (previous) => !previous,
                )
              }
              className={[
                "flex min-h-[360px] w-full flex-col items-center justify-center rounded-[2rem] border p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg",
                currentCard.isMastered
                  ? "border-emerald-200 bg-emerald-50"
                  : isFlipped
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <p
                className={[
                  "text-xs font-extrabold tracking-[0.18em]",
                  isFlipped
                    ? "text-indigo-500"
                    : "text-slate-400",
                ].join(" ")}
              >
                {isFlipped ? "ANSWER" : "QUESTION"}
              </p>

              <p className="mt-7 max-w-3xl whitespace-pre-wrap text-xl font-bold leading-9 text-slate-900 sm:text-2xl">
                {isFlipped
                  ? currentCard.answer
                  : currentCard.question}
              </p>

              <p className="mt-8 text-sm font-semibold text-slate-400">
                카드를 누르면{" "}
                {isFlipped
                  ? "질문을"
                  : "정답을"}{" "}
                확인할 수 있어요.
              </p>

              {currentCard.isMastered && (
                <span className="mt-5 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                  암기 완료
                </span>
              )}
            </button>

            <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row">
              <button
                type="button"
                onClick={showPreviousCard}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                ← 이전 카드
              </button>

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    startEditing(currentCard)
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  수정
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleMastered(
                      currentCard.id,
                    )
                  }
                  className={[
                    "rounded-2xl px-5 py-3 text-sm font-semibold transition",
                    currentCard.isMastered
                      ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "bg-emerald-600 text-white hover:bg-emerald-500",
                  ].join(" ")}
                >
                  {currentCard.isMastered
                    ? "다시 학습하기"
                    : "암기 완료"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteCard(currentCard.id)
                  }
                  className="rounded-2xl border border-red-100 bg-white px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                >
                  삭제
                </button>
              </div>

              <button
                type="button"
                onClick={showNextCard}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                다음 카드 →
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-bold text-slate-700">
              학습할 암기카드가 없어요.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              새 카드를 추가하거나 암기 완료 카드를
              다시 표시해 주세요.
            </p>

            <button
              type="button"
              onClick={() =>
                setIsFormOpen(true)
              }
              className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              카드 추가하기
            </button>
          </div>
        )}
      </section>

      {isFormOpen && (
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {editingCardId
                  ? "암기카드 수정"
                  : "새 암기카드 추가"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                앞면에는 질문을, 뒷면에는 정답이나
                설명을 입력하세요.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              aria-label="입력창 닫기"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-500"
            >
              ×
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                앞면 질문
              </span>

              <textarea
                value={form.question}
                onChange={(event) =>
                  updateForm(
                    "question",
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="예: 기회비용이란 무엇인가요?"
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                뒷면 정답
              </span>

              <textarea
                value={form.answer}
                onChange={(event) =>
                  updateForm(
                    "answer",
                    event.target.value,
                  )
                }
                rows={5}
                placeholder="정답이나 자세한 설명을 입력하세요."
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {editingCardId
                  ? "수정 완료"
                  : "카드 추가"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                취소
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
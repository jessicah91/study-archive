"use client";

import {
  FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "안녕하세요. 공부 중 궁금한 내용을 물어보세요. 개념 설명, 시험 대비, 문제 생성, 오답 분석을 도와드릴게요.",
  },
];

const quickQuestions = [
  "이 개념을 쉽게 설명해줘",
  "시험에 나올 만한 핵심을 정리해줘",
  "객관식 문제 5개 만들어줘",
  "암기하기 쉽게 표로 정리해줘",
];

export default function ChatPage() {
  const [messages, setMessages] =
    useState<ChatMessage[]>(initialMessages);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null);

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !isSending;
  }, [input, isSending]);

  async function sendMessage(messageText?: string) {
    const trimmedMessage =
      messageText?.trim() || input.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedMessage,
    };

    const nextMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const result = (await response.json()) as {
        answer?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error ||
            "AI 답변을 불러오지 못했어요.",
        );
      }

      if (!result.answer) {
        throw new Error(
          "AI 답변 내용이 비어 있어요.",
        );
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했어요.",
      );
    } finally {
      setIsSending(false);

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    void sendMessage();
  }

  function resetChat() {
    const shouldReset = window.confirm(
      "현재 대화 내용을 모두 지울까요?",
    );

    if (!shouldReset) {
      return;
    }

    setMessages(initialMessages);
    setInput("");
    setErrorMessage("");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-indigo-600">
            AI STUDY CHAT
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            AI 학습 채팅
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            공부 중 이해되지 않는 내용을 질문하고
            설명, 요약, 문제 생성을 요청해 보세요.
          </p>
        </div>

        <button
          type="button"
          onClick={resetChat}
          className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:self-auto"
        >
          새 대화
        </button>
      </header>

      <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-800">
          빠른 질문
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => {
                setInput(question);
                textareaRef.current?.focus();
              }}
              disabled={isSending}
              className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </section>

      <section className="flex min-h-[500px] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
          {messages.map((message) => (
            <div
              key={message.id}
              className={[
                "flex",
                message.role === "user"
                  ? "justify-end"
                  : "justify-start",
              ].join(" ")}
            >
              <article
                className={[
                  "max-w-[88%] whitespace-pre-wrap rounded-3xl px-5 py-4 text-sm leading-7 sm:max-w-[75%]",
                  message.role === "user"
                    ? "rounded-br-lg bg-slate-900 text-white"
                    : "rounded-bl-lg bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                <p className="mb-2 text-xs font-bold opacity-60">
                  {message.role === "user"
                    ? "나"
                    : "AI 튜터"}
                </p>

                {message.content}
              </article>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-3xl rounded-bl-lg bg-slate-100 px-5 py-4 text-sm text-slate-500">
                <p className="mb-2 text-xs font-bold text-slate-400">
                  AI 튜터
                </p>

                답변을 작성하고 있어요...
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mx-5 mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 sm:mx-7">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-100 p-4 sm:p-5"
        >
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();

                  if (canSend) {
                    void sendMessage();
                  }
                }
              }}
              placeholder="질문을 입력하세요. Shift + Enter로 줄을 바꿀 수 있어요."
              rows={3}
              disabled={isSending}
              className="min-h-[92px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
            />

            <button
              type="submit"
              disabled={!canSend}
              className="h-[52px] shrink-0 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSending ? "전송 중" : "전송"}
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            AI 답변에는 오류가 있을 수 있으니 중요한
            내용은 수업 자료와 함께 확인하세요.
          </p>
        </form>
      </section>
    </div>
  );
}
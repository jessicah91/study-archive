type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function PagePlaceholder({
  eyebrow,
  title,
  description,
}: PagePlaceholderProps) {
  return (
    <main className="min-h-screen px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-medium tracking-[0.2em] text-black/40">
          {eyebrow}
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>

        <p className="mt-5 max-w-xl text-sm leading-7 text-black/50 md:text-base">
          {description}
        </p>

        <section className="mt-12 rounded-[32px] border border-dashed border-black/15 bg-white/60 px-6 py-20 text-center">
          <p className="text-sm text-black/40">
            이 기능은 다음 단계에서 연결할 예정이에요.
          </p>
        </section>
      </div>
    </main>
  );
}
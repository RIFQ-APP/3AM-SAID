import React, { ErrorInfo, ReactNode } from 'react';

interface GameErrorBoundaryProps {
  children: ReactNode;
}

interface GameErrorBoundaryState {
  hasError: boolean;
}

export class GameErrorBoundary extends React.Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  state: GameErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GameErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Coffeehouse game runtime error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-[#16100b] p-6 text-amber-50"
          role="alert"
        >
          <section className="w-full max-w-md rounded-2xl border border-amber-700/50 bg-[#24170e] p-6 text-center shadow-2xl">
            <div className="mb-3 text-4xl" aria-hidden="true">☕</div>
            <h1 className="mb-2 text-2xl font-bold text-amber-200">حصلت مشكلة غير متوقعة</h1>
            <p className="mb-5 text-sm leading-7 text-amber-100/75">
              اللعبة وقفت بشكل غير متوقع. تقدمك المحفوظ يفضل موجود، جرّب إعادة تشغيل اللعبة.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-12 w-full rounded-xl bg-amber-500 px-5 py-3 font-bold text-[#1c1008] transition-colors hover:bg-amber-400"
            >
              إعادة تشغيل اللعبة
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

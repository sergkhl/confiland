import { useEffect, useRef, type ReactNode } from 'react';
import type { Challenge } from '@/lib/challenges';

export function PromptTitle({ children }: { children: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const panel = heading.current?.closest('.pact-interaction');
    if (panel) panel.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, [children]);
  return (
    <h1 ref={heading} tabIndex={-1} className="prompt-title">
      {children}
    </h1>
  );
}
export function ActionDetails({
  action,
  onBack,
}: {
  action: Challenge;
  onBack: () => void;
}) {
  return (
    <section className="action-details">
      <PromptTitle>Your part of the pact</PromptTitle>
      <p className="commitment">{action.text}</p>
      <p>{action.criterion}</p>
      <blockquote>
        <span>An opening line</span>
        {action.example}
      </blockquote>
      <button className="text-button" onClick={onBack}>
        ← Back to the pact
      </button>
    </section>
  );
}

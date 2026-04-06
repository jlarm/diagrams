import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, RotateCcw, XCircle } from 'lucide-react';
import { normalizeLabel } from '../lib/storage';

function getPinStyles(status, revealed) {
  if (revealed) {
    return 'border-gold bg-gold text-slate-950 shadow-lg shadow-gold/20';
  }

  if (status === 'correct') {
    return 'border-emerald-300 bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25';
  }

  if (status === 'incorrect') {
    return 'border-rose-300 bg-rose-400 text-slate-950 shadow-lg shadow-rose-500/25';
  }

  return 'border-white bg-slate-950/90 text-white';
}

export default function QuizView({ module, onBack }) {
  const [attempts, setAttempts] = useState({});
  const [activeTagId, setActiveTagId] = useState(null);

  const correctCount = useMemo(
    () => Object.values(attempts).filter((attempt) => attempt?.status === 'correct').length,
    [attempts]
  );

  const revealAllAnswers = () => {
    const revealedState = Object.fromEntries(
      module.tags.map((tag) => [
        tag.id,
        {
          guess: attempts[tag.id]?.guess ?? '',
          status: attempts[tag.id]?.status ?? 'idle',
          revealed: true,
        },
      ])
    );

    setAttempts(revealedState);
    setActiveTagId(null);
  };

  const resetQuiz = () => {
    setAttempts({});
    setActiveTagId(null);
  };

  const updateGuess = (tagId, value) => {
    setAttempts((current) => ({
      ...current,
      [tagId]: {
        guess: value,
        status: current[tagId]?.status ?? 'idle',
        revealed: current[tagId]?.revealed ?? false,
      },
    }));
  };

  const submitGuess = (tag) => {
    const guess = attempts[tag.id]?.guess ?? '';
    const isCorrect = normalizeLabel(guess) === normalizeLabel(tag.label);

    setAttempts((current) => ({
      ...current,
      [tag.id]: {
        guess,
        status: isCorrect ? 'correct' : 'incorrect',
        revealed: current[tag.id]?.revealed ?? false,
      },
    }));
  };

  const revealOne = (tagId) => {
    setAttempts((current) => ({
      ...current,
      [tagId]: {
        guess: current[tagId]?.guess ?? '',
        status: current[tagId]?.status ?? 'idle',
        revealed: true,
      },
    }));
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
      <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/70 p-5 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-coral">Quiz Mode</p>
            <h2 className="mt-2 font-display text-3xl text-white">{module.title}</h2>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200">
            {correctCount}/{module.tags.length} identified
          </div>
          <button
            type="button"
            onClick={revealAllAnswers}
            className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20"
          >
            <Eye className="h-4 w-4" />
            Reveal All Answers
          </button>
          <button
            type="button"
            onClick={resetQuiz}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Quiz
          </button>
        </div>

        <div className="relative mt-6" onClick={() => setActiveTagId(null)}>
          <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950">
            <img src={module.imageData} alt={module.title} className="block w-full object-contain" />
          </div>

          {module.tags.map((tag, index) => {
            const attempt = attempts[tag.id] ?? { guess: '', status: 'idle', revealed: false };

            return (
              <div
                key={tag.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                  activeTagId === tag.id ? 'z-20' : 'z-0'
                }`}
                style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setActiveTagId((current) => (current === tag.id ? null : tag.id))}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition ${getPinStyles(
                    attempt.status,
                    attempt.revealed
                  )}`}
                >
                  {index + 1}
                </button>

                {(attempt.revealed || attempt.status === 'correct') && (
                  <div className="pointer-events-none absolute left-1/2 top-12 w-max max-w-[180px] -translate-x-1/2 rounded-2xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs font-medium text-white shadow-xl">
                    {tag.label}
                  </div>
                )}

                {activeTagId === tag.id && (
                  <div className="absolute left-1/2 top-12 z-30 w-64 -translate-x-1/2 rounded-3xl border border-slate-700 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Pin {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => setActiveTagId(null)}
                        className="rounded-full px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
                      >
                        Close
                      </button>
                    </div>
                    <input
                      value={attempt.guess}
                      onChange={(event) => updateGuess(tag.id, event.target.value)}
                      placeholder="Type your answer"
                      className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-base text-slate-100 outline-none transition focus:border-teal md:text-sm"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          submitGuess(tag);
                        }
                      }}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => submitGuess(tag)}
                        className="flex-1 rounded-full bg-teal px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-teal/90"
                      >
                        Check
                      </button>
                      <button
                        type="button"
                        onClick={() => revealOne(tag.id)}
                        className="rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
                      >
                        Reveal
                      </button>
                    </div>
                    {attempt.status === 'correct' ? (
                      <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Correct
                      </p>
                    ) : null}
                    {attempt.status === 'incorrect' ? (
                      <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-rose-300">
                        <XCircle className="h-4 w-4" />
                        Incorrect, try again or reveal it.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="rounded-[2rem] border border-slate-800/90 bg-slate-900/70 p-5 shadow-glow">
        <p className="text-xs uppercase tracking-[0.25em] text-teal">Answer Tracker</p>
        <h3 className="mt-2 font-display text-2xl text-white">Status by pin</h3>

        <div className="mt-5 space-y-3">
          {module.tags.map((tag, index) => {
            const attempt = attempts[tag.id] ?? { status: 'idle', revealed: false };
            const tone = attempt.revealed
              ? 'border-gold/30 bg-gold/10 text-gold'
              : attempt.status === 'correct'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : attempt.status === 'incorrect'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                  : 'border-slate-800 bg-slate-950/75 text-slate-300';

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setActiveTagId(tag.id)}
                className={`flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition hover:border-slate-600 ${tone}`}
              >
                <span className="font-medium">Pin {index + 1}</span>
                <span className="text-xs uppercase tracking-[0.15em]">
                  {attempt.revealed
                    ? 'Revealed'
                    : attempt.status === 'correct'
                      ? 'Correct'
                      : attempt.status === 'incorrect'
                        ? 'Incorrect'
                        : 'Unanswered'}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </section>
  );
}

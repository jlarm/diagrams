import { Edit3, Plus, Trash2, BrainCircuit, Tags } from 'lucide-react';

function EmptyState({ onCreate }) {
  return (
    <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/70 p-10 text-center shadow-glow">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal/15 text-teal">
        <Tags className="h-8 w-8" />
      </div>
      <h2 className="mt-6 font-display text-3xl text-white">Build your first study module</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
        Upload an anatomy diagram, place pins on key structures, and turn the image into a reusable self-quiz.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-3 font-semibold text-slate-950 transition hover:bg-teal/90"
      >
        <Plus className="h-4 w-4" />
        Create New Study Module
      </button>
    </div>
  );
}

function ModuleCard({ module, onEdit, onQuiz, onDelete }) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-slate-800/90 bg-slate-900/75 shadow-glow transition hover:-translate-y-1 hover:border-slate-700">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-slate-800/80 bg-slate-950">
        {module.imageData ? (
          <img
            src={module.imageData}
            alt={module.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">No preview</div>
        )}
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="rounded-full border border-white/10 bg-slate-950/75 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur">
            Study Module
          </span>
          <span className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
            {module.tags.length} tags
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <h3 className="font-display text-xl text-white">{module.title}</h3>
          <p className="mt-2 text-sm text-slate-400">
            Click into edit mode to manage labels or jump straight into quiz mode.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onEdit(module.id)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onQuiz(module.id)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-coral px-3 py-3 text-sm font-medium text-slate-950 transition hover:bg-coral/90"
          >
            <BrainCircuit className="h-4 w-4" />
            Quiz
          </button>
          <button
            type="button"
            onClick={() => onDelete(module.id)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-3 text-sm font-medium text-rose-200 transition hover:border-rose-400/50 hover:bg-rose-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Dashboard({ modules, onCreate, onEdit, onQuiz, onDelete }) {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-5 rounded-[2rem] border border-slate-800/90 bg-slate-900/65 p-6 shadow-glow md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-teal">Diagram Study Lab</p>
          <h1 className="mt-3 font-display text-4xl text-white md:text-5xl">Tag visual diagrams and drill recall fast.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300 md:text-base">
            Use percentage-based markers so each tag stays locked to the right anatomical structure at any screen size.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-teal px-5 py-3 font-semibold text-slate-950 transition hover:bg-teal/90 md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Study Module
        </button>
      </div>

      {modules.length === 0 ? (
        <EmptyState onCreate={onCreate} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onEdit={onEdit}
              onQuiz={onQuiz}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

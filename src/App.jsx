import { useEffect, useMemo, useState } from 'react';
import Dashboard from './components/Dashboard';
import TaggingView from './components/TaggingView';
import QuizView from './components/QuizView';
import { loadModules, saveModules } from './lib/storage';

const VIEWS = {
  DASHBOARD: 'dashboard',
  EDITOR: 'editor',
  QUIZ: 'quiz',
};

export default function App() {
  const [modules, setModules] = useState([]);
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isPersisting, setIsPersisting] = useState(false);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const hydrateModules = async () => {
      try {
        const savedModules = await loadModules();

        if (!isCancelled) {
          setModules(savedModules);
          setStorageError('');
        }
      } catch (error) {
        if (!isCancelled) {
          setStorageError(
            error instanceof Error
              ? error.message
              : 'Could not load your saved study modules from browser storage.'
          );
        }
      } finally {
        if (!isCancelled) {
          setIsHydrating(false);
        }
      }
    };

    hydrateModules();

    return () => {
      isCancelled = true;
    };
  }, []);

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? null,
    [modules, selectedModuleId]
  );

  const openCreate = () => {
    setSelectedModuleId(null);
    setView(VIEWS.EDITOR);
  };

  const openEdit = (moduleId) => {
    setSelectedModuleId(moduleId);
    setView(VIEWS.EDITOR);
  };

  const openQuiz = (moduleId) => {
    setSelectedModuleId(moduleId);
    setView(VIEWS.QUIZ);
  };

  const returnToDashboard = () => {
    setView(VIEWS.DASHBOARD);
  };

  const persistModules = async (nextModules) => {
    setIsPersisting(true);
    setStorageError('');

    try {
      await saveModules(nextModules);
      setModules(nextModules);
      return true;
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : 'Could not save your latest changes to browser storage.'
      );
      return false;
    } finally {
      setIsPersisting(false);
    }
  };

  const handleSaveModule = async (nextModule) => {
    if (isPersisting) {
      return;
    }

    const exists = modules.some((module) => module.id === nextModule.id);
    const nextModules = exists
      ? modules.map((module) => (module.id === nextModule.id ? nextModule : module))
      : [nextModule, ...modules];

    const didPersist = await persistModules(nextModules);
    if (!didPersist) {
      return;
    }

    setSelectedModuleId(nextModule.id);
    setView(VIEWS.DASHBOARD);
  };

  const handleDeleteModule = async (moduleId) => {
    if (isPersisting) {
      return;
    }

    const shouldDelete = window.confirm('Delete this study module?');
    if (!shouldDelete) {
      return;
    }

    const nextModules = modules.filter((module) => module.id !== moduleId);
    const didPersist = await persistModules(nextModules);
    if (!didPersist) {
      return;
    }

    if (selectedModuleId === moduleId) {
      setSelectedModuleId(null);
      setView(VIEWS.DASHBOARD);
    }
  };

  if (isHydrating) {
    return (
      <div className="min-h-screen px-4 py-8 text-slate-100 md:px-8 xl:px-12">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/70 p-10 text-center shadow-glow">
            <p className="text-sm uppercase tracking-[0.25em] text-teal">Diagram Study Lab</p>
            <h1 className="mt-4 font-display text-3xl text-white">Loading saved modules...</h1>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 text-slate-100 md:px-8 xl:px-12">
      <div className="mx-auto max-w-7xl">
        {storageError ? (
          <div className="mb-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 shadow-glow">
            {storageError}
          </div>
        ) : null}

        {view === VIEWS.DASHBOARD ? (
          <Dashboard
            modules={modules}
            onCreate={openCreate}
            onEdit={openEdit}
            onQuiz={openQuiz}
            onDelete={handleDeleteModule}
          />
        ) : null}

        {view === VIEWS.EDITOR ? (
          <TaggingView
            key={selectedModule?.id ?? 'new-module'}
            initialModule={selectedModule}
            onSave={handleSaveModule}
            onCancel={returnToDashboard}
            isSaving={isPersisting}
          />
        ) : null}

        {view === VIEWS.QUIZ && selectedModule ? (
          <QuizView key={selectedModule.id} module={selectedModule} onBack={returnToDashboard} />
        ) : null}
      </div>
    </div>
  );
}

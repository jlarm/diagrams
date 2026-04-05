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
  const [modules, setModules] = useState(() => loadModules());
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  useEffect(() => {
    saveModules(modules);
  }, [modules]);

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

  const handleSaveModule = (nextModule) => {
    setModules((currentModules) => {
      const exists = currentModules.some((module) => module.id === nextModule.id);
      if (exists) {
        return currentModules.map((module) => (module.id === nextModule.id ? nextModule : module));
      }

      return [nextModule, ...currentModules];
    });

    setSelectedModuleId(nextModule.id);
    setView(VIEWS.DASHBOARD);
  };

  const handleDeleteModule = (moduleId) => {
    const shouldDelete = window.confirm('Delete this study module?');
    if (!shouldDelete) {
      return;
    }

    setModules((currentModules) => currentModules.filter((module) => module.id !== moduleId));

    if (selectedModuleId === moduleId) {
      setSelectedModuleId(null);
      setView(VIEWS.DASHBOARD);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 text-slate-100 md:px-8 xl:px-12">
      <div className="mx-auto max-w-7xl">
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
          />
        ) : null}

        {view === VIEWS.QUIZ && selectedModule ? (
          <QuizView key={selectedModule.id} module={selectedModule} onBack={returnToDashboard} />
        ) : null}
      </div>
    </div>
  );
}

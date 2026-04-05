const STORAGE_KEY = 'diagram-study-modules';

export function loadModules() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load study modules', error);
    return [];
  }
}

export function saveModules(modules) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
  } catch (error) {
    console.error('Failed to save study modules', error);
  }
}

export function createId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeLabel(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

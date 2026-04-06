const LEGACY_STORAGE_KEY = 'diagram-study-modules';
const DB_NAME = 'diagram-study-lab';
const DB_VERSION = 1;
const STORE_NAME = 'app-state';
const MODULES_RECORD_KEY = 'modules';

let databasePromise = null;

function hasWindow() {
  return typeof window !== 'undefined';
}

function supportsIndexedDb() {
  return hasWindow() && 'indexedDB' in window;
}

function parseModules(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse saved study modules', error);
    return [];
  }
}

function loadLegacyModules() {
  if (!hasWindow()) {
    return [];
  }

  try {
    return parseModules(window.localStorage.getItem(LEGACY_STORAGE_KEY));
  } catch (error) {
    console.error('Failed to load legacy study modules', error);
    return [];
  }
}

function saveLegacyModules(modules) {
  window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(modules));
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
  });
}

function openDatabase() {
  if (!supportsIndexedDb()) {
    return Promise.reject(new Error('IndexedDB is not available in this browser.'));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };

      request.onerror = () => {
        databasePromise = null;
        reject(request.error ?? new Error('Failed to open IndexedDB.'));
      };

      request.onblocked = () => {
        databasePromise = null;
        reject(new Error('IndexedDB open request was blocked.'));
      };
    });
  }

  return databasePromise;
}

async function loadModulesFromIndexedDb() {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const record = await requestToPromise(store.get(MODULES_RECORD_KEY));

  return Array.isArray(record?.modules) ? record.modules : [];
}

async function saveModulesToIndexedDb(modules) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  store.put({ modules }, MODULES_RECORD_KEY);
  await transactionToPromise(transaction);
}

export async function loadModules() {
  if (!hasWindow()) {
    return [];
  }

  if (!supportsIndexedDb()) {
    return loadLegacyModules();
  }

  try {
    const modules = await loadModulesFromIndexedDb();

    if (modules.length > 0) {
      return modules;
    }

    const legacyModules = loadLegacyModules();

    if (legacyModules.length > 0) {
      await saveModulesToIndexedDb(legacyModules);

      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to remove legacy study modules after migration', error);
      }
    }

    return legacyModules;
  } catch (error) {
    console.error('Failed to load study modules from IndexedDB', error);

    const legacyModules = loadLegacyModules();
    if (legacyModules.length > 0) {
      return legacyModules;
    }

    throw new Error('Could not load your saved study modules from browser storage.');
  }
}

export async function saveModules(modules) {
  if (!hasWindow()) {
    return;
  }

  const nextModules = Array.isArray(modules) ? modules : [];

  if (supportsIndexedDb()) {
    try {
      await saveModulesToIndexedDb(nextModules);

      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear legacy storage after save', error);
      }

      return;
    } catch (error) {
      console.error('Failed to save study modules to IndexedDB', error);
    }
  }

  try {
    saveLegacyModules(nextModules);
  } catch (error) {
    console.error('Failed to save study modules to localStorage', error);
    throw new Error('Could not save this module in browser storage. Your latest changes were not persisted.');
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

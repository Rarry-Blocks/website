export function createThreadSystem() {
  const threads = new Map();
  let current = null;
  let nextId = 1;

  function ensure(threadId) {
    if (!threads.has(threadId)) threads.set(threadId, {});
  }

  return {
    resetAll() {
      threads.clear();
      current = null;
      nextId = 1;
    },

    create(initialVars = {}) {
      const id = `t${nextId++}`;
      threads.set(id, { ...initialVars });
      return id;
    },

    enter(threadId) {
      ensure(threadId);
      current = threadId;
      return this.getCurrentContext();
    },

    exit() {
      current = null;
    },

    set(threadId, key, value) {
      ensure(threadId);
      threads.get(threadId)[key] = value;
    },
    get(threadId, key) {
      return threads.get(threadId) ? threads.get(threadId)[key] : undefined;
    },
    has(threadId, key) {
      return threads.get(threadId)
        ? threads.get(threadId)[key] !== undefined
        : false;
    },

    getCurrentContext() {
      const threadId = current;
      return {
        id: threadId,
        vars: threadId ? threads.get(threadId) : null,
        set: (k, v) => {
          if (!threadId) return;
          threads.get(threadId)[k] = v;
        },
        get: (k) => {
          if (!threadId) return undefined;
          return threads.get(threadId)[k];
        },
        has: (k) => {
          if (!threadId) return false;
          return threads.get(threadId)[k] !== undefined;
        },
        spawn: (fn, initialVars = {}) => {
          const newId = `t${nextId++}`;
          threads.set(newId, { ...initialVars });

          const prev = current;
          current = newId;
          try {
            return fn({
              id: newId,
              get: (k) => threads.get(newId)[k],
              set: (k, v) => (threads.get(newId)[k] = v),
            });
          } finally {
            current = prev;
          }
        },
      };
    },
  };
};

export const Thread = createThreadSystem();
export function createStore(initial) {
  const state = { ...initial };
  const listeners = {};

  return {
    get(key) {
      return state[key];
    },

    set(key, value) {
      if (state[key] === value) return;
      state[key] = value;
      (listeners[key] || []).forEach(fn => fn(value, state));
    },

    on(key, fn) {
      (listeners[key] = listeners[key] || []).push(fn);
      return () => {
        listeners[key] = listeners[key].filter(f => f !== fn);
      };
    }
  };
}

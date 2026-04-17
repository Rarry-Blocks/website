let idCounter = 0;
const pending = new Map();

function requestHost(action, payload) {
  return new Promise((resolve, reject) => {
    const id = ++idCounter;
    pending.set(id, { resolve, reject });
    postMessage({ type: "syscall", id, action, payload });
  });
}

const api = {
  fetch: (url, options) => requestHost("fetch", { url, options }),
  storage: {
    get: key => requestHost("storage.get", { key }),
    set: (key, value) => requestHost("storage.set", { key, value }),
  },
  log: (...args) => requestHost("log", { args }),
};

let userExtension = null;

self.onmessage = async e => {
  const { type, id, action, payload, result, error } = e.data;

  if (type === "init") {
    try {
      const extFn = new Function("api", `"use strict"; return (${payload.code})`);
      userExtension = extFn(api);

      postMessage({
        type: "ready",
        id: payload.extId,
        blocks: userExtension.blocks || [],
      });
    } catch (err) {
      postMessage({ type: "error", error: err.message });
    }
  } else if (type === "response") {
    const p = pending.get(id);
    if (p) {
      error ? p.reject(new Error(error)) : p.resolve(result);
      pending.delete(id);
    }
  } else if (type === "runBlock") {
    try {
      if (!userExtension || !userExtension.run)
        throw new Error("Extension not initialized properly");
      const blockResult = await userExtension.run(action, payload.args);
      postMessage({ type: "blockResult", id, result: blockResult });
    } catch (err) {
      postMessage({ type: "blockResult", id, error: err.message });
    }
  }
};

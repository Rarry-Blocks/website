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
      const ExtClass = new Function("api", `"use strict"; return (${payload.code})`)();
      userExtension = new ExtClass(api);

      const codeGen = userExtension.registerCode ? userExtension.registerCode() : {};

      postMessage({
        type: "ready",
        id: payload.extId,
        extInfo: {
          id: userExtension.id || userExtension.constructor.name,
          category: userExtension.registerCategory ? userExtension.registerCategory() : null,
          blocks: userExtension.registerBlocks ? userExtension.registerBlocks() :[],
          codeGen: Object.keys(codeGen)
        }
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
      if (!userExtension || !userExtension.registerCode) {
        throw new Error("Extension not initialized properly");
      }
      
      const handlers = userExtension.registerCode();
      const handler = handlers[action];
      if (!handler) {
        throw new Error(`Unknown block action: ${action}`);
      }
      
      const blockResult = await handler(payload.args);
      postMessage({ type: "blockResult", id, result: blockResult });
    } catch (err) {
      postMessage({ type: "blockResult", id, error: err.message });
    }
  }
};

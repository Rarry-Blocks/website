let idCounter = 0;
const pending = new Map();
let pendingDescriptor = null;
let cachedHandlers = null;

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

const BlockType = Object.freeze({
  STATEMENT: "statement",
  CAP: "cap",
  OUTPUT: "output",
});

const BlockShape = Object.freeze({
  NUMBER: 1,
  STRING: 2,
  ARGUMENT: 3,
  ARRAY: 4,
  OBJECT: 5,
  SET: 6,
});

const InputType = Object.freeze({
  VALUE: "value",
  STATEMENT: "statement",
  MENU: "menu",
});

self.Rarry = Object.freeze({
  registerExtension(descriptor) {
    if (!descriptor || typeof descriptor !== "object") {
      throw new Error("Rarry.registerExtension expects an extension descriptor object");
    }
    if (!descriptor.id) {
      throw new Error("Extension descriptor must have an id");
    }
    pendingDescriptor = descriptor;
  },
  BlockType,
  BlockShape,
  InputType,
});

self.onmessage = async e => {
  const { type, id, action, payload, result, error } = e.data;

  if (type === "init") {
    try {
      pendingDescriptor = null;
      cachedHandlers = null;
      new Function("api", `"use strict"; ${payload.code}`)();

      if (pendingDescriptor) {
        cachedHandlers = pendingDescriptor.code ?? {};
        const extInfo = {
          id: pendingDescriptor.id,
          category: pendingDescriptor.category ?? null,
          blocks: pendingDescriptor.blocks ?? [],
          codeGen: Object.keys(cachedHandlers),
        };
        postMessage({ type: "ready", id: payload.extId, extInfo });
        pendingDescriptor = null;
      } else {
        const ExtClass = new Function("api", `"use strict"; return (${payload.code})`)();
        const userExtension = new ExtClass(api);

        if (!userExtension || typeof userExtension.registerCode !== "function") {
          throw new Error("Extension must call Rarry.registerExtension() or define a class with registerCode()");
        }

        cachedHandlers = userExtension.registerCode();
        postMessage({
          type: "ready",
          id: payload.extId,
          extInfo: {
            id: userExtension.id || userExtension.constructor.name,
            category: userExtension.registerCategory ? userExtension.registerCategory() : null,
            blocks: userExtension.registerBlocks ? userExtension.registerBlocks() : [],
            codeGen: Object.keys(cachedHandlers),
          },
        });
      }
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
      if (!cachedHandlers) {
        throw new Error("Extension not initialized properly");
      }

      const handler = cachedHandlers[action];
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

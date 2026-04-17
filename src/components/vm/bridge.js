import { requestPermission } from "../extensions/permissions.js";

export class ExtensionBridge {
  constructor(extId, code, onReady) {
    this.extId = extId;
    this.pendingRuns = new Map();
    this.runCounter = 0;

    this.worker = new Worker(new URL("../extensions/worker.js", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = e => this.handleMessage(e, onReady);
    this.worker.postMessage({ type: "init", payload: { extId, code } });
  }

  async handleMessage(e, onReady) {
    const { type, id, action, payload, blocks, result, error } = e.data;

    if (type === "ready") {
      console.log(`Extension ${this.extId} ready.`);
      if (onReady) onReady(blocks);
      return;
    }

    if (type === "blockResult") {
      const p = this.pendingRuns.get(id);
      if (p) {
        error ? p.reject(new Error(error)) : p.resolve(result);
        this.pendingRuns.delete(id);
      }
      return;
    }

    if (type === "syscall") {
      try {
        await requestPermission(this.extId, action, window.showPermissionPopup);

        let apiResult;
        switch (action) {
          case "fetch":
            const res = await fetch(payload.url, payload.options);
            apiResult = await res.text();
            break;
          case "storage.get":
            apiResult = localStorage.getItem(`${this.extId}:${payload.key}`);
            break;
          case "storage.set":
            localStorage.setItem(`${this.extId}:${payload.key}`, payload.value);
            apiResult = true;
            break;
          case "log":
            console.log(`[Ext: ${this.extId}]`, ...payload.args);
            apiResult = true;
            break;
          default:
            throw new Error(`Unknown syscall: ${action}`);
        }

        this.worker.postMessage({ type: "response", id, result: apiResult });
      } catch (err) {
        this.worker.postMessage({ type: "response", id, error: err.message });
      }
    }
  }

  runBlock(opcode, args = {}) {
    return new Promise((resolve, reject) => {
      const runId = ++this.runCounter;
      this.pendingRuns.set(runId, { resolve, reject });
      this.worker.postMessage({
        type: "runBlock",
        id: runId,
        action: opcode,
        payload: { args },
      });
    });
  }

  terminate() {
    this.worker.terminate();
  }
}

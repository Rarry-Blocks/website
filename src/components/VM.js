export class Thread {
  constructor(target, generatorFunc) {
    this.target = target;
    this.status = "running";
    this.variables = new Map();
    this.generator = generatorFunc(this);
  }

  getVar(name) {
    return this.variables.get(name);
  }

  setVar(name, value) {
    this.variables.set(name, value);
    return this;
  }

  hasVar(name) {
    return this.variables.has(name);
  }

  deleteVar(name) {
    this.variables.delete(name);
    return this;
  }

  clearVars() {
    this.variables.clear();
    return this;
  }

  stop() {
    this.status = "stopped";
  }

  isRunning() {
    return this.status === "running";
  }

  isStopped() {
    return this.status === "stopped";
  }
}

export let currentThread = null;

export class VM {
  constructor() {
    this.threads = [];
    this.stepStart = 0;
  }

  execute(generatorFunc, target) {
    const thread = new Thread(target, generatorFunc);
    this.threads.push(thread);
    return thread;
  }

  step() {
    if (this.isOverBudget()) this.stepStart = performance.now();

    for (let i = this.threads.length - 1; i >= 0; i--) {
      const thread = this.threads[i];

      if (!thread || thread.status === "stopped") {
        this.threads.splice(i, 1);
        continue;
      }

      currentThread = thread;

      try {
        const result = thread.generator.next();
        if (result.done) {
          this.threads.splice(i, 1);
        }
      } catch (e) {
        console.error("Thread Error:", e);
        this.threads.splice(i, 1);
      } finally {
        currentThread = null;
      }
    }
  }

  isOverBudget() {
    return performance.now() - this.stepStart > 8;
  }

  stopAll() {
    this.threads = [];
    currentThread = null;
  }

  stopForTarget(target) {
    for (const thread of this.threads) {
      if (thread.target === target) thread.stop();
    }
  }

  stopOtherScriptsForTarget(target) {
    for (const thread of this.threads) {
      if (thread.target === target && thread !== currentThread) thread.stop();
    }
  }

  stopAllExceptTarget(target) {
    for (const thread of this.threads) {
      if (thread.target !== target) thread.stop();
    }
  }
}
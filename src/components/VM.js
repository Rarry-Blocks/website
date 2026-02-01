export class VM {
  constructor() {
    this.threads = [];
    this.currentThread = null;
  }

  execute(generatorFunc, target) {
    const thread = {
      target: target,
      generator: generatorFunc(target),
      status: 'running'
    };
    this.threads.push(thread);
    return thread;
  }

  step() {
    for (let i = this.threads.length - 1; i >= 0; i--) {
      const thread = this.threads[i];
      if (!thread || thread.status === 'stopped') {
        this.threads.splice(i, 1);
        continue;
      }

      this.currentThread = thread;

      try {
        const result = thread.generator.next();
        if (result.done) {
          this.threads.splice(i, 1);
        }
      } catch (e) {
        console.error("Thread Error:", e);
        this.threads.splice(i, 1);
      } finally {
        this.currentThread = null;
      }
    }
  }

  stopAll() {
    this.threads = [];
    this.currentThread = null;
  }

  stopForTarget(target) {
    for (const thread of this.threads) {
      if (thread.target === target) {
        thread.status = 'stopped';
      }
    }
  }
}
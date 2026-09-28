import { vm } from "../../scripts/editor";
import { coreGlobals, createCore } from "./core";

const installerModules = import.meta.glob("./installers/*.js", { eager: true });

export function createRuntime(ctx) {
  const globals = coreGlobals();
  const core = createCore(ctx);
  const env = { ...ctx, ...globals, ...core };

  const runtime = {
    ...globals,
    ...core,
    myFunctions: {},
    yield: false,
    get thread() {
      return vm.currentThread;
    },
    get fastExecution() {
      return !!vm.currentThread?.fastExecution;
    }
  };

  for (const path of Object.keys(installerModules).sort()) {
    const { install } = installerModules[path];
    if (typeof install !== "function") {
      throw new Error(`Runtime installer ${path} must export an install() function`);
    }

    const added = Object.getOwnPropertyDescriptors(install(env));
    for (const name of Object.keys(added)) {
      if (Object.hasOwn(runtime, name)) {
        console.warn(`Runtime installer ${path} replaces existing "${name}"`);
      }
      Object.defineProperty(runtime, name, added[name]);
    }
  }

  return Object.seal(runtime);
}

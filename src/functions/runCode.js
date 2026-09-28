import { eventRegistry, vm } from "../scripts/editor";
import { createRuntime } from "./runtime";

const FACTORY_CACHE_LIMIT = 64;
const factoryCache = new Map();

function compile(code) {
  const cached = factoryCache.get(code);
  if (cached) return cached;

  const factory = new Function("runtime", `"use strict";\n${code}`);

  if (factoryCache.size >= FACTORY_CACHE_LIMIT) factoryCache.clear();
  factoryCache.set(code, factory);

  return factory;
}

export function triggerCloneEvents(clone) {
  const rootId = clone.root ? clone.root.id : clone.id;

  const entries = eventRegistry.clone.filter(entry => {
    return entry.spriteId === rootId;
  });

  entries.forEach(entry => {
    vm.execute(entry.generatorFunc, clone);
  });
}

export function runCodeWithFunctions({
  code,
  projectStartedTime,
  spriteData,
  signal,
  clickRunMode = false,
  onClickResult = null,
}) {
  const runtime = createRuntime({
    spriteData,
    signal,
    projectStartedTime,
    clickRunMode,
    onClickResult,
  });

  if (import.meta.env.DEV) {
    console.info("Running code:\n", code.trim());
  }

  try {
    compile(code)(runtime);
  } catch (err) {
    console.error("Error compiling sprite code:", err);
    runtime.setClickResult(err, true);
  }
}

import { eventRegistry, spriteManager, vm } from "../../../scripts/editor";

export function install({
  spriteData,
  stopped,
  getTargetData,
  clickRunMode
}) {
  function registerEvent(type, key, generatorFunc) {
    if (stopped()) return;

    if (clickRunMode) {
      vm.execute(generatorFunc, getTargetData());
      return;
    }

    const entry = {
      type,
      spriteId: spriteData.id,
      generatorFunc,
      trigger: () => {
        const rootSprite = spriteManager.get(spriteData.id);
        if (!rootSprite) return;

        vm.execute(generatorFunc, rootSprite);

        if (rootSprite.clones) {
          rootSprite.clones.forEach((clone) => {
            vm.execute(generatorFunc, clone);
          });
        }
      }
    };

    switch (type) {
      case "flag":
        eventRegistry.flag.push(entry);
        break;
      case "key":
        if (!eventRegistry.key.has(key)) eventRegistry.key.set(key, []);
        eventRegistry.key.get(key).push(entry);
        break;
      case "stageClick":
        eventRegistry.stageClick.push(entry);
        break;
      case "timer":
        eventRegistry.timer.push({ ...entry, value: key });
        break;
      case "interval":
        eventRegistry.interval.push({ ...entry, seconds: key });
        break;
      case "custom":
        if (!eventRegistry.custom.has(key)) eventRegistry.custom.set(key, []);
        eventRegistry.custom.get(key).push(entry);
        break;
      case "clone":
        eventRegistry.clone.push(entry);
        break;
    }
  }

  function triggerCustomEvent(eventName) {
    const entries = eventRegistry.custom.get(eventName);
    if (!entries) return;
    for (const entry of entries) {
      entry.trigger();
    }
  }

  return { registerEvent, triggerCustomEvent };
}

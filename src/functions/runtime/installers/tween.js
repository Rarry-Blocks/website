import { tweenEasing } from "../../../lib/utils";
import { vm } from "../../../scripts/editor";

export function install({ stopped, getTargetData }) {
  function* startTween({ from, to, duration, easing, onUpdate, wait = true }) {
    if (stopped()) return;

    const easeFn = tweenEasing[easing] || tweenEasing.linear;
    const change = to - from;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    function* tweenRoutine() {
      while (true) {
        if (stopped()) return;

        const now = performance.now();
        const elapsed = now - startTime;
        const t = Math.min(elapsed / durationMs, 1);

        const value = from + change * easeFn(t);

        if (onUpdate) onUpdate(value);

        if (t >= 1) break;
        yield;
      }
    }

    if (wait) {
      yield* tweenRoutine();
    } else {
      vm.execute(tweenRoutine, getTargetData());
    }
  }

  return { startTween };
}

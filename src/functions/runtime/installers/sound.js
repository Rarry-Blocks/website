import { playingSounds } from "../../../scripts/editor";

export function install({ getTargetData, stopped }) {
  const soundState = { volume: 100, speed: 100 };

  function setSoundProperty(property, value) {
    if (!(property in soundState)) return;
    if (property === "speed") value = Math.min(1600, Math.max(7, value));
    if (property === "volume") value = Math.min(100, Math.max(0, value));
    soundState[property] = value;
  }

  function findSound(targetData, value) {
    return (
      targetData.sounds.find((i) => i.id === value) ||
      targetData.sounds.find((i) => i.name === value)
    );
  }

  function* playSound(value, wait = false) {
    const targetData = getTargetData();
    const found = findSound(targetData, value);
    if (!found) return;

    if (!playingSounds.has(targetData.id))
      playingSounds.set(targetData.id, new Map());

    const spriteSounds = playingSounds.get(targetData.id);
    const oldAudio = spriteSounds.get(found.id);
    if (oldAudio) {
      oldAudio.pause();
      oldAudio.currentTime = 0;
    }

    const audio = new Audio(found.dataURL);
    spriteSounds.set(found.id, audio);

    audio.volume = soundState.volume / 100;
    audio.playbackRate = soundState.speed / 100;

    let finished = false;
    const onEnd = () => {
      if (spriteSounds.get(value) === audio) {
        spriteSounds.delete(value);
      }
      finished = true;
    };

    audio.addEventListener("ended", onEnd);
    audio.addEventListener("pause", onEnd);
    audio.addEventListener("error", onEnd);

    audio.play().catch((e) => {
      console.warn("Audio play failed", e);
      onEnd();
    });

    if (wait) {
      while (!finished) {
        if (stopped()) {
          audio.pause();
          onEnd();
          return;
        }
        yield;
      }
    }
  }

  function stopSound(value) {
    const targetData = getTargetData();
    const spriteSounds = playingSounds.get(targetData.id);
    if (!spriteSounds) return;

    const found = findSound(targetData, value);
    if (!found) return;

    const audio = spriteSounds.get(found.id);
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    spriteSounds.delete(found.id);
  }

  function stopAllSounds(thisSprite = false) {
    if (thisSprite) {
      const targetData = getTargetData();
      const spriteSounds = playingSounds.get(targetData.id);
      if (!spriteSounds) return;

      for (const audio of spriteSounds.values()) {
        audio.pause();
        audio.currentTime = 0;
      }
      playingSounds.delete(targetData.id);
    } else {
      for (const spriteSounds of playingSounds.values()) {
        for (const audio of spriteSounds.values()) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
      playingSounds.clear();
    }
  }

  function getSoundProperty(property) {
    return soundState[property];
  }

  return {
    playSound,
    stopSound,
    stopAllSounds,
    setSoundProperty,
    getSoundProperty
  };
}

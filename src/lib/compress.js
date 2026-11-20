async function encodeOggFast(dataURL) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const base64 = dataURL.split(",")[1];
  const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const buffer = await audioCtx.decodeAudioData(raw.buffer);

  const targetRate = 22050;

  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(buffer.duration * targetRate),
    targetRate
  );

  const src = offlineCtx.createBufferSource();

  if (buffer.numberOfChannels === 1) {
    src.buffer = buffer;
  } else {
    const mono = offlineCtx.createBuffer(1, buffer.length, buffer.sampleRate);

    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.getChannelData(1);
    const out = mono.getChannelData(0);

    for (let i = 0; i < out.length; i++) {
      out[i] = (ch0[i] + ch1[i]) * 0.5;
    }

    src.buffer = mono;
  }

  src.connect(offlineCtx.destination);
  src.start();

  const rendered = await offlineCtx.startRendering();

  const liveCtx = new AudioContext();
  const liveSrc = liveCtx.createBufferSource();
  liveSrc.buffer = rendered;

  const dest = liveCtx.createMediaStreamDestination();
  liveSrc.connect(dest);

  const recorder = new MediaRecorder(dest.stream, {
    mimeType: "audio/ogg"
  });

  const chunks = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/ogg" });
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result);
      fr.readAsDataURL(blob);
    };

    recorder.start();
    liveSrc.start();
    liveSrc.onended = () => recorder.stop();
  });
}

export async function compressAudio(dataURL) {
  try {
    return await encodeOggFast(dataURL);
  } catch (e) {
    console.warn("OGG recording failed, falling back:", e);
  }
  return dataURL;
}

export async function compressImage(dataURL) {
  if (!dataURL || typeof dataURL !== "string") return null;
  if (dataURL.startsWith("data:image/webp")) return dataURL;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/webp", 0.9));
    };
    img.src = dataURL;
  });
}

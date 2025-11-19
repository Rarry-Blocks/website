let currentPopup;

export function showNotification({
  message = "",
  duration = 5000,
  closable = true,
}) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `
    ${message}
    ${
      closable
        ? '<button class="notification-close"><i class="fa-solid fa-xmark"></i></button>'
        : ""
    }
  `;

  let container = document.querySelector(".notification-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  container.appendChild(notification);

  function hide() {
    notification.classList.add("hide");
    setTimeout(() => notification.remove(), 300);
  }

  if (closable) {
    notification
      .querySelector(".notification-close")
      ?.addEventListener("click", hide);
  }

  setTimeout(hide, duration);

  return notification;
}

export function showPopup({ innerHTML = "", title = "", rows = [] }) {
  const popup = document.createElement("div");
  popup.className = "popup";

  if (currentPopup) currentPopup.remove();
  currentPopup = popup;

  const rowsHTML = rows
    .map((row, rowIndex) => {
      const rowHTML = row
        .map((item, colIndex) => {
          if (typeof item === "string") {
            if (item === "") return;
            return `<span class="popup-label">${item}</span>`;
          }

          switch (item.type) {
            case "custom":
              return item.html || "";
            case "button":
              return `<button
                class="${item.className || ""}"
                data-row="${rowIndex}" data-col="${colIndex}"
                ${item.disabled ? "disabled" : ""}
              >${item.label}</button>`;
            case "input":
              return `<input
                type="${item.inputType || "text"}" 
                placeholder="${item.placeholder || ""}"
                value="${item.value || ""}" 
                class="${item.className || ""}"
                data-row="${rowIndex}" data-col="${colIndex}"
              />`;
            case "checkbox":
              return `<input
                type="checkbox"
                class="${item.className || ""}"
                data-row="${rowIndex}" data-col="${colIndex}"
                ${item.checked ? "checked" : ""}
              />`;
            case "textarea":
              return `<textarea
                placeholder="${item.placeholder || ""}"
                rows="${item.rows || 3}"
                cols="${item.cols || 30}"
                class="${item.className || ""}"
                data-row="${rowIndex}" data-col="${colIndex}"
              >${item.value || ""}</textarea>`;
            case "label":
              return `<span class="popup-label">${item.text}</span>`;
            case "menu":
              return `<select
                class="${item.className || ""}"
                data-row="${rowIndex}" data-col="${colIndex}"
              >
                ${item.options
                  .map(
                    (opt) =>
                      `<option value="${opt.value}" ${
                        opt.value === item.value ? "selected" : ""
                      }>${opt.label}</option>`
                  )
                  .join("")}
              </select>`;
            default:
              return "";
          }
        })
        .join("");
      return `<div class="popup-row">${rowHTML}</div>`;
    })
    .join("");

  popup.innerHTML = `
    <div class="popup-content">
      <header>
        <h2>${title}</h2>
        <button class="popup-close danger"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <div class="popup-body">
        ${rowsHTML}
        ${innerHTML}
      </div>
    </div>`;

  document.body.appendChild(popup);

  popup.querySelector(".popup-close").addEventListener("click", () => {
    currentPopup = null;
    popup.remove();
  });

  rows.forEach((row, rowIndex) => {
    row.forEach((item, colIndex) => {
      const el = popup.querySelector(
        `[data-row="${rowIndex}"][data-col="${colIndex}"]`
      );
      if (!el) return;

      if (item.type === "button" && item.onClick) {
        el.addEventListener("click", () => item.onClick(popup));
      }
      if (item.type === "input" && item.onInput) {
        el.addEventListener("input", (e) =>
          item.onInput(e.target.value, popup)
        );
      }
      if (item.type === "checkbox" && item.onChange) {
        el.addEventListener("change", (e) =>
          item.onChange(e.target.checked, popup)
        );
      }
      if (item.type === "textarea" && item.onInput) {
        el.addEventListener("input", (e) =>
          item.onInput(e.target.value, popup)
        );
      }
      if (item.type === "menu" && item.onChange) {
        el.addEventListener("change", (e) =>
          item.onChange(e.target.value, popup)
        );
      }
    });
  });

  return popup;
}

export function promiseWithAbort(promiseOrFn, signal) {
  try {
    const p = typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;
    if (!(p instanceof Promise)) return Promise.resolve(p);

    if (signal.aborted) return Promise.reject(new Error("shouldStop"));

    return Promise.race([
      p,
      new Promise((_, rej) => {
        signal.addEventListener("abort", () => rej(new Error("shouldStop")), {
          once: true,
        });
      }),
    ]);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function encodeOggWithMediaRecorder(dataURL) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const base64 = dataURL.split(",")[1];
  const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const buffer = await audioCtx.decodeAudioData(raw.buffer);

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  const dest = audioCtx.createMediaStreamDestination();
  src.connect(dest);

  const recorder = new MediaRecorder(dest.stream, {
    mimeType: "audio/ogg",
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
    src.start();
    src.onended = () => recorder.stop();
  });
}

export async function compressAudio(dataURL) {
  if (window.MediaRecorder && MediaRecorder.isTypeSupported("audio/ogg")) {
    try {
      return await encodeOggWithMediaRecorder(dataURL);
    } catch (e) {
      console.warn("OGG recording failed, falling back:", e);
    }
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

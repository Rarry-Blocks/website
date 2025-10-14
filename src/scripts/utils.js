export function showPopup({ innerHTML = "", title = "", rows = [] }) {
  const popup = document.createElement("div");
  popup.className = "popup";

  const rowsHTML = rows
    .map((row, rowIndex) => {
      const rowHTML = row
        .map((item, colIndex) => {
          if (typeof item === "string") {
            return `<span class="popup-label">${item}</span>`;
          }

          switch (item.type) {
            case "button":
              return `<button class="${
                item.className || ""
              }" data-row="${rowIndex}" data-col="${colIndex}">
                ${item.label}
              </button>`;
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
        <button class="popup-close danger">×</button>
      </header>
      <div class="popup-body">
        ${rowsHTML}
        ${innerHTML}
      </div>
    </div>`;

  document.body.appendChild(popup);

  popup.querySelector(".popup-close").addEventListener("click", () => {
    popup.remove();
  });

  rows.forEach((row, rowIndex) => {
    row.forEach((item, colIndex) => {
      if (item.type === "button" && item.onClick) {
        popup
          .querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`)
          .addEventListener("click", () => item.onClick(popup));
      }
      if (item.type === "input" && item.onInput) {
        popup
          .querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`)
          .addEventListener("input", (e) =>
            item.onInput(e.target.value, popup)
          );
      }
      if (item.type === "checkbox" && item.onChange) {
        popup
          .querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`)
          .addEventListener("change", (e) =>
            item.onChange(e.target.checked, popup)
          );
      }
      if (item.type === "textarea" && item.onInput) {
        popup
          .querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`)
          .addEventListener("input", (e) =>
            item.onInput(e.target.value, popup)
          );
      }
    });
  });

  return popup;
}

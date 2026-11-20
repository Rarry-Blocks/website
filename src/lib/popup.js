export function showNotification({
  message = "",
  duration = 5000,
  closable = true
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

export class Popup {
  static current = null;

  constructor(options = {}) {
    this.options = {
      title: "",
      innerHTML: "",
      rows: [],
      tabs: null,
      noAnimation: false,
      onClose: null,
      beforeRender: null,
      ...options
    };
    this.element = null;
    this.currentTabIndex = 0;
  }

  show() {
    if (Popup.current && Popup.current !== this) {
      Popup.current.hide();
    }
    Popup.current = "";

    if (!this.element) {
      this.element = document.createElement("div");
      this.element.className = "popup";
      if (this.options.noAnimation) this.element.classList.add("no-animation");
      if (!this.options.tabs)
        this.element.classList.add("no-tabs");

      this.element.innerHTML = `
        <div class="popup-content">
          <header>
            <h2 class="popup-title"></h2>
            <button class="popup-close danger">
              <i class="fa-solid fa-xmark stay"></i>
            </button>
          </header>
          <div class="popup-body"></div>
        </div>
      `;

      this.element
        .querySelector(".popup-close")
        .addEventListener("click", () => this.hide());
      document.body.appendChild(this.element);
    }

    this.render();
  }

  hide() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    if (Popup.current === this) Popup.current = null;
    if (typeof this.options.onClose === "function") this.options.onClose();
  }

  refresh(newOptions = {}) {
    this.options = { ...this.options, ...newOptions };
    if (this.element) this.render();
  }

  _resolve(val) {
    return typeof val === "function" ? val(this) : val;
  }

  render() {
    if (typeof this.options.beforeRender === "function") {
      this.options.beforeRender(this);
    }

    const title = this._resolve(this.options.title);
    let tabs = this._resolve(this.options.tabs);
    const rows = this._resolve(this.options.rows);
    const innerHTML = this._resolve(this.options.innerHTML);

    const titleEl = this.element.querySelector(".popup-title");
    if (titleEl) titleEl.textContent = title;

    const bodyEl = this.element.querySelector(".popup-body");
    let bodyHTML;

    if (Array.isArray(tabs) && tabs.length > 0) {
      tabs = tabs.filter((t) => t);
      if (this.currentTabIndex >= tabs.length) this.currentTabIndex = 0;

      const tabButtons = tabs
        .map(
          (tab, i) =>
            `<button class="popup-tab-button ${i === this.currentTabIndex ? "active" : ""}" data-tab-btn="${i}">${tab.label}</button>`
        )
        .join("");

      const tabContents = tabs
        .map(
          (tab, i) => `
          <div class="popup-tab-content ${i === this.currentTabIndex ? "active" : ""}" data-tab-content="${i}">
            ${this._generateRowsHTML(tab.rows || [], i)}
            ${tab.innerHTML || ""}
          </div>
        `
        )
        .join("");

      bodyHTML = `
        <div class="popup-tabs">
          <div class="popup-tab-buttons">${tabButtons}</div>
          ${tabContents}
        </div>
      `;
    } else {
      bodyHTML = `${this._generateRowsHTML(rows || [])}${innerHTML || ""}`;
    }

    const scrollSelectors = [".popup-tab-content.active", ".popup-tab-buttons"];
    const bodyScroll = bodyEl.scrollTop;
    const tabScrolls = scrollSelectors.map(
      (selector) => bodyEl.querySelector(selector)?.scrollTop ?? 0
    );

    bodyEl.innerHTML = bodyHTML;
    bodyEl.scrollTop = bodyScroll;
    scrollSelectors.forEach((selector, i) => {
      const el = bodyEl.querySelector(selector);
      if (el) el.scrollTop = tabScrolls[i];
    });

    if (Array.isArray(tabs) && tabs.length > 0) {
      const buttons = bodyEl.querySelectorAll("[data-tab-btn]");
      const contents = bodyEl.querySelectorAll("[data-tab-content]");

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          this.currentTabIndex = parseInt(btn.getAttribute("data-tab-btn"), 10);
          buttons.forEach((b) => b.classList.remove("active"));
          contents.forEach((c) => c.classList.remove("active"));
          btn.classList.add("active");
          bodyEl
            .querySelector(`[data-tab-content="${this.currentTabIndex}"]`)
            .classList.add("active");
        });
      });

      tabs.forEach((tab, tabIndex) =>
        this._attachRowListeners(tab.rows || [], tabIndex)
      );
    } else {
      this._attachRowListeners(rows || []);
    }
  }

  _generateRowsHTML(rowsArr, tabIndex = null) {
    return rowsArr
      .map((row, rowIndex) => {
        const rowHTML = row
          .map((item, colIndex) => {
            if (typeof item === "string") {
              return item === ""
                ? ""
                : `<span class="popup-label">${item}</span>`;
            }

            const dataAttr = tabIndex !== null ? `data-tab="${tabIndex}"` : "";
            let inputMin = item.min !== undefined ? `min="${item.min}"` : "";
            let inputMax = item.max !== undefined ? `max="${item.max}"` : "";
            let inputStep =
              item.step !== undefined ? `step="${item.step}"` : "";

            switch (item.type) {
              case "custom":
                return item.html || "";
              case "button":
                return `<button class="${item.className || ""}" data-row="${rowIndex}" data-col="${colIndex}" ${dataAttr} ${item.disabled ? "disabled" : ""}>${item.label}</button>`;
              case "input":
                return `<input type="${item.inputType || "text"}" placeholder="${item.placeholder || ""}" value="${item.value || ""}" class="${item.className || ""}" data-row="${rowIndex}" data-col="${colIndex}" ${dataAttr} ${inputMin} ${inputMax} />`;
              case "checkbox":
                return `<input type="checkbox" class="${item.className || ""}" data-row="${rowIndex}" data-col="${colIndex}" ${dataAttr} ${item.checked ? "checked" : ""} />`;
              case "textarea":
                return `<textarea placeholder="${item.placeholder || ""}" rows="${item.rows || 3}" cols="${item.cols || 30}" class="${item.className || ""}" data-row="${rowIndex}" data-col="${colIndex}" ${dataAttr}>${item.value || ""}</textarea>`;
              case "label":
                return `<span class="popup-label">${item.text}</span>`;
              case "menu":
                return `<select class="${item.className || ""}" data-row="${rowIndex}" data-col="${colIndex}" ${dataAttr}>
                  ${item.options.map((opt) => `<option value="${opt.value}" ${opt.value === item.value ? "selected" : ""}>${opt.label}</option>`).join("")}
                </select>`;
              case "color":
                return `<input type="color" value="${item.value || "#ffffff"}" class="${item.className || ""}" data-row="${rowIndex}" data-col="${colIndex}" ${dataAttr} />`;
              case "number":
                return `<input type="number" placeholder="${item.placeholder || ""}" value="${item.value !== undefined ? item.value : ""}" class="${item.className || ""}" data-row="${rowIndex}" data-col="${colIndex}" ${dataAttr} ${inputMin} ${inputMax} ${inputStep} />`;
              default:
                return "";
            }
          })
          .join("");
        return `<div class="popup-row">${rowHTML}</div>`;
      })
      .join("");
  }

  _attachRowListeners(rowsArr, tabIndex = null) {
    rowsArr.forEach((row, rowIndex) => {
      row.forEach((item, colIndex) => {
        const selectorParts = [
          `[data-row="${rowIndex}"]`,
          `[data-col="${colIndex}"]`
        ];
        if (tabIndex !== null) selectorParts.push(`[data-tab="${tabIndex}"]`);

        const el = this.element.querySelector(selectorParts.join(""));
        if (!el) return;

        if (item.type === "button" && item.onClick) {
          el.addEventListener("click", () => item.onClick(this));
        }
        if (item.type === "input" && item.onInput) {
          el.addEventListener("input", (e) =>
            item.onInput(e.target.value, this)
          );
        }
        if (item.type === "checkbox" && item.onChange) {
          el.addEventListener("change", (e) =>
            item.onChange(e.target.checked, this)
          );
        }
        if (item.type === "textarea" && item.onInput) {
          el.addEventListener("input", (e) =>
            item.onInput(e.target.value, this)
          );
        }
        if (item.type === "menu" && item.onChange) {
          el.addEventListener("change", (e) =>
            item.onChange(e.target.value, this)
          );
        }
        if (item.type === "number") {
          function clamp(val) {
            if (val === "") return item.value !== undefined ? item.value : 0;
            let n = Number(val);
            if (isNaN(n)) return item.value !== undefined ? item.value : 0;
            if (item.min !== undefined && n < item.min) n = item.min;
            if (item.max !== undefined && n > item.max) n = item.max;
            return n;
          }

          if (item.onChange) {
            el.addEventListener("change", (e) => {
              const clamped = clamp(e.target.value);
              e.target.value = clamped;
              item.onChange(clamped, this);
            });
          }
          if (item.onInput) {
            el.addEventListener("input", (e) => {
              item.onInput(Number(e.target.value), this);
            });
          }
        }
        if (item.type === "color" && item.onChange) {
          el.addEventListener("input", (e) =>
            item.onChange(e.target.value, this)
          );
        }
      });
    });
  }
}

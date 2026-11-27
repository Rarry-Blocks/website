import { Popup } from "../lib/popup";
import { escapeHtml } from "../lib/utils";

const UNSANDBOXED_WARNING =
  "⚠ Unsandboxed code runs directly on this page, with the same access as Rarry itself. It can read and change anything Rarry can, including data saved in this browser. Accept only code you wrote or fully trust.";

/** @returns {boolean} */
export function requestExtensionApproval({ source, code }) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    const popup = new Popup({
      title: "Allow this extension to run?",
      onClose: () => finish(false),
      rows: [
        [
          "This code runs on your device with access to Rarry. Accept only code you trust."
        ],
        [
          {
            type: "custom",
            html: `<p><b>Source:</b> ${escapeHtml(source)}</p>`
          }
        ],
        [
          {
            type: "custom",
            html: `
              <pre class="extension-code">${escapeHtml(code)}</pre>
            `
          }
        ],
        [
          {
            type: "button",
            label: "Deny",
            className: "danger",
            onClick: (p) => {
              finish(false);
              p.hide();
            }
          },
          {
            type: "button",
            label: "Accept",
            className: "primary",
            onClick: (p) => {
              finish(true);
              p.hide();
            }
          }
        ]
      ]
    });
    popup.show();
  });
}

/** @returns {string} deny | sandboxed | unsandboxed */
export function requestUnsandboxedExtensionDecision({ source, code }) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (choice) => {
      if (settled) return;
      settled = true;
      resolve(choice);
    };

    const popup = new Popup({
      title: "Allow this extension to run unsandboxed?",
      onClose: () => finish("deny"),
      rows: [
        [UNSANDBOXED_WARNING],
        [
          {
            type: "custom",
            html: `<p><b>Source:</b> ${escapeHtml(source)}</p>`
          }
        ],
        [
          {
            type: "custom",
            html: `
              <pre class="extension-code">${escapeHtml(code)}</pre>
            `
          }
        ],
        [
          {
            type: "button",
            label: "Deny",
            onClick: (p) => {
              finish("deny");
              p.hide();
            }
          },
          {
            type: "button",
            label: "Run sandboxed",
            className: "primary",
            onClick: (p) => {
              finish("sandboxed");
              p.hide();
            }
          },
          {
            type: "button",
            label: "Run unsandboxed",
            className: "danger",
            onClick: (p) => {
              finish("unsandboxed");
              p.hide();
            }
          }
        ]
      ]
    });
    popup.show();
  });
}

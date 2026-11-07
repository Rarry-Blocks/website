import { escapeHtml, Popup } from "./utils.js";

/** Resolves true if the user accepts, false on deny or close. */
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
        ["This code runs on your device with access to Rarry. Accept only code you trust."],
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
              <pre class="extension-code" style="max-height:30vh;overflow:auto;white-space:pre-wrap;text-align:left">${escapeHtml(code)}</pre>
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

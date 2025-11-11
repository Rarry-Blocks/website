import config from "../config";
import { cache } from "../cache";
import { showPopup } from "../functions/utils";
import { setupThemeButton, setupUserTag } from "../functions/theme";

const allowedFileFormats = ["jpeg", "png", "webp", "avif", "gif", "tiff"];
const profileDiv = document.getElementById("userProfile");

const urlParams = new URLSearchParams(window.location.search);
const identifier = urlParams.get("id") || urlParams.get("username");

setupThemeButton();
setupUserTag();

if (profileDiv && identifier) {
  fetch(`${config.apiUrl}/users/${identifier}`, {
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => {
      profileDiv.innerHTML = `
        <img src="${config.apiUrl}/users/${response.id}/avatar" id="profileAvatar" />
        ${response.username}
      `;

      if (cache.user && cache.user.id === response.id) {
        const avatarEl = document.getElementById("profileAvatar");
        avatarEl.style.cursor = "pointer";
        avatarEl.addEventListener("click", async () => {
          showPopup({
            title: "Avatar",
            rows: [
              [
                {
                  type: "button",
                  label: "Upload avatar",
                  className: "primary",
                  onClick: async (popup) => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = allowedFileFormats
                      .map((f) => `image/${f}`)
                      .join(",");
                    input.style.display = "none";
                    input.click();

                    input.onchange = async () => {
                      const file = input.files[0];
                      if (!file) return;

                      const format = file.type.split("/")[1];
                      if (!allowedFileFormats.includes(format)) {
                        alert(`Unsupported format: ${format}`);
                        return;
                      }

                      const formData = new FormData();
                      formData.append("avatar", file);

                      try {
                        const res = await fetch(
                          `${config.apiUrl}/users/me/avatar`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: localStorage.getItem("tooken"),
                            },
                            body: formData,
                          }
                        );

                        const data = await res.json();
                        if (!res.ok)
                          throw new Error(data.error || "Upload failed");

                        window.location.reload();
                      } catch (err) {
                        console.error(err);
                        alert("Error uploading: " + err.message);
                      } finally {
                        popup.remove();
                        input.remove();
                      }
                    };
                  },
                },
                {
                  type: "button",
                  label: "Remove avatar",
                  className: "danger",
                  onClick: async (popup) => {
                    if (!confirm("Remove your avatar?")) return;
                    try {
                      const res = await fetch(
                        `${config.apiUrl}/users/me/avatar`,
                        {
                          method: "DELETE",
                          headers: {
                            Authorization: localStorage.getItem("tooken"),
                          },
                        }
                      );
                      const data = await res.json();
                      if (!res.ok)
                        throw new Error(
                          data.error || "Failed to remove avatar"
                        );

                      avatarEl.src = "default-avatar.png";
                      popup.remove();
                    } catch (err) {
                      console.error(err);
                      alert("Error deleting: " + err.message);
                    }
                  },
                },
              ],
            ],
          });
        });
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Login error: " + err.message);
    });
}

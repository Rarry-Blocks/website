import config from "../config";
import { cache } from "../cache";
import { setupThemeButton, setupUserTag } from "../functions/theme";
import { attachAvatarChanger } from "../functions/avatar";

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
        <img id="profileAvatar" src="${config.apiUrl}/users/${response.id}/avatar" />
        ${response.username}
      `;
    })
    .catch((err) => {
      console.error(err);
      alert("Login error: " + err.message);
    });
}

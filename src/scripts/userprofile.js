import config from "../config";
import { setupThemeButton, setupUserTag } from "../functions/theme";

const urlParams = new URLSearchParams(window.location.search);
const identifier = urlParams.get("id") || urlParams.get("username");

setupThemeButton();
setupUserTag();

const profileDiv = document.getElementById("userProfile");
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

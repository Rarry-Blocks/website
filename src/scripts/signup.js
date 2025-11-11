import "@fortawesome/fontawesome-free/css/all.min.css";
import { toggleIcons, toggleTheme } from "../functions/theme";
import config from "../config";

toggleTheme();
toggleIcons();

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login");

async function onSignupClick(e) {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  loginButton.disabled = true;
  loginButton.dataset.origHtml = loginButton.innerHTML;
  loginButton.innerHTML = `...`;

  try {
    const response = await fetch(`${config.apiUrl}/users/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      let errText = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const errJson = await response.json();

        errText = errJson.message || JSON.stringify(errJson);
      } catch (err) {}
      throw new Error(errText);
    }

    const data = await response.json();
    if (data.token) localStorage.setItem("tooken", data.token);

    window.location.href = "/";
  } catch (err) {
    console.error(err);
    alert("Login error: " + err.message);
    
    loginButton.disabled = false;
    loginButton.innerHTML = loginButton.dataset.origHtml;
  }
}

loginButton.addEventListener("click", onSignupClick);

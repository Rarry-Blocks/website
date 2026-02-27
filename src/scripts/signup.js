import "@fortawesome/fontawesome-free/css/all.min.css";
import { toggleIcons, toggleTheme } from "../functions/theme";
import config from "../config";

toggleTheme();
toggleIcons();

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login");

function updateLoginState() {
  const isUsernameValid = validateUsername(false);
  const isPasswordValid = validatePassword(false);

  loginButton.disabled = !(isUsernameValid && isPasswordValid);
}

async function onSignupClick(e) {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!validateUsername() || !validatePassword()) return;

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
      } catch (err) { }
      throw new Error(errText);
    }

    const data = await response.json();
    if (data.token) localStorage.setItem("tooken", data.token);

    window.location.href = "/";
  } catch (err) {
    console.error(err);

    let data;
    try {
      data = JSON.parse(err.message).error;
    } catch(_) {
      data = err.message;
    }

    alert("Sign up error: " + data);

    loginButton.disabled = false;
    loginButton.innerHTML = loginButton.dataset.origHtml;
  }
}

loginButton.addEventListener("click", onSignupClick);

const usernameError = document.getElementById("username-error");
const passwordError = document.getElementById("password-error");

function validateUsername(showError = true) {
  const value = usernameInput.value.trim();

  usernameInput.classList.remove("input-invalid", "input-valid");

  if (!value) {
    usernameError.style.display = "none";
    return false;
  }

  if (value.length < 3 || value.length > 20) {
    if (showError) {
      usernameError.textContent = "Must be between 3 and 20 characters long";
      usernameError.style.display = "block";
    }
    usernameInput.classList.add("input-invalid");
    return false;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    if (showError) {
      usernameError.textContent =
        "Only letters, numbers, underscores (_) and dashes (-) are allowed";
      usernameError.style.display = "block";
    }
    usernameInput.classList.add("input-invalid");
    return false;
  }

  if (!/[a-zA-Z]/.test(value)) {
    if (showError) {
      usernameError.textContent =
        "Username must contain at least one letter (a-z or A-Z)";
      usernameError.style.display = "block";
    }
    usernameInput.classList.add("input-invalid");
    return false;
  }

  usernameError.style.display = "none";
  usernameInput.classList.add("input-valid");
  return true;
}

function validatePassword(showError = true) {
  const value = passwordInput.value.trim();

  passwordInput.classList.remove("input-invalid", "input-valid");

  if (!value) {
    passwordError.style.display = "none";
    return false;
  }

  if (value.length < 8 || value.length > 50) {
    if (showError) {
      passwordError.textContent =
        "Must be between 8 and 50 characters long";
      passwordError.style.display = "block";
    }
    passwordInput.classList.add("input-invalid");
    return false;
  }

  passwordError.style.display = "none";
  passwordInput.classList.add("input-valid");
  return true;
}

usernameInput.addEventListener("input", () => {
  validateUsername();
  updateLoginState();
});

passwordInput.addEventListener("input", () => {
  validatePassword();
  updateLoginState();
});

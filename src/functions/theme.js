import "@fortawesome/fontawesome-free/css/all.min.css";
import * as Blockly from "blockly";
import config from "../config";
import { cache } from "../cache";
import { showPopup } from "./utils";

const root = document.documentElement;
const theme = localStorage.getItem("theme") === "dark" ?? false;
const icons = localStorage.getItem("removeIcons") === "true" ?? false;

const blockStyles = {
  logic_blocks: {
    colourPrimary: "#59BA57",
  },
  math_blocks: {
    colourPrimary: "#59BA57",
  },
  text_blocks: {
    colourPrimary: "#59BA57",
  },
  loop_blocks: {
    colourPrimary: "#FFAB19",
  },
  variable_blocks: {
    colourPrimary: "#FF8C1A",
  },
  list_blocks: {
    colourPrimary: "#E35340",
  },
  procedure_blocks: {
    colourPrimary: "#FF6680",
  },
  motion_blocks: {
    colourPrimary: "#4C97FF",
  },
  looks_blocks: {
    colourPrimary: "#9966FF",
  },
  events_blocks: {
    colourPrimary: "#FFC400",
  },
  control_blocks: {
    colourPrimary: "#FFAB19",
  },
  json_category: {
    colourPrimary: "#FF8349",
  },
  set_blocks: {
    colourPrimary: "#2CC2A9",
  },
};

const lightTheme = Blockly.Theme.defineTheme("customLightTheme", {
  base: Blockly.Themes.Classic,
  blockStyles: blockStyles,
});

const darkTheme = Blockly.Theme.defineTheme("customDarkTheme", {
  base: Blockly.Themes.Classic,
  blockStyles: blockStyles,
  componentStyles: {
    workspaceBackgroundColour: "#1a1e25",
    toolboxBackgroundColour: "#303236",
    toolboxForegroundColour: "#fff",
    flyoutBackgroundColour: "#212327",
    flyoutForegroundColour: "#ccc",
    flyoutOpacity: 1,
    scrollbarColour: "#797979",
    insertionMarkerColour: "#fff",
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: "#d0d0d0",
  },
});

export function toggleTheme(dark = theme, workspace) {
  if (dark) root.classList.add("dark");
  else root.classList.remove("dark");

  localStorage.setItem("theme", dark ? "dark" : "light");

  if (workspace) workspace.setTheme(dark ? darkTheme : lightTheme);
}

export function toggleIcons(removeIcons = icons) {
  if (removeIcons) root.classList.add("removeIcons");
  else root.classList.remove("removeIcons");

  localStorage.setItem("removeIcons", String(removeIcons));
}

export function setupThemeButton(workspace) {
  toggleTheme(theme, workspace);
  toggleIcons(icons);

  const themeButton = document.getElementById("theme-button");
  if (themeButton)
    themeButton.addEventListener("click", () =>
      showPopup({
        title: "Appearance",
        rows: [
          [
            "Theme:",
            {
              type: "button",
              label: '<i class="fa-solid fa-sun"></i> Light',
              onClick: () => toggleTheme(false, workspace),
            },
            {
              type: "button",
              label: '<i class="fa-solid fa-moon"></i> Dark',
              onClick: () => toggleTheme(true, workspace),
            },
          ],
          [
            "Show icon on buttons:",
            {
              type: "checkbox",
              checked:
                !document.documentElement.classList.contains("removeIcons"),
              onChange: (checked) => {
                toggleIcons(!checked);
              },
            },
          ],
          workspace
            ? [
                "Renderer (applies after refresh):",
                {
                  type: "menu",
                  value: localStorage.getItem("renderer"),
                  options: [
                    { label: "Zelos (default)", value: "custom_zelos" },
                    { label: "Thrasos", value: "thrasos" },
                    { label: "Geras", value: "geras" },
                  ],
                  onChange: (value) => localStorage.setItem("renderer", value),
                },
              ]
            : [],
        ],
      })
    );
}

export function setupUserTag() {
  function setUserTag(user) {
    if (user === null) {
      if (cache.user === null) return;
      user = cache.user;
    }

    login.parentElement.innerHTML = `
    <div class="userTag">
      <img src="${config.apiUrl}/users/${user.id}/avatar" />
      <a href="/user?id=${user.id}">${user.username}</a>
    </div>
  `;
  }

  const login = document.getElementById("login-button");
  if (login && localStorage.getItem("tooken") !== null) {
    if (cache.user) {
      setUserTag(cache.user);
    } else {
      fetch(`${config.apiUrl}/users/me`, {
        headers: {
          Authorization: localStorage.getItem("tooken"),
        },
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(
              "Failed to fetch user data: " + response.statusText
            );
          return response.json();
        })
        .then((data) => {
          cache.user = data;
          setUserTag(data);
        })
        .catch(console.error);
    }
  }
}

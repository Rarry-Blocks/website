import "@fortawesome/fontawesome-free/css/all.min.css";
import * as Blockly from "blockly";
import config from "../config";
import { cache } from "../cache";
import { showPopup } from "./utils";
import { attachAvatarChanger } from "./avatar";

const root = document.documentElement;
const theme = localStorage.getItem("theme") === "dark" ?? false;
const icons = localStorage.getItem("removeIcons") === "true" ?? false;
const rarryToolbar =
  localStorage.getItem("removeRarryToolbar") === "true" ?? false;
const toolboxPosition =
  localStorage.getItem("toolboxPosition") || "space-between";
const headerColor = localStorage.getItem("headerColor") || "";
const stageLeft = localStorage.getItem("stageLeft") === "true" ?? false;

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
    colourPrimary: "#e9c600",
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

export function toggleTheme(dark, workspace) {
  localStorage.setItem("theme", dark ? "dark" : "light");

  if (dark) root.classList.add("dark");
  else root.classList.remove("dark");

  if (workspace) workspace.setTheme(dark ? darkTheme : lightTheme);
}

export function toggleIcons(removeIcons) {
  localStorage.setItem("removeIcons", String(removeIcons));

  if (removeIcons) root.classList.add("removeIcons");
  else root.classList.remove("removeIcons");
}

export function toggleRarryToolbar(removeIcon) {
  localStorage.setItem("removeRarryToolbar", String(removeIcon));

  if (removeIcon) root.classList.add("removeRarryToolbar");
  else root.classList.remove("removeRarryToolbar");
}

export function setToolboxPosition(pos) {
  localStorage.setItem("toolboxPosition", pos);

  const header = document.querySelector("header");
  if (!header) return;

  root.classList.remove("toolbox-left", "toolbox-center", "toolbox-right");

  if (pos === "default") return;

  root.classList.add(`toolbox-${pos}`);
}

export function setHeaderColor(color) {
  localStorage.setItem("headerColor", color);

  if (!color) root.style.removeProperty("--header-color");
  else root.style.setProperty("--header-color", color);
}

export function toggleStageLeft(left) {
  localStorage.setItem("stageLeft", String(left));

  if (left) root.classList.add("stageLeft");
  else root.classList.remove("stageLeft");
}

export function setupThemeButton(workspace) {
  toggleTheme(theme, workspace);
  toggleIcons(icons);
  toggleRarryToolbar(rarryToolbar);
  toggleStageLeft(stageLeft);
  setToolboxPosition(toolboxPosition);
  setHeaderColor(headerColor);

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
              onChange: checked => {
                toggleIcons(!checked);
              },
            },
          ],
          [
            "Show Rarry logo on toolbar:",
            {
              type: "checkbox",
              checked:
                !document.documentElement.classList.contains(
                  "removeRarryToolbar"
                ),
              onChange: checked => {
                toggleRarryToolbar(!checked);
              },
            },
          ],
          [
            "Toolbar color:",
            {
              type: "color",
              value: localStorage.getItem("headerColor") || "",
              onChange: value => setHeaderColor(value),
            },
            {
              type: "button",
              label: "Reset",
              onClick: () => setHeaderColor(""),
            },
          ],
          [
            "Toolbar position:",
            {
              type: "menu",
              value: localStorage.getItem("toolboxPosition") || "default",
              options: [
                { label: "Space Between (default)", value: "default" },
                { label: "Left", value: "left" },
                { label: "Center", value: "center" },
                { label: "Right", value: "right" },
              ],
              onChange: value => setToolboxPosition(value),
            },
          ],
          ...(workspace
            ? [
              [
                "Renderer (applies after refresh):",
                {
                  type: "menu",
                  value: localStorage.getItem("renderer"),
                  options: [
                    { label: "Zelos (default)", value: "custom_zelos" },
                    { label: "Thrasos", value: "thrasos" },
                    { label: "Geras", value: "geras" },
                  ],
                  onChange: value => localStorage.setItem("renderer", value),
                },
              ],
              [
                "Stage on left:",
                {
                  type: "checkbox",
                  checked:
                    document.documentElement.classList.contains("stageLeft"),
                  onChange: checked => {
                    toggleStageLeft(checked);
                  },
                },
              ],
            ]
            : []),
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
        <div class="userTagAvatarWrapper">
          <img id="userTagAvatar" src="${config.apiUrl}/users/${user.id}/avatar" />
        </div>
        <a href="/user?id=${user.id}">${user.username}</a>
      </div>
    `;

    if (cache.user && cache.user.id === user.id) {
      const img = document.getElementById("userTagAvatar");
      attachAvatarChanger(img);
    }
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
        .then(response => {
          if (!response.ok)
            throw new Error(
              "Failed to fetch user data: " + response.statusText
            );
          return response.json();
        })
        .then(data => {
          cache.user = data;
          setUserTag(data);
        })
        .catch(console.error);
    }
  }
}

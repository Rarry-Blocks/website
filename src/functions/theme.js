import "@fortawesome/fontawesome-free/css/all.min.css";
import * as Blockly from "blockly/core";
import config from "../config";
import { cache } from "../cache";
import { capitalizeFirstLetter, getLuminance, shadeColor, Popup } from "./utils";
import { attachAvatarChanger } from "./avatar";

const root = document.documentElement;
const theme = localStorage.getItem("theme") === "dark" || false;
const icons = localStorage.getItem("removeIcons") === "true" || false;
const rarryToolbar = localStorage.getItem("removeRarryToolbar") === "true" || false;
const toolboxPosition = localStorage.getItem("toolboxPosition") || "default";
const categoryBubble = localStorage.getItem("categoryBubble") || "default";
const stageLeft = localStorage.getItem("stageLeft") === "true" || false;
const hats = localStorage.getItem("startHats") === "true" || false;
const snapToGrid = localStorage.getItem("snapToGrid") === "true" || false;
const scrollbars = localStorage.getItem("scrollbars") !== "false";
const sounds = localStorage.getItem("sounds") !== "false";

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
  system_blocks: {
    colourPrimary: "#5CB1D6",
  },
  motion_blocks: {
    colourPrimary: "#4C97FF",
  },
  looks_blocks: {
    colourPrimary: "#9966FF",
  },
  sound_blocks: {
    colourPrimary: "#ff66ba",
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
  startHats: hats,
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
  startHats: hats,
});

const baseColorKeys = ["toolbar-header", "dark", "primary", "danger", "color"];
const allColorKeys = [
  "toolbar-header",
  "dark",
  "dark-light",
  "primary",
  "primary-dark",
  "danger",
  "danger-dark",
  "color1",
  "color2",
  "color3",
  "color4",
];

export function applyCustomColors() {
  const savedColors = JSON.parse(localStorage.getItem("colors") || "{}");
  if (Object.keys(savedColors).length === 0) return;

  if (savedColors["toolbar-header"]) {
    root.style.setProperty("--toolbar-header", savedColors["toolbar-header"]);
  }
  if (savedColors.primary) {
    root.style.setProperty("--primary", savedColors.primary);
    root.style.setProperty("--primary-dark", shadeColor(savedColors.primary, -0.2));
  }
  if (savedColors.danger) {
    root.style.setProperty("--danger", savedColors.danger);
    root.style.setProperty("--danger-dark", shadeColor(savedColors.danger, -0.2));
  }
  if (savedColors.dark) {
    root.style.setProperty("--dark", savedColors.dark);
    const isLight = getLuminance(savedColors.dark) > 128;
    root.style.setProperty(
      "--dark-light",
      shadeColor(savedColors.dark, isLight ? -0.15 : 0.2),
    );
  }
  if (savedColors.color) {
    root.style.setProperty("--color1", savedColors.color);
    const isLight = getLuminance(savedColors.color) > 128;

    if (isLight) root.classList.remove("dark");
    else root.classList.add("dark");

    root.style.setProperty(
      "--color2",
      shadeColor(savedColors.color, isLight ? -0.06 : 0.08),
    );
    root.style.setProperty(
      "--color3",
      shadeColor(savedColors.color, isLight ? -0.16 : 0.18),
    );
    root.style.setProperty(
      "--color4",
      shadeColor(savedColors.color, isLight ? -0.25 : 0.25),
    );
  }
}

function updateCustomColor(name, value) {
  const savedColors = JSON.parse(localStorage.getItem("colors") || "{}");

  if (!value) delete savedColors[name];
  else savedColors[name] = value;

  localStorage.setItem("colors", JSON.stringify(savedColors));

  allColorKeys.forEach(c => root.style.removeProperty(`--${c}`));

  const isDark = localStorage.getItem("theme") === "dark";
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");

  applyCustomColors();
}

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

  root.classList.remove("toolbox-left", "toolbox-center", "toolbox-right");
  if (pos === "default") return;
  root.classList.add(`toolbox-${pos}`);
}

export function setCategoryBubble(style, workspace) {
  localStorage.setItem("categoryBubble", style);

  root.classList.remove("category-bubble-line", "category-bubble-none");
  if (style !== "bubble") root.classList.add(`category-bubble-${style}`);

  if (!workspace) return;

  const toolbox = workspace.toolbox_?.HtmlDiv;
  if (!toolbox) {
    Blockly.svgResize(workspace);
    return;
  }

  const observer = new MutationObserver(() => {
    observer.disconnect();
    Blockly.svgResize(workspace);
  });
  observer.observe(toolbox, {
    childList: true,
    subtree: true,
  });
}

export function toggleStageLeft(left) {
  localStorage.setItem("stageLeft", String(left));

  if (left) root.classList.add("stageLeft");
  else root.classList.remove("stageLeft");
}

export function toggleHats(enabled, workspace) {
  localStorage.setItem("startHats", String(enabled));

  lightTheme.startHats = enabled;
  darkTheme.startHats = enabled;

  if (workspace) {
    const isDark = localStorage.getItem("theme") === "dark";
    workspace.setTheme(isDark ? darkTheme : lightTheme);
    workspace.getAllBlocks(false).forEach(block => block.render());
  }
}

export function toggleSnapToGrid(enabled) {
  localStorage.setItem("snapToGrid", String(enabled));
}

export function toggleScrollbars(enabled, workspace) {
  localStorage.setItem("scrollbars", String(enabled));
  workspace?.scrollbar?.setVisible(enabled);
}

export function toggleSounds(enabled) {
  localStorage.setItem("sounds", String(enabled));
}

export function setupSettingsButton(workspace) {
  toggleTheme(theme, workspace);
  toggleIcons(icons);
  toggleRarryToolbar(rarryToolbar);
  toggleStageLeft(stageLeft);
  setToolboxPosition(toolboxPosition);
  toggleHats(hats, workspace);
  toggleSnapToGrid(snapToGrid, workspace);
  toggleScrollbars(scrollbars, workspace);
  toggleSounds(sounds, workspace);
  setCategoryBubble(categoryBubble, workspace);

  const settingsButton = document.getElementById("settings-button");
  if (settingsButton)
    settingsButton.addEventListener("click", async () => {
      const { projectAPI } = await import("../scripts/editor");
      var currentColors;

      const popup = new Popup({
        title: "Settings",
        beforeRender: () => {
          currentColors = JSON.parse(localStorage.getItem("colors") || "{}");
        },
        tabs: () => [
          {
            label: "Project",
            rows: [
              [
                "<div><h3>Stage Size</h3><small style='opacity:0.7'>The size of the canvas in pixels.</small></div>",
              ],
              [
                "Width",
                {
                  type: "number",
                  value: projectAPI.settings.stageWidth,
                  min: 1,
                  max: 4096,
                  step: 1,
                  onChange: value => projectAPI.updateSetting("stageWidth", value),
                },
              ],
              [
                "Height",
                {
                  type: "number",
                  value: projectAPI.settings.stageHeight,
                  min: 1,
                  max: 4096,
                  step: 1,
                  onChange: value => projectAPI.updateSetting("stageHeight", value),
                },
              ],
              [
                "<div><h3>Code Execution</h3><small style='opacity:0.7'>Changes how code is run and defines its limits.</small></div>",
              ],
              [
                "<div>Framerate (FPS)<br><small style='opacity:0.7'>How fast the engine executes and refreshes.</small></div>",
                {
                  type: "number",
                  value: projectAPI.settings.fps,
                  min: 1,
                  max: 240,
                  step: 1,
                  onChange: value => projectAPI.updateSetting("fps", value),
                },
              ],
              [
                "<div>Clone Limit<br><small style='opacity:0.7'>Max clones allowed at once to prevent crashing.</small></div>",
                {
                  type: "number",
                  value: projectAPI.settings.cloneLimit,
                  min: 0,
                  max: 100000,
                  step: 1,
                  onChange: value => projectAPI.updateSetting("cloneLimit", value),
                },
              ],
            ],
          },
          {
            label: "Appearance",
            rows: [
              [
                "Show icon on buttons",
                {
                  type: "checkbox",
                  checked: !document.documentElement.classList.contains("removeIcons"),
                  onChange: checked => {
                    toggleIcons(!checked);
                  },
                },
              ],
              [
                "Show Rarry logo on toolbar",
                {
                  type: "checkbox",
                  checked:
                    !document.documentElement.classList.contains("removeRarryToolbar"),
                  onChange: checked => {
                    toggleRarryToolbar(!checked);
                  },
                },
              ],
              [
                "Toolbar position",
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
              [
                "Category bubble",
                {
                  type: "menu",
                  value: localStorage.getItem("categoryBubble") || "default",
                  options: [
                    { label: "Circle (default)", value: "default" },
                    { label: "Line", value: "line" },
                    { label: "None", value: "none" },
                  ],
                  onChange: value => setCategoryBubble(value, workspace),
                },
              ],
            ],
          },
          {
            label: "Colors",
            rows: [
              [
                "Presets",
                {
                  type: "button",
                  label: '<i class="fa-solid fa-sun"></i> Light',
                  onClick: popup => {
                    localStorage.removeItem("colors");
                    allColorKeys.forEach(c => root.style.removeProperty(`--${c}`));
                    toggleTheme(false, workspace);
                    popup.refresh();
                  },
                },
                {
                  type: "button",
                  label: '<i class="fa-solid fa-moon"></i> Dark',
                  onClick: popup => {
                    localStorage.removeItem("colors");
                    allColorKeys.forEach(c => root.style.removeProperty(`--${c}`));
                    toggleTheme(true, workspace);
                    popup.refresh();
                  },
                },
              ],
              ...baseColorKeys.map(key => {
                let cssVar = key === "color" ? "color1" : key;
                return [
                  {
                    type: "button",
                    label: '<i class="fa-solid fa-arrows-rotate stay"></i>',
                    onClick: popup => {
                      updateCustomColor(key, "");
                      popup.refresh();
                    },
                  },
                  `${capitalizeFirstLetter(key).replaceAll("-", " ")}:`,
                  {
                    type: "color",
                    value:
                      currentColors?.[key] ||
                      getComputedStyle(root).getPropertyValue(`--${cssVar}`).trim(),
                    onChange: value => updateCustomColor(key, value),
                  },
                ];
              }),
            ],
          },
          {
            label: "Editor",
            rows: [
              [
                "Stage on left",
                {
                  type: "checkbox",
                  checked: document.documentElement.classList.contains("stageLeft"),
                  onChange: checked => {
                    toggleStageLeft(checked);
                  },
                },
              ],
              [
                "Event hat bumps",
                {
                  type: "checkbox",
                  checked: localStorage.getItem("startHats") === "true",
                  onChange: checked => {
                    toggleHats(checked, workspace);
                  },
                },
              ],
              [
                "Scrollbars",
                {
                  type: "checkbox",
                  checked: localStorage.getItem("scrollbars") !== "false",
                  onChange: checked => toggleScrollbars(checked, workspace),
                },
              ],
              [
                "Snap blocks to grid (applies after refresh)",
                {
                  type: "checkbox",
                  checked: localStorage.getItem("snapToGrid") === "true",
                  onChange: checked => toggleSnapToGrid(checked, workspace),
                },
              ],
              [
                "Block sounds (applies after refresh)",
                {
                  type: "checkbox",
                  checked: localStorage.getItem("sounds") !== "false",
                  onChange: checked => toggleSounds(checked, workspace),
                },
              ],
            ],
          },
        ],
      });
      popup.show();
    });
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
  if (login) {
    if (cache.user) {
      setUserTag(cache.user);
    } else {
      fetch(`${config.apiUrl}/users/me`, {
        credentials: "include",
      })
        .then(response => {
          if (!response.ok)
            throw new Error("Failed to fetch user data: " + response.statusText);
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

import "@fortawesome/fontawesome-free/css/all.min.css";
import * as Blockly from "blockly/core";
import config from "../config";
import { cache } from "../cache";
import {
  capitalizeFirstLetter,
  getLuminance,
  shadeColor,
  Popup,
  chunk,
} from "./utils";
import { attachAvatarChanger } from "./avatar";

const root = document.documentElement;

const settingsSchema = [
  {
    key: "theme",
    type: "boolean",
    default: false,
    read: (value) => value === "dark" || false,
    write: (value) => (value ? "dark" : "light"),
    needsWorkspace: true,
    apply(value, workspace) {
      root.classList.toggle("dark", value);
      if (workspace) workspace.setTheme(value ? darkTheme : lightTheme);
    },
  },
  {
    key: "removeIcons",
    type: "boolean",
    default: false,
    apply: (value) => root.classList.toggle("removeIcons", value),
    render: { tab: "Appearance", label: "Show icon on buttons:", invert: true },
  },
  {
    key: "removeRarryToolbar",
    type: "boolean",
    default: false,
    apply: (value) => root.classList.toggle("removeRarryToolbar", value),
    render: {
      tab: "Appearance",
      label: "Show Rarry logo on toolbar:",
      invert: true,
    },
  },
  {
    type: "section",
    tab: "Editor",
    title: "Visuals",
    description: "Changes how the editor looks and feels.",
  },
  {
    key: "stageLeft",
    type: "boolean",
    default: false,
    apply: (value) => root.classList.toggle("stageLeft", value),
    render: { tab: "Editor", label: "Stage on left:" },
  },
  {
    key: "toolboxPosition",
    type: "menu",
    default: "default",
    apply(value) {
      root.classList.remove("toolbox-left", "toolbox-center", "toolbox-right");
      if (value === "default") return;
      root.classList.add(`toolbox-${value}`);
    },
    render: {
      tab: "Appearance",
      label: "Toolbar position:",
      options: [
        { label: "Space Between (default)", value: "default" },
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  },
  {
    key: "startHats",
    type: "boolean",
    default: false,
    needsWorkspace: true,
    apply(value, workspace) {
      lightTheme.startHats = value;
      darkTheme.startHats = value;
      if (workspace) {
        const isDark = localStorage.getItem("theme") === "dark";
        workspace.setTheme(isDark ? darkTheme : lightTheme);
        workspace.getAllBlocks(false).forEach((block) => block.render());
      }
    },
    render: { tab: "Editor", label: "Event hat bumps:" },
  },
  {
    key: "snapToGrid",
    type: "boolean",
    default: false,
    render: {
      tab: "Editor",
      label: "Snap blocks to grid (applies after refresh):",
    },
  },
  {
    key: "scrollbars",
    type: "boolean",
    default: true,
    needsWorkspace: true,
    apply: (value, workspace) => workspace?.scrollbar?.setVisible(value),
    render: { tab: "Editor", label: "Scrollbars:" },
  },
  {
    key: "sounds",
    type: "boolean",
    default: true,
    render: {
      tab: "Editor",
      label: "Block sounds (applies after refresh):",
    },
  },
  {
    key: "squaredStrings",
    type: "boolean",
    default: false,
    render: { tab: "Editor", label: "Squared text inputs:" },
  },
  {
    type: "section",
    tab: "Editor",
    title: "Advanced",
    description: "Developer features and extra tools.",
  },
  {
    key: "blockCodeContextMenu",
    type: "boolean",
    default: false,
    render: {
      tab: "Editor",
      label: "Show generated code in block context menu:",
    },
  },
  {
    key: "categoryBubble",
    type: "menu",
    default: "default",
    needsWorkspace: true,
    apply(value, workspace) {
      root.classList.remove("category-bubble-line", "category-bubble-none");
      if (value !== "bubble") root.classList.add(`category-bubble-${value}`);

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
    },
    render: {
      tab: "Appearance",
      label: "Category bubble:",
      options: [
        { label: "Circle (default)", value: "default" },
        { label: "Line", value: "line" },
        { label: "None", value: "none" },
      ],
    },
  },
];

const settingByKey = new Map(
  settingsSchema
    .filter((entry) => entry.key)
    .map((entry) => [entry.key, entry]),
);

const defaultReaders = {
  boolean: (value, entry) =>
    entry.default ? value !== "false" : value === "true",
  menu: (value, entry) => value || entry.default,
  number: (value, entry) => {
    if (value === null || value === "") return entry.default;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? entry.default : parsed;
  },
};

const defaultWriters = {
  boolean: (value) => (value ? "true" : "false"),
  menu: (value) => String(value),
  number: (value) => String(value),
};

export function getSetting(key) {
  const entry = settingByKey.get(key);
  if (!entry) return undefined;
  const value = localStorage.getItem(entry.key);
  return entry.read
    ? entry.read(value, entry)
    : defaultReaders[entry.type](value, entry);
}

export function setSetting(key, value, workspace) {
  const entry = settingByKey.get(key);
  if (!entry) return;
  const write = entry.write || defaultWriters[entry.type];
  localStorage.setItem(entry.key, write(value));
  if (entry.apply) entry.apply(value, workspace);
}

const hats = getSetting("startHats");

const blockStyles = {
  events_blocks: {
    colourPrimary: "#E2C416",
  },
  control_blocks: {
    colourPrimary: "#FFAB19",
  },
  loop_blocks: {
    colourPrimary: "#FFAB19",
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
  sound_blocks: {
    colourPrimary: "#ff66ba",
  },
  logic_blocks: {
    colourPrimary: "#59BA57",
  },
  math_blocks: {
    colourPrimary: "#59BA57",
  },
  text_blocks: {
    colourPrimary: "#59BA57",
  },
  system_blocks: {
    colourPrimary: "#5CB1D6",
  },
  list_blocks: {
    colourPrimary: "#E35340",
  },
  json_blocks: {
    colourPrimary: "#FF8349",
  },
  variable_blocks: {
    colourPrimary: "#FF8C1A",
  },
  set_blocks: {
    colourPrimary: "#2CC2A9",
  },
};

const categoryStyles = {
  events_blocks: { colour: "#E2C416" },
  control_blocks: { colour: "#FFAB19" },
  procedure_blocks: { colour: "#FF6680" },
  motion_blocks: { colour: "#4C97FF" },
  looks_blocks: { colour: "#9966FF" },
  sound_blocks: { colour: "#ff66ba" },
  logic_blocks: { colour: "#59BA57" },
  system_blocks: { colour: "#5CB1D6" },
  list_blocks: { colour: "#E35340" },
  json_blocks: { colour: "#FF8349" },
  variable_blocks: { colour: "#FF8C1A" },
};

export const lightTheme = Blockly.Theme.defineTheme("customLightTheme", {
  base: Blockly.Themes.Classic,
  blockStyles: blockStyles,
  categoryStyles: categoryStyles,
  startHats: hats,
});

export const darkTheme = Blockly.Theme.defineTheme("customDarkTheme", {
  base: Blockly.Themes.Classic,
  blockStyles: blockStyles,
  categoryStyles: categoryStyles,
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

let currentWorkspace = null;

export function getBlockColorOverrides() {
  return JSON.parse(localStorage.getItem("blockColors") || "{}");
}

function applyBlockStyleOverrides() {
  const overrides = getBlockColorOverrides();
  for (const styleName in blockStyles) {
    const style = overrides[styleName]
      ? { colourPrimary: overrides[styleName] }
      : { ...blockStyles[styleName] };
    lightTheme.setBlockStyle(styleName, style);
    darkTheme.setBlockStyle(styleName, style);
  }
  for (const styleName in categoryStyles) {
    const colour = overrides[styleName] || blockStyles[styleName].colourPrimary;
    const style = { colour };
    lightTheme.setCategoryStyle(styleName, style);
    darkTheme.setCategoryStyle(styleName, style);
  }
}

export function updateBlockColor(styleName, value) {
  const overrides = getBlockColorOverrides();
  const isDefault =
    value.toLowerCase() === blockStyles[styleName].colourPrimary.toLowerCase();
  if (!value || isDefault) delete overrides[styleName];
  else overrides[styleName] = value;

  localStorage.setItem("blockColors", JSON.stringify(overrides));

  applyBlockStyleOverrides();
  if (!currentWorkspace) return;
  const dark = localStorage.getItem("theme") === "dark";
  currentWorkspace.setTheme(dark ? darkTheme : lightTheme);

  const toolbox = currentWorkspace.getToolbox();
  if (toolbox) {
    toolbox.refreshTheme();     
    toolbox.render(toolbox.toolboxDef_); 
  }
}

function buildBlockStyleCell(styleName, overrides) {
  const color = overrides[styleName] || blockStyles[styleName].colourPrimary;
  const label = capitalizeFirstLetter(
    styleName.replace("_blocks", "").replaceAll("_", " "),
  );
  return `
    <div class="block-style-cell">
      <div class="block-style-controls">
        <button class="block-style-reset" data-style="${styleName}" title="Reset color">
          <i class="fa-solid fa-arrows-rotate stay"></i>
        </button>
        <input class="block-style-color" type="color" data-style="${styleName}" value="${color}" />
        <span>${label}</span>
      </div>
    </div>
  `;
}

applyBlockStyleOverrides();

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
    root.style.setProperty(
      "--primary-dark",
      shadeColor(savedColors.primary, -0.2),
    );
  }
  if (savedColors.danger) {
    root.style.setProperty("--danger", savedColors.danger);
    root.style.setProperty(
      "--danger-dark",
      shadeColor(savedColors.danger, -0.2),
    );
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

  allColorKeys.forEach((c) => root.style.removeProperty(`--${c}`));

  const isDark = localStorage.getItem("theme") === "dark";
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");

  applyCustomColors();
}

export function toggleTheme(dark, workspace) {
  setSetting("theme", dark, workspace);
}

export function toggleIcons(removeIcons) {
  setSetting("removeIcons", removeIcons);
}

export function toggleRarryToolbar(removeIcon) {
  setSetting("removeRarryToolbar", removeIcon);
}

export function setToolboxPosition(pos) {
  setSetting("toolboxPosition", pos);
}

export function setCategoryBubble(style, workspace) {
  setSetting("categoryBubble", style, workspace);
}

export function toggleStageLeft(left) {
  setSetting("stageLeft", left);
}

export function toggleHats(enabled, workspace) {
  setSetting("startHats", enabled, workspace);
}

export function toggleSnapToGrid(enabled) {
  setSetting("snapToGrid", enabled);
}

export function toggleScrollbars(enabled, workspace) {
  setSetting("scrollbars", enabled, workspace);
}

export function toggleSounds(enabled) {
  setSetting("sounds", enabled);
}

export function toggleSquaredStrings(enabled) {
  setSetting("squaredStrings", enabled);
}

export function toggleBlockCodeContextMenu(enabled) {
  setSetting("blockCodeContextMenu", enabled);
}

function buildTab(tabName, workspace) {
  const rows = [];
  for (const entry of settingsSchema) {
    const render = entry.render;
    if (!render || render.tab !== tabName) continue;

    if (entry.type === "section") {
      rows.push([
        `<div><h3>${entry.title}</h3><small style='opacity:0.7'>${entry.description}</small></div>`,
      ]);
      continue;
    }

    let control;
    if (entry.type === "boolean") {
      control = {
        type: "checkbox",
        checked: render.invert ? !getSetting(entry.key) : getSetting(entry.key),
        onChange: (checked) =>
          setSetting(entry.key, render.invert ? !checked : checked, workspace),
      };
    } else if (entry.type === "menu") {
      control = {
        type: "menu",
        value: getSetting(entry.key),
        options: render.options,
        onChange: (value) => setSetting(entry.key, value, workspace),
      };
    } else if (entry.type === "number") {
      control = {
        type: "number",
        value: getSetting(entry.key),
        min: render.min,
        max: render.max,
        step: render.step,
        placeholder: render.placeholder,
        onChange: (value) => setSetting(entry.key, value, workspace),
      };
    }
    if (control) rows.push([render.label, control]);
  }
  return { label: tabName, rows };
}

export function setupSettingsButton(workspace, projectAPI = null) {
  currentWorkspace = workspace;

  for (const entry of settingsSchema) {
    if (!entry.key) continue;
    setSetting(entry.key, getSetting(entry.key), workspace);
  }

  const settingsButton = document.getElementById("settings-button");
  if (settingsButton)
    settingsButton.addEventListener("click", async () => {
      let currentColors, currentBlockOverrides;
      if (workspace && !projectAPI) {
        const { projectAPI: api } = await import("../scripts/editor");
        projectAPI = api;
      }

      const popup = new Popup({
        title: "Settings",
        beforeRender: () => {
          currentColors = JSON.parse(localStorage.getItem("colors") || "{}");
          currentBlockOverrides = getBlockColorOverrides();
        },
        tabs: () => [
          workspace
            ? {
                label: "Project",
                rows: [
                  [
                    "<div><h3>Stage Size</h3><small style='opacity:0.7'>The size of the canvas in pixels.</small></div>",
                  ],
                  [
                    "Width:",
                    {
                      type: "number",
                      value: projectAPI.settings.stageWidth,
                      min: 1,
                      max: 4096,
                      step: 1,
                      onChange: (value) =>
                        projectAPI.updateSetting("stageWidth", value),
                    },
                  ],
                  [
                    "Height:",
                    {
                      type: "number",
                      value: projectAPI.settings.stageHeight,
                      min: 1,
                      max: 4096,
                      step: 1,
                      onChange: (value) =>
                        projectAPI.updateSetting("stageHeight", value),
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
                      onChange: (value) =>
                        projectAPI.updateSetting("fps", value),
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
                      onChange: (value) =>
                        projectAPI.updateSetting("cloneLimit", value),
                    },
                  ],
                ],
              }
            : null,
          buildTab("Appearance", workspace),
          {
            label: "Colors",
            rows: [
              [
                "Presets",
                {
                  type: "button",
                  label: '<i class="fa-solid fa-sun"></i> Light',
                  onClick: (popup) => {
                    localStorage.removeItem("colors");
                    allColorKeys.forEach((c) =>
                      root.style.removeProperty(`--${c}`),
                    );
                    toggleTheme(false, workspace);
                    popup.refresh();
                  },
                },
                {
                  type: "button",
                  label: '<i class="fa-solid fa-moon"></i> Dark',
                  onClick: (popup) => {
                    localStorage.removeItem("colors");
                    allColorKeys.forEach((c) =>
                      root.style.removeProperty(`--${c}`),
                    );
                    toggleTheme(true, workspace);
                    popup.refresh();
                  },
                },
              ],
              ...baseColorKeys.map((key) => {
                let cssVar = key === "color" ? "color1" : key;
                return [
                  {
                    type: "button",
                    label: '<i class="fa-solid fa-arrows-rotate stay"></i>',
                    onClick: (popup) => {
                      updateCustomColor(key, "");
                      popup.refresh();
                    },
                  },
                  {
                    type: "color",
                    value:
                      currentColors?.[key] ||
                      getComputedStyle(root)
                        .getPropertyValue(`--${cssVar}`)
                        .trim(),
                    onChange: (value) => updateCustomColor(key, value),
                  },
                  `${capitalizeFirstLetter(key).replaceAll("-", " ")}`,
                ];
              }),
              [
                "<div><h3>Block styles</h3><small style='opacity:0.7'>Customize the color of each block category.</small></div>",
              ],
              ...chunk(Object.keys(blockStyles), 3).map((group) =>
                group.map((styleName) => ({
                  type: "custom",
                  html: buildBlockStyleCell(styleName, currentBlockOverrides),
                })),
              ),
            ],
          },
          buildTab("Editor", workspace),
        ],
      });
      popup.show();

      popup.element.addEventListener("click", (event) => {
        const reset = event.target.closest(".block-style-reset");
        if (!reset) return;
        updateBlockColor(reset.dataset.style, "");
        popup.refresh();
      });

      popup.element.addEventListener("input", (event) => {
        const colorInput = event.target.closest(".block-style-color");
        if (!colorInput) return;
        updateBlockColor(colorInput.dataset.style, colorInput.value);
      });
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
        .then((response) => {
          if (!response.ok)
            throw new Error(
              "Failed to fetch user data: " + response.statusText,
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

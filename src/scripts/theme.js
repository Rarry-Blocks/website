import * as Blockly from "blockly";

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
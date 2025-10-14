import "@fortawesome/fontawesome-free/css/all.min.css";
import { toggleIcons, toggleTheme } from "./theme";
import { showPopup } from "./utils";

const root = document.documentElement;

toggleTheme();
toggleIcons();

document.getElementById("theme-button").addEventListener("click", () =>
  showPopup({
    title: "Appearance",
    rows: [
      [
        "Theme:",
        {
          type: "button",
          label: '<i class="fa-solid fa-sun"></i> Light',
          onClick: () => toggleTheme(false),
        },
        {
          type: "button",
          label: '<i class="fa-solid fa-moon"></i> Dark',
          onClick: () => toggleTheme(true),
        },
      ],
      [
        "Show icon on buttons:",
        {
          type: "checkbox",
          checked: !root.classList.contains("removeIcons"),
          onChange: (checked, _popup) => {
            toggleIcons(!checked);
          },
        },
      ],
    ],
  })
);
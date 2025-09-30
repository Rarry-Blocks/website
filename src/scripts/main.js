import "@fortawesome/fontawesome-free/css/all.min.css";

if (localStorage.getItem("theme") === "dark") document.documentElement.classList.add("dark");
if (localStorage.getItem("removeIcons") === "true") document.documentElement.classList.add("removeIcons");
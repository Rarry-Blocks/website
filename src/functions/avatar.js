import config from "../config";
import { showPopup } from "./utils";

const allowedFileFormats = ["jpeg", "png", "webp", "avif", "gif", "tiff"];

export function attachAvatarChanger(imgEl) {
  if (!imgEl) return;

  imgEl.addEventListener("click", () => {
    showPopup({
      title: "Avatar",
      rows: [
        [
          {
            type: "button",
            label: '<i class="fa-solid fa-arrow-up-from-bracket"></i> Upload avatar',
            className: "primary",
            onClick: async (popup) => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = allowedFileFormats.map(i => `image/${i}`).join(",");
              input.style.display = "none";
              document.body.appendChild(input);
              input.click();

              input.onchange = async () => {
                const file = input.files[0];
                if (!file) return;

                const format = file.type.split("/")[1];
                if (!allowedFileFormats.includes(format)) {
                  alert(`Unsupported format: ${format}`);
                  return;
                }

                const formData = new FormData();
                formData.append("avatar", file);

                try {
                  const res = await fetch(
                    `${config.apiUrl}/users/me/avatar`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: localStorage.getItem("tooken"),
                      },
                      body: formData,
                    }
                  );

                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Upload failed");

                  window.location.reload();
                } catch (err) {
                  console.error(err);
                  alert("Error uploading: " + err.message);
                } finally {
                  popup.remove();
                  input.remove();
                }
              };
            },
          },
          {
            type: "button",
            label: '<i class="fa-solid fa-trash"></i> Remove avatar',
            className: "danger",
            onClick: async (popup) => {
              if (!confirm("Remove your avatar?")) return;

              try {
                const res = await fetch(
                  `${config.apiUrl}/users/me/avatar`,
                  {
                    method: "DELETE",
                    headers: {
                      Authorization: localStorage.getItem("tooken"),
                    },
                  }
                );

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to remove avatar");

                window.location.reload();
              } catch (err) {
                console.error(err);
                alert("Error deleting: " + err.message);
              } finally {
                popup.remove();
              }
            },
          },
        ],
      ],
    });
  });
}

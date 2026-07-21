import { Texture } from "pixi.js-legacy";
import {
  spriteManager,
  setActiveSprite,
  activeSprite,
  currentSocket,
  app,
  currentRoom
} from "../editor";
import Sortable from "sortablejs";

const playingAudios = {};

function createRenameableLabel(initialName, onRename) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.gap = "8px";

  const nameLabel = document.createElement("p");
  nameLabel.textContent = initialName;
  nameLabel.style.margin = "0";
  nameLabel.style.cursor = "pointer";

  function startRename() {
    let willRename = true;

    const input = document.createElement("input");
    input.type = "text";
    input.value = nameLabel.textContent;
    input.style.flexGrow = "1";

    container.replaceChild(input, nameLabel);
    input.focus();
    input.select();

    function commit() {
      if (willRename) {
        const newName = input.value.trim();
        if (newName && newName !== nameLabel.textContent) {
          onRename(newName);
          nameLabel.textContent = newName;
        }
      }
      container.replaceChild(nameLabel, input);
    }

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") input.blur();
      else if (e.key === "Escape") {
        willRename = false;
        input.blur();
      }
    });
  }

  nameLabel.addEventListener("click", startRename);
  container.appendChild(nameLabel);

  return container;
}

function createInput(initialValue = "", onChange) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = initialValue.trim();

  input.focus();
  input.select();

  let canceled = false;

  function commit() {
    if (canceled) return;

    const newName = input.value.trim();
    onChange(newName);
  }

  input.addEventListener("blur", commit);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      input.blur();
    }

    if (e.key === "Escape") {
      canceled = true;
      input.value = initialValue;
      input.blur();
    }
  });

  return input;
}

function createDeleteButton(onDelete) {
  const img = document.createElement("img");
  img.src = "icons/trash.svg";
  img.className = "button";
  img.draggable = false;
  img.onclick = onDelete;
  return img;
}

export function renderSpritesList(renderOthers = false) {
  const listEl = document.getElementById("sprites-list");
  listEl.innerHTML = "";
  new Sortable(listEl, {
    swap: true,
    animation: 150,
    onEnd: () => {
      const ids = [...listEl.children].map(el => el.dataset.id).filter(Boolean);
      spriteManager.reorder(ids);
    }
  });

  const sprites = spriteManager.getOriginals();

  listEl.style.display = sprites.length === 0 ? "none" : "";

  sprites.forEach(sprite => {
    const spriteIconContainer = document.createElement("div");
    spriteIconContainer.dataset.id = sprite.id;

    if (activeSprite?.id === sprite.id) {
      spriteIconContainer.className = "active";
    }

    const img = new Image(50, 50);
    img.style.objectFit = "contain";

    const baseTex = sprite.pixiSprite.texture.baseTexture;

    if (baseTex.valid) {
      img.src = baseTex.resource?.url || "";
    } else {
      baseTex.once("loaded", () => {
        img.src = baseTex.resource?.url || "";
      });
    }

    spriteIconContainer.appendChild(img);
    spriteIconContainer.onclick = () => setActiveSprite(sprite);
    listEl.appendChild(spriteIconContainer);
  });

  if (renderOthers === true) {
    renderSpriteInfo();
    renderCostumesList();
    renderSoundsList();
  }
}

export function renderSpriteInfo() {
  const infoEl = document.getElementById("sprite-info");

  if (!activeSprite) {
    infoEl.innerHTML = "<p>Select a sprite to see its properties.</p>";
    return;
  }

  let nameInput = infoEl.querySelector(".sprite-name-input");

  if (!nameInput) {
    infoEl.innerHTML = "";

    const nameRow = document.createElement("div");
    nameRow.className = "name";

    nameInput = createInput(activeSprite?.name ?? "Sprite", newValue => {
      const oldName = activeSprite.name;
      activeSprite.name = newValue;

      if (currentSocket && currentRoom && newValue !== oldName) {
        currentSocket.emit("projectUpdate", {
          roomId: currentRoom,
          type: "renameSprite",
          data: {
            spriteId: activeSprite.id,
            newName: newValue
          }
        });
      }
    });
    nameInput.classList.add("sprite-name-input");

    nameRow.appendChild(nameInput);

    const infoRow = document.createElement("div");
    infoRow.className = "info";
    infoRow.innerHTML = `
      <p class="pos"></p>
      <p class="angle"></p>
      <p class="size"></p>
      <p class="vis"></p>
    `;

    infoEl.appendChild(nameRow);
    infoEl.appendChild(infoRow);
  } else {
    nameInput.value = activeSprite.name;
  }

  updateSpriteInfoValues();
}

export function updateSpriteInfoValues() {
  if (!activeSprite) return;

  const sprite = activeSprite.pixiSprite;
  const infoEl = document.getElementById("sprite-info");

  infoEl.querySelector(".pos").textContent =
    `${Math.round(sprite.x)}, ${Math.round(-sprite.y)}`;

  infoEl.querySelector(".angle").textContent = `${Math.round(sprite.angle)}º`;

  infoEl.querySelector(".size").textContent =
    `size: ${Math.round(((sprite.scale.x + sprite.scale.y) / 2) * 100)}`;

  infoEl.querySelector(".vis").innerHTML =
    `<i class="fa-solid fa-${sprite.visible ? "eye" : "eye-slash"}"></i>`;
}

export function resetSpriteInfo() {
  const infoEl = document.getElementById("sprite-info");
  infoEl.innerHTML = "";
  renderSpriteInfo();
}

export function renderCostumesList() {
  const costumesList = document.getElementById("costumes-list");
  costumesList.innerHTML = "";

  if (!activeSprite || !activeSprite.costumes) return;

  activeSprite.costumes.forEach((costume, index) => {
    const costumeContainer = document.createElement("div");
    costumeContainer.className = "costume-container";

    const img = new Image(60, 60);
    img.style.objectFit = "contain";
    img.src = costume.texture.baseTexture.resource.url;

    const renameableLabel = createRenameableLabel(costume.name, newName => {
      const oldName = costume.name;
      costume.name = newName;

      if (currentSocket && currentRoom && oldName !== newName) {
        currentSocket.emit("projectUpdate", {
          roomId: currentRoom,
          type: "renameCostume",
          data: {
            spriteId: activeSprite.id,
            id: costume.id,
            newName
          }
        });
      }
    });

    const _texture = costume.texture.baseTexture || costume.texture;
    const sizeLabel = document.createElement("span");
    sizeLabel.className = "smallLabel";
    sizeLabel.textContent = "Loading...";
    if (_texture.valid) {
      sizeLabel.textContent = `${_texture.width}x${_texture.height}`;
    } else {
      _texture.once("update", () => {
        sizeLabel.textContent = `${_texture.width}x${_texture.height}`;
      });
    }

    const deleteBtn = createDeleteButton(() => {
      const deleted = activeSprite.costumes[index];
      const wasCurrentCostumeDeleted = activeSprite.currentCostume === index;

      activeSprite.costumes.splice(index, 1);

      if (wasCurrentCostumeDeleted) {
        if (activeSprite.costumes.length > 0) {
          activeSprite.pixiSprite.texture = activeSprite.costumes[0].texture;
        } else {
          activeSprite.pixiSprite.texture = Texture.EMPTY;
        }
      }
      renderCostumesList();

      if (currentSocket && currentRoom && deleted) {
        currentSocket.emit("projectUpdate", {
          roomId: currentRoom,
          type: "deleteCostume",
          data: {
            spriteId: activeSprite.id,
            id: deleted.id
          }
        });
      }
    });

    costumeContainer.appendChild(img);
    costumeContainer.appendChild(renameableLabel);
    costumeContainer.appendChild(deleteBtn);
    costumeContainer.appendChild(sizeLabel);

    costumesList.appendChild(costumeContainer);
  });
}

export function renderSoundsList() {
  const soundsList = document.getElementById("sounds-list");
  soundsList.innerHTML = "";

  if (!activeSprite || !activeSprite.sounds) return;

  activeSprite.sounds.forEach((sound, index) => {
    const container = document.createElement("div");
    container.className = "sound-container";

    let sizeBytes = 0;
    if (sound.dataURL) {
      const base64Length = sound.dataURL.length - (sound.dataURL.indexOf(",") + 1);
      sizeBytes = Math.floor((base64Length * 3) / 4);
    }

    const renameableLabel = createRenameableLabel(sound.name, newName => {
      const oldName = sound.name;
      sound.name = newName;

      if (currentSocket && currentRoom && oldName !== newName) {
        currentSocket.emit("projectUpdate", {
          roomId: currentRoom,
          type: "renameSound",
          data: {
            spriteId: activeSprite.id,
            id: sound.id,
            newName
          }
        });
      }
    });

    let sizeLabel;
    if (typeof sizeBytes === "number" && sizeBytes > 0) {
      sizeLabel = document.createElement("span");
      sizeLabel.className = "smallLabel";

      const sizeKB = sizeBytes / 1024;
      if (sizeKB < 1024) {
        sizeLabel.textContent = `${sizeKB.toFixed(2)} KB`;
      } else {
        sizeLabel.textContent = `${(sizeKB / 1024).toFixed(2)} MB`;
      }
    }

    const playButton = document.createElement("img");
    playButton.src = playingAudios[sound.id] ? "icons/stopAudio.svg" : "icons/play.svg";
    playButton.dataset.soundId = sound.id;
    playButton.className = "button play-button";
    playButton.draggable = false;

    playButton.onclick = () => {
      const allButtons = soundsList.querySelectorAll(".play-button");
      allButtons.forEach(btn => (btn.src = "icons/play.svg"));

      if (playingAudios[sound.id]) {
        playingAudios[sound.id].pause();
        playingAudios[sound.id].currentTime = 0;
        delete playingAudios[sound.id];
        playButton.src = "icons/play.svg";
      } else {
        for (const key in playingAudios) {
          playingAudios[key].pause();
          playingAudios[key].currentTime = 0;
        }
        Object.keys(playingAudios).forEach(k => delete playingAudios[k]);

        const audio = new Audio(sound.dataURL);
        playingAudios[sound.id] = audio;
        playButton.src = "icons/stopAudio.svg";

        audio.addEventListener("ended", () => {
          delete playingAudios[sound.id];
          playButton.src = "icons/play.svg";
        });

        audio.play();
      }
    };

    const deleteBtn = createDeleteButton(() => {
      const deleted = activeSprite.sounds[index];
      activeSprite.sounds.splice(index, 1);

      if (playingAudios[sound.id]) {
        playingAudios[sound.id].pause();
        delete playingAudios[sound.id];
      }

      renderSoundsList();

      if (currentSocket && currentRoom && deleted) {
        currentSocket.emit("projectUpdate", {
          roomId: currentRoom,
          type: "deleteSound",
          data: {
            spriteId: activeSprite.id,
            id: deleted.id
          }
        });
      }
    });

    container.appendChild(renameableLabel);
    container.appendChild(playButton);
    container.appendChild(deleteBtn);
    if (sizeLabel) container.appendChild(sizeLabel);
    soundsList.appendChild(container);
  });
}

const spriteImageCache = new WeakMap();
export function spriteToImage(sprite) {
  const texture = sprite?.pixiSprite?.texture;
  if (!texture) return null;

  const renderer = app?.renderer;
  if (!renderer) return null;

  let dataURL = spriteImageCache.get(texture);
  if (!dataURL) {
    const canvas = renderer.extract.canvas(sprite.pixiSprite);
    dataURL = canvas.toDataURL();
    spriteImageCache.set(texture, dataURL);
  }

  const img = document.createElement("img");
  img.src = dataURL;
  img.style.width = "32px";
  img.style.height = "32px";
  img.style.objectFit = "contain";
  img.style.verticalAlign = "middle";
  img.title = sprite?.name || "";
  return img;
}

import JSZip from "jszip";
import { Texture, Sprite as PixiSprite } from "pixi.js-legacy";
import { save as tauriSave } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { compressAudio, compressImage, showNotification } from "../../functions/utils.js";
import { registerExtension } from "../../functions/extensionManager.js";
import { Costume, Sound } from "../../components/Sprite.js";

const isDesktop = window.__TAURI_INTERNALS__ !== undefined;

export async function saveProject({
  projectName,
  spriteManager,
  activeExtensions,
  projectVariables,
  app,
  showLoading,
  hideLoading,
}) {
  showLoading("Preparing to save...");

  const zip = new JSZip();
  const json = {
    projectName,
    sprites: [],
    extensions: activeExtensions,
    variables: projectVariables ?? {},
  };

  const toUint8Array = base64 => Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const originals = spriteManager.getOriginals();

  let totalAssets = originals.reduce(
    (acc, s) => acc + s.costumes.length + s.sounds.length,
    0,
  );
  let processedAssets = 0;

  for (const sprite of originals) {
    const baseJSON = sprite.toJSON();
    const spriteId = sprite.id;

    const costumeEntries = [];
    for (const c of sprite.costumes) {
      showLoading(`Processing Costumes: ${processedAssets++}/${totalAssets}`);

      let dataURL;
      const url = c.texture?.baseTexture?.resource?.url;
      if (typeof url === "string" && url.startsWith("data:")) {
        dataURL = url;
      } else {
        dataURL = await app.renderer.extract.base64(new PixiSprite(c.texture));
      }

      const processed = await compressImage(dataURL);
      if (processed) {
        const base64 = processed.split(",")[1];
        zip.file(`${spriteId}.c.${c.id}.webp`, toUint8Array(base64), { binary: true });
        costumeEntries.push({
          id: c.id,
          name: c.name,
          texture: `${spriteId}.c.${c.id}.webp`,
        });
      }
      await new Promise(r => setTimeout(r, 0));
    }

    const soundEntries = [];
    for (const s of sprite.sounds) {
      showLoading(`Processing Sounds: ${processedAssets++}/${totalAssets}`);

      const processed = await compressAudio(s.dataURL);
      if (processed) {
        const base64 = processed.split(",")[1];
        zip.file(`${spriteId}.s.${s.id}.ogg`, toUint8Array(base64), { binary: true });
        soundEntries.push({ id: s.id, name: s.name, path: `${spriteId}.s.${s.id}.ogg` });
      }
      await new Promise(r => setTimeout(r, 0));
    }

    json.sprites.push({
      ...baseJSON,
      costumes: costumeEntries,
      sounds: soundEntries,
    });
  }

  zip.file("project.json", JSON.stringify(json));
  showLoading("Compressing bundle...");

  const zipConfig = {
    type: isDesktop ? "uint8array" : "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 /*7*/ },
  };

  const content = await zip.generateAsync(zipConfig);

  if (isDesktop) {
    const filePath = await tauriSave({
      title: "Save Rarry Project",
      defaultPath: json.projectName,
      filters: [{ name: "Rarry Project", extensions: ["rarryz"] }],
    });
    if (filePath) await writeFile(filePath, content);
  } else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = json.projectName + ".rarryz";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  hideLoading();
  showNotification({ message: "Project saved successfully!" });
}

export async function loadProjectFile(
  file,
  { spriteManager, handleProjectData, showLoading, hideLoading },
) {
  showLoading("Loading project...");
  try {
    const fileName = file.name;
    const projectName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const projectFile = zip.file("project.json");
    if (!projectFile) throw new Error("Invalid project: Missing project.json");

    const json = JSON.parse(await projectFile.async("string"));

    const sprites = await Promise.all(
      json.sprites.map(async entry => {
        const sprite = { ...entry, costumes: [], sounds: [] };

        for (const c of entry.costumes || []) {
          const src = c.texture ?? c.path ?? c.data;
          if (typeof src === "string" && !src.startsWith("data:")) {
            const fileEntry = zip.file(src);
            if (fileEntry) {
              const base64 = await fileEntry.async("base64");
              sprite.costumes.push({
                id: c.id,
                name: c.name,
                texture: `data:image/webp;base64,${base64}`,
              });
            }
          } else {
            sprite.costumes.push({ id: c.id, name: c.name, texture: src });
          }
        }

        for (const s of entry.sounds || []) {
          const src = s.data ?? s.path;
          if (typeof src === "string" && !src.startsWith("data:")) {
            const fileEntry = zip.file(src);
            if (fileEntry) {
              const base64 = await fileEntry.async("base64");
              sprite.sounds.push({
                id: s.id,
                name: s.name,
                data: `data:audio/ogg;base64,${base64}`,
              });
            }
          } else {
            sprite.sounds.push({ id: s.id, name: s.name, data: src });
          }
        }

        sprite.currentCostumeId =
          entry.currentCostumeId !== undefined
            ? entry.currentCostumeId
            : entry.currentCostume;
        return sprite;
      }),
    );

    await handleProjectData({
      projectName,
      sprites,
      extensions: json.extensions,
      variables: json.variables,
    });
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to load project.");
  } finally {
    hideLoading();
  }
}

export async function compressData(data, format = "deflate") {
  const stream = new Blob([data]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream(format));
  return new Uint8Array(await new Response(compressedStream).arrayBuffer());
}

export async function decompressData(data, format = "deflate") {
  const stream = new Blob([data]).stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(decompressedStream).arrayBuffer());
}

import JSZip from "jszip";
import { Sprite as PixiSprite } from "pixi.js-legacy";
import { save as tauriSave } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { compressAudio, compressImage, showNotification } from "../../functions/utils.js";
import { app, hideLoading, showLoading } from "../editor.js";

const isDesktop = window.__TAURI_INTERNALS__ !== undefined;

const metadata = {
  version: 2,
  platform: { name: "Rarry", url: "https://rarry.link" },
};

const toUint8Array = base64 => Uint8Array.from(atob(base64), c => c.charCodeAt(0));

export async function saveProject({
  projectName,
  sprites,
  spriteManager,
  extensions,
  variables,
  settings,
}) {
  showLoading("Preparing to save...");

  const zip = new JSZip();
  const json = {
    metadata: { ...metadata },
    projectName,
    sprites: [],
    extensions,
    variables,
    settings,
  };

  let totalAssets = sprites.reduce(
    (acc, s) => acc + s.costumes.length + s.sounds.length,
    0,
  );
  let processedAssets = 0;

  const writtenAssets = new Set();

  for (const sprite of spriteManager?.getOriginals?.() ?? sprites) {
    const baseJSON = sprite.toJSON();

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
        const filename = `costumes/${c.id}.webp`;

        if (!writtenAssets.has(filename)) {
          zip.file(filename, toUint8Array(processed.split(",")[1]), { binary: true });
          writtenAssets.add(filename);
        }

        costumeEntries.push({ id: c.id, name: c.name, texture: filename });
      }

      await new Promise(r => setTimeout(r, 0));
    }

    const soundEntries = [];
    for (const s of sprite.sounds) {
      showLoading(`Processing Sounds: ${processedAssets++}/${totalAssets}`);

      const processed = await compressAudio(s.dataURL);
      if (processed) {
        const filename = `sounds/${s.id}.ogg`;

        if (!writtenAssets.has(filename)) {
          zip.file(filename, toUint8Array(processed.split(",")[1]), { binary: true });
          writtenAssets.add(filename);
        }

        soundEntries.push({ id: s.id, name: s.name, path: filename });
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
      filters: [{ name: "Rarry Project", extensions: ["rarry", "rarryz"] }],
    });
    if (filePath) await writeFile(filePath, content);
  } else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = json.projectName + ".rarry";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  hideLoading();
  showNotification({ message: "Project saved successfully!" });
}

async function resolveAsset(zip, src, mimeType) {
  if (typeof src !== "string") return null;
  if (src.startsWith("data:")) return src;

  const fileEntry = zip.file(src);
  if (!fileEntry) return null;

  const base64 = await fileEntry.async("base64");
  return `data:${mimeType};base64,${base64}`;
}

export async function loadProjectFile(
  file,
  { handleProjectData, showLoading, hideLoading },
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
          const dataURL = await resolveAsset(zip, src, "image/webp");
          if (dataURL != null) {
            sprite.costumes.push({ id: c.id, name: c.name, texture: dataURL });
          }
        }

        for (const s of entry.sounds || []) {
          const src = s.data ?? s.path;
          const dataURL = await resolveAsset(zip, src, "audio/ogg");
          if (dataURL != null) {
            sprite.sounds.push({ id: s.id, name: s.name, data: dataURL });
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
      settings: json.settings
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

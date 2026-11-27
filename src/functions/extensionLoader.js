import { MAX_EXTENSION_BYTES, prepareExtension } from "./extensionTrust.js";
import {
  requestExtensionApproval,
  requestUnsandboxedExtensionDecision
} from "./extensionApproval.js";
import { registerExtension } from "./extensionManager.js";
import builtInExtensions from "./builtInExtensions.js";

const approvals = new Set();

async function fetchText(url) {
  let res;
  try {
    res = await fetch(url, {
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer"
    });
  } catch {
    throw new Error(
      "Couldn't download the extension. The site must allow cross-origin requests (CORS)."
    );
  }
  if (!res.ok) throw new Error(`The server answered ${res.status}.`);

  const declared = Number(res.headers.get("content-length") || 0);
  if (declared > MAX_EXTENSION_BYTES)
    throw new Error("Extension is too large to load.");

  return { text: await res.text(), finalUrl: res.url || url };
}

async function readShipped(path) {
  const res = await fetch(path, { credentials: "omit", cache: "no-store" });
  return res.ok ? res.text() : null;
}

function fetchShipped(id) {
  const entry = builtInExtensions.find(
    (e) => e?.id === id && typeof e.url === "string"
  );
  return entry ? entry.url : null;
}

/** Loads one extension from a link or from code. */
export async function loadExtensionFromSource(input) {
  const prepared = await prepareExtension(input, {
    origin: location.origin,
    fetchText,
    fetchShipped,
    readShipped,
    requestApproval: requestExtensionApproval,
    requestUnsandboxedDecision: requestUnsandboxedExtensionDecision,
    approvals
  });

  return registerExtension(prepared.code, prepared.trusted, {
    source: prepared.source,
    url: prepared.url,
    trusted: prepared.trusted,
    unsandboxed: prepared.unsandboxed
  });
}

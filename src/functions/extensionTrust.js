/** This only matches the beginning of the URL. */
export const TRUSTED = ["/extensions/", "https://www.rarry.link/extensions/"];

export const MAX_EXTENSION_BYTES = 256 * 1024;
const MAX_URL_LENGTH = 2048;
const SHIPPED_ID = /^[A-Za-z0-9_-]{1,64}$/;

export class ExtensionDeniedError extends Error {
  constructor(id) {
    super(`Extension "${id ?? "unnamed"}" was not allowed to run.`);
    this.name = "ExtensionDeniedError";
  }
}

export function parseExtensionUrl(input, origin) {
  if (
    typeof input !== "string" ||
    input.length === 0 ||
    input.length > MAX_URL_LENGTH
  ) {
    return null;
  }
  let url;
  try {
    url = new URL(input, origin);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.origin === origin) return url;
  return url.protocol === "https:" ? url : null;
}

export function isTrustedUrl(url, origin) {
  if (!url || url.origin !== origin) return false;
  return TRUSTED.some((prefix) => url.pathname.startsWith(prefix));
}

export async function fingerprint(code) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code)
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export async function prepareExtension(input, deps) {
  const { origin } = deps;
  let code;
  let source;
  let url = null;
  let trusted = false;

  if (input.url) {
    const requested = parseExtensionUrl(input.url, origin);
    if (!requested) {
      throw new Error(
        "Only https:// links or files on this site can be loaded."
      );
    }
    const { text, finalUrl } = await deps.fetchText(requested.href);
    const final = parseExtensionUrl(finalUrl, origin);
    if (!final) {
      throw new Error(
        "The extension redirected to a link that is not allowed."
      );
    }
    code = text;
    source = final.href;
    url = requested.href;
    trusted = isTrustedUrl(final, origin);
  } else if (typeof input.code === "string") {
    code = input.code;
    source = "pasted or project code";
    const shippedPath =
      typeof input.id === "string" && SHIPPED_ID.test(input.id)
        ? deps.fetchShipped(input.id)
        : null;
    if (shippedPath) {
      const shipped = await deps.readShipped(shippedPath);
      trusted = shipped !== null && shipped === code;
    }
  } else {
    throw new Error("Extension has neither a link nor code.");
  }

  if (new TextEncoder().encode(code).length > MAX_EXTENSION_BYTES) {
    throw new Error("Extension is too large to load.");
  }

  if (trusted) return { code, source, url, trusted: true, unsandboxed: false };

  if (input.unsandboxed === true) {
    const choice = await deps.requestUnsandboxedDecision({ source, code });
    if (choice === "deny") throw new ExtensionDeniedError(input.id);
    return {
      code,
      source,
      url,
      trusted: false,
      unsandboxed: choice === "unsandboxed"
    };
  }

  const fp = await fingerprint(code);
  if (!deps.approvals.has(fp)) {
    const approved = await deps.requestApproval({ source, code });
    if (!approved) throw new ExtensionDeniedError(input.id);
    deps.approvals.add(fp);
  }
  return { code, source, url, trusted: false, unsandboxed: false };
}

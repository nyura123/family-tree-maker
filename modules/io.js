import { html } from "./html";

export function getWrappedHtmlForExport() {
  const headElOriginal = document.querySelector("head");
  if (!headElOriginal) {
    throw new Error("Document head element not found");
  }
  const headEl = headElOriginal.cloneNode(true);
  // needed so links like "style.css" still work when opening the exported HTML file,
  // since it will be opened with a blob: URL origin instead of the app's origin
  const baseHref = new URL(".", window.location.href).href;
  const baseEl = document.createElement("base");
  baseEl.setAttribute("href", baseHref);
  // insert first in head to ensure it applies to all relative links,
  // even those in the head before the base element
  headEl.insertBefore(baseEl, headEl.firstChild);

  const familyTreeContainer = document.getElementById("family-tree-container");
  if (!familyTreeContainer) {
    throw new Error("Could not build export HTML from current document");
  }

  const staticContainer = familyTreeContainer.cloneNode(true);
  removeDynamicElements(staticContainer);

    // create a new html with head and body
  const wrappedHtml = html`
    <!DOCTYPE html>
    <html lang="en">
      ${headEl.outerHTML}
      <body>
        ${staticContainer.outerHTML}
      </body>
    </html>
  `;

  return wrappedHtml;
}

function removeDynamicElements(staticContainer) {
  staticContainer.querySelectorAll("select").forEach((el) => el.remove());
  staticContainer
    .querySelectorAll("#note-modal, #spouse-families-modal")
    .forEach((el) => el.remove());

  staticContainer
    .querySelectorAll('button[onclick*="showSpouseFamiliesModal"]')
    .forEach((button) => button.remove());

  staticContainer.querySelectorAll(".person-note").forEach((el) => el.remove());

  staticContainer
    .querySelectorAll(
      '[onclick*="showNoteModal"], [onkeydown*="personOnKeyDown"]'
    )
    .forEach((el) => {
      el.removeAttribute("onclick");
      el.removeAttribute("onkeydown");
      el.removeAttribute("role");
      el.removeAttribute("tabindex");
      el.classList.remove("more-info-available");
    });

  staticContainer
    .querySelectorAll(
      'button[onclick*="prevFamilyPage"], button[onclick*="nextFamilyPage"]'
    )
    .forEach((button) => button.remove());
}

export function downloadHtmlAsFile(wrappedHtml, filename = "family_tree.html") {
  const blob = new Blob([wrappedHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function openHtmlBlobInNewTab(wrappedHtml) {
  const blob = new Blob([wrappedHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

export async function loadGedcomFromUrl({ url, title, onText }) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      "Network response was not ok: " +
        [response.statusText, response.status].filter(Boolean).join(" "),
    );
  }

  const text = await response.text();
  onText(text, title);
}

export function urlToHumanReadableTitle(url) {
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1] || "Tree";
    return lastPart
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return url;
  }
}

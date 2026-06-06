export function getWrappedHtmlForExport() {
  const familyTreeContainer = document.getElementById("family-tree-container");
  const baseHref = new URL(".", window.location.href).href;

  if (!familyTreeContainer) {
    throw new Error("Could not build export HTML from current document");
  }

  const staticContainer = familyTreeContainer.cloneNode(true);

  staticContainer.querySelectorAll("select").forEach((el) => el.remove());
  staticContainer.querySelectorAll("#note-modal, #spouse-families-modal").forEach((el) => el.remove());

  staticContainer
    .querySelectorAll('button[onclick*="showSpouseFamiliesModal"]')
    .forEach((button) => button.remove());

  staticContainer.querySelectorAll(".person-note").forEach((el) => el.remove());

  staticContainer
    .querySelectorAll('[onclick*="showNoteModal"], [onkeydown*="personOnKeyDown"]')
    .forEach((el) => {
      el.removeAttribute("onclick");
      el.removeAttribute("onkeydown");
      el.removeAttribute("role");
      if (el.getAttribute("tabindex") === "0") {
        el.removeAttribute("tabindex");
      }
      el.classList.remove("more-info-available");
    });

  staticContainer
    .querySelectorAll('button[onclick*="prevFamilyPage"], button[onclick*="nextFamilyPage"]')
    .forEach((button) => button.remove());

  const htmlContent = staticContainer.outerHTML;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Family Tree</title>
<base href="${baseHref}">
<link rel="stylesheet" href="style.css">
</head>
<body style='width: fit-content;padding-right: 20px;position: relative;'>
${htmlContent}
</body>
</html>`;
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
    return lastPart.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return url;
  }
}

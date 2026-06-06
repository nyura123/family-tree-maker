import { escapeHtmlAttr } from "./renderer.js";
import { html } from "./html.js";
import { publicGedUrls, otherSourceValues } from "./sources.js";

function addOtherSourceOptions(selectEl) {
  if (!selectEl || selectEl.dataset.otherOptionsInitialized === "true") {
    return;
  }

  for (const [value, label] of Object.entries(otherSourceValues)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    selectEl.appendChild(option);
  }

  selectEl.dataset.otherOptionsInitialized = "true";
}

export function populatePublicGedcomSelectOptions(selectEl) {
  if (!selectEl || selectEl.dataset.optionsInitialized === "true") {
    return;
  }

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Load family...";
  selectEl.appendChild(placeholderOption);

  addOtherSourceOptions(selectEl);

  for (const [url, metadata] of Object.entries(publicGedUrls)) {
    const name =
      metadata?.title ||
      url
        .split("/")
        .pop()
        .replace(/\.ged$/, "")
        .replace(/\+/g, " ");
    const option = document.createElement("option");
    option.value = url;

    option.title = metadata?.sourceName
      ? `${url}\nSource: ${metadata.sourceName}`
      : url;
    const categoryMatch = url.match(/\/famous%20family%20trees\/([^\/]+)\//);
    const category = categoryMatch ? categoryMatch[1] : "";

    if (category.includes("presidents")) {
      option.textContent = `🇺🇸 Presidents: ${name}`;
    } else if (category.includes("corporations")) {
      option.textContent = `🏢 Corporations: ${name}`;
    } else if (category.includes("fictional")) {
      option.textContent = `📚 Fictional Characters: ${name}`;
    } else if (category.includes("languages")) {
      option.textContent = `🗣️ Languages: ${name}`;
    } else if (category.includes("misc")) {
      option.textContent = `🔀 Misc: ${name}`;
    } else if (
      category.includes("politicians") ||
      category.includes("writers") ||
      category.includes("scientists")
    ) {
      option.textContent = `👩‍🔬 Politicians/Writers/Scientists: ${name}`;
    } else if (category.includes("religious")) {
      option.textContent = `⛪ Religious Figures/Systems: ${name}`;
    } else if (category.includes("royalty")) {
      option.textContent = `👑 Royalty: ${name}`;
    } else if (category) {
      option.textContent = `${category}: ${name}`;
    } else {
      option.textContent = name;
    }
    selectEl.appendChild(option);
  }
  selectEl.dataset.optionsInitialized = "true";
}

export function renderSelectedSourceMeta(optionValue) {
  const metaEl = document.getElementById("selected-source-meta");
  if (!metaEl) {
    return;
  }

  if (!optionValue || optionValue === "sample_family") {
    metaEl.innerHTML = html`
      <div class="selected-source-card">
        <div class="selected-source-title">Default Sample Family Tree (JSON)</div>
        <div class="selected-source-row">
          <span class="selected-source-label">Type</span>
          <span class="selected-source-value">Built-in sample data</span>
        </div>
      </div>
    `;
    return;
  }

  if (optionValue === "from_textarea") {
    metaEl.innerHTML = html`
      <div class="selected-source-card">
        <div class="selected-source-title">Custom input from Textarea</div>
        <div class="selected-source-row">
          <span class="selected-source-label">Type</span>
          <span class="selected-source-value">User input from textarea</span>
        </div>
      </div>
    `;
    return;
  }

  const metadata = publicGedUrls[optionValue];
  if (!metadata) {
    const safeValue = escapeHtmlAttr(optionValue);
    metaEl.innerHTML = html`
      <div class="selected-source-card">
        <div class="selected-source-title">Custom GEDCOM URL</div>
        <div class="selected-source-row">
          <span class="selected-source-label">URL</span>
          <span class="selected-source-value selected-source-monospace">${safeValue}</span>
        </div>
      </div>
    `;
    return;
  }

  const safeTitle = escapeHtmlAttr(metadata.title || optionValue);
  const safeSourceName = escapeHtmlAttr(metadata.sourceName || "Unknown source");
  const sourceUrl = metadata.sourceUrl || optionValue;
  const safeSourceUrl = escapeHtmlAttr(sourceUrl);

  metaEl.innerHTML = html`
    <div class="selected-source-card">
      <div class="selected-source-title">${safeTitle}</div>
      <div class="selected-source-row">
        <span class="selected-source-label">Source</span>
        <span class="selected-source-value">
          <a href="${safeSourceUrl}" target="_blank" rel="noopener noreferrer">${safeSourceName}</a>
        </span>
      </div>
      <div class="selected-source-row">
        <span class="selected-source-label">URL</span>
        <span class="selected-source-value">
          <a href="${optionValue}" target="_blank" rel="noopener noreferrer">${optionValue}</a>
        </span>
      </div>
    </div>
  `;
}

export function selectOption(optionValue) {
  const select = document.getElementById("public-gedcom-select");
  if (!select) return;

  for (const option of select.options) {
    if (option.value === optionValue) {
      option.selected = true;
      return;
    }
  }
}

export function syncSelectWithUrlParam() {
  const sourceParam = new URL(window.location.href).searchParams.get("source");
  const urlParam = new URL(window.location.href).searchParams.get("url");
  let selectedValue = "sample_family";

  if (otherSourceValues[sourceParam]) {
    selectedValue = sourceParam;
  } else if (urlParam) {
    selectedValue = urlParam;
  }

  selectOption(selectedValue);
  renderSelectedSourceMeta(selectedValue);
}

import { parseGedcom, gedcomToTree } from "./gedcom.js";
import { html } from "./html.js";

export function getInitials(name) {
  const parts = (name || "").split(" ").filter((part) => part.length > 0);
  if (parts.length >= 2) {
    const lastNameInitial = parts[1][0];
    const isLastNameAscii = /[A-Za-z]/.test(lastNameInitial);
    const isLastNameRussian = /[А-Яа-яЁё]/.test(lastNameInitial);
    return parts[0][0] + (isLastNameAscii || isLastNameRussian ? lastNameInitial : "");
  }
  return (name || "").slice(0, 1);
}

function renderPersonStyle(person) {
  let style = "";
  if (person.color) {
    style += `color: ${person.color};`;
  }
  if (person.backgroundColor) {
    style += `background-color: ${person.backgroundColor};`;
  }
  return style;
}

export function escapeHtmlAttr(value, mode = "html") {
  const rawValue = String(value);
  if (mode === "selector") {
    return window.CSS && typeof CSS.escape === "function"
      ? CSS.escape(rawValue)
      : rawValue.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
  }
  return rawValue
    .replace(/&/g, "&amp;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderPersonNote(person) {
  if (person.note) {
    const clampedNote = person.note.length > 10 ? person.note.slice(0, 10) + "..." : person.note;
    return html`<span class="person-note">[Note] ${clampedNote}</span>`;
  }
  return "";
}

function renderMoreInfoAttributes(person) {
  if (!person?.noteId) return "";
  return `role="button" tabindex="0" aria-haspopup="dialog" onclick="showNoteModal('${person.noteId}', this)" onkeydown="personOnKeyDown(event, this)"`;
}

function renderMoreInfoClass(person) {
  return person.noteId ? "more-info-available" : "";
}

function renderCouple(person, generation) {
  const rootAttrs = generation === 1 ? " root-family" : "";
  const rootTabIndex = generation === 1 ? " tabindex='0'" : "";
  const personIdAttr = person.personId
    ? ` data-person-id="${escapeHtmlAttr(person.personId)}"`
    : "";
  const leftPersonDetails = html`
    ${person.marriageLabel
      ? html`<div class="person-marriage-branch">${person.marriageLabel}</div>`
      : ""}
    ${person.dates ? html`<div class="person-dates">${person.dates}</div>` : ""}
    ${person.occupation
      ? html`<div class="person-occupation" title="${person.occupation}">${person.occupation}</div>`
      : ""}
    ${renderPersonNote(person)}
  `;

  const spouseDetails = html`
    ${person.spouse.dates ? html`<div class="person-dates">${person.spouse.dates}</div>` : ""}
    ${person.spouse.occupation
      ? html`<div class="person-occupation" title="${person.spouse.occupation}">${person.spouse.occupation}</div>`
      : ""}
  `;

  const spouseRootFamilyIds = person.spouse.rootFamilyIds || [];
  const spouseCurrentFamilyIsOnlyRoot =
    spouseRootFamilyIds.length === 1 &&
    person.spouse.familyId &&
    spouseRootFamilyIds[0] === person.spouse.familyId;

  const viewFamiliesButton =
    person.spouse.personId && spouseRootFamilyIds.length > 0 && !spouseCurrentFamilyIsOnlyRoot
      ? html`<div><button class="button-small" style="margin-top:5px;font-size:0.75rem;" onclick="event.stopPropagation();showSpouseFamiliesModal('${person.spouse.personId}')">View families</button></div>`
      : "";

  return html`
    <div class="couple gen-${generation}">
      <div class="spouse-left">
        <div class="person ${rootAttrs} ${renderMoreInfoClass(person)}" style="align-items: flex-end;" ${renderMoreInfoAttributes(person)} ${rootTabIndex}${personIdAttr}>
          <div class="photo">${getInitials(person.name)}</div>
          <div class="person-info">
            <div class="person-name" title="${person.name}">${person.name}</div>
            ${leftPersonDetails}
          </div>
        </div>
      </div>
      <div class="couple-heart">♥</div>
      <div class="spouse-right">
        <div class="person ${renderMoreInfoClass(person.spouse)}" style="align-items: flex-start;" ${renderMoreInfoAttributes(person.spouse)}>
          <div class="photo " style="${renderPersonStyle(person.spouse)}">${getInitials(person.spouse.name)}</div>
          <div class="person-info">
            <div class="person-name" title="${person.spouse.name}">${person.spouse.name}</div>
            ${spouseDetails}
            ${viewFamiliesButton}
            ${renderPersonNote(person.spouse)}
          </div>
        </div>
      </div>
    </div>
    ${person.familySkipped
      ? html`<div class="couple-family-skipped">Family already rendered in another tree</div>`
      : ""}
  `;
}

function renderPerson(person, generation) {
  if (person.spouse) {
    return renderCouple(person, generation);
  }

  const rootAttrs = generation === 1 ? " root-family" : "";
  const rootTabIndex = generation === 1 ? " tabindex='0'" : "";
  const personIdAttr = person.personId
    ? ` data-person-id="${escapeHtmlAttr(person.personId)}"`
    : "";

  return html`
    <div class="person ${rootAttrs} gen-${generation} ${renderMoreInfoClass(person)}" ${renderMoreInfoAttributes(person)} ${rootTabIndex}${personIdAttr}>
      <div class="photo" style="${renderPersonStyle(person)}">${getInitials(person.name)}</div>
      <div class="person-info">
        <div class="person-name" title="${person.name}">${person.name}</div>
        ${person.marriageLabel
          ? html`<div class="person-marriage-branch">${person.marriageLabel}</div>`
          : ""}
        ${person.dates ? html`<div class="person-dates">${person.dates}</div>` : ""}
        ${person.occupation
          ? html`<div class="person-occupation" title="${person.occupation}">${person.occupation}</div>`
          : ""}
        ${renderPersonNote(person)}
      </div>
    </div>
  `;
}

function renderNode(node, generation = 1, isFirstChild = true, isLastChild = true) {
  const borderClass =
    generation === 1
      ? ""
      : isFirstChild && isLastChild
        ? "single-child"
        : isFirstChild
          ? "first-of-children"
          : isLastChild
            ? "last-of-children"
            : "middle-child";

  const children = Array.isArray(node.children) ? node.children : [];
  const childNodesHtml = children.map((child, index) =>
    renderNode(child, generation + 1, index === 0, index === children.length - 1),
  );

  return html`
    <div style="flex: 1;">
      <div class="family-node ${borderClass} ${node.spouse ? "has-spouse" : ""}">
        ${renderPerson(node, generation)}
        ${children.length > 0 ? renderConnectionToChildren() : ""}
      </div>
      ${children.length > 0 ? html`<div class="siblings">${childNodesHtml}</div>` : ""}
    </div>
  `;
}

function renderConnectionToChildren() {
  return html`
    <div class="grid-two-cols" style="flex:1">
      <div class="line-right"></div>
      <div></div>
    </div>
  `;
}

export function familyTreeJsonToHtml(familyTrees, pageIndex = 0) {
  const trees = Array.isArray(familyTrees) ? familyTrees : [familyTrees];
  const safeIndex = Math.min(Math.max(pageIndex, 0), Math.max(trees.length - 1, 0));
  const activeTree = trees[safeIndex];
  const activeTreeHtml = activeTree
    ? html`<div id="active-family-tree">${renderNode(activeTree)}</div>`
    : "";

  const pagerHtml =
    trees.length > 1
      ? html`
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:0.75rem 0 1.25rem;">
          <button class="button-small" ${safeIndex === 0 ? "disabled" : ""} onclick="prevFamilyPage()">Previous Family</button>
          <span style="color:var(--muted);font-size:0.95rem;">Family ${safeIndex + 1} of ${trees.length}</span>
          <button class="button-small" ${safeIndex === trees.length - 1 ? "disabled" : ""} onclick="nextFamilyPage()">Next Family</button>
        </div>
      `
      : "";

  return html`${pagerHtml}${activeTreeHtml}`;
}

function tryParseJson(rawInput) {
  try {
    return JSON.parse(rawInput);
  } catch {
    return null;
  }
}

export function updateFamilyTree(
  input,
  { title = "", notesStore, paging, inputElementId = "family-json-input" } = {},
) {
  if (!notesStore || !paging) {
    throw new Error("updateFamilyTree requires notesStore and paging dependencies");
  }

  const inputEl = document.getElementById(inputElementId);
  const rawInput = typeof input === "string" ? input : inputEl?.value || "";
  if (inputEl && inputEl.value !== rawInput) {
    inputEl.value = rawInput;
  }

  try {
    // try parsing as JSON first, if that fails, try parsing as GEDCOM
    const parsedJson = tryParseJson(rawInput);
    if (parsedJson !== null) {
      const prettyJson = JSON.stringify(parsedJson, null, 2);
      if (inputEl) {
        inputEl.value = prettyJson;
      }
      notesStore.populateNotesStore(parsedJson);
      const rootTitle = parsedJson.title || "Family Tree";
      const subtitle = parsedJson.subtitle || "";
      paging.initializeFamilyPaging({
        title: rootTitle,
        subtitle,
        familyTrees: parsedJson,
        individuals: {},
        families: {},
      });
      return;
    }

    // If not valid JSON, try parsing as GEDCOM
    const { individuals, families } = parseGedcom(rawInput);
    const hasGedcomData =
      Object.keys(individuals).length > 0 || Object.keys(families).length > 0;
    if (!hasGedcomData) {
      throw new Error("Input is not valid JSON or GEDCOM");
    }

    const trees = gedcomToTree(individuals, families);
    notesStore.populateNotesStore(trees);
    let surname = "Family";
    if (trees.length === 1) {
      const parts = (trees[0].name || "").split(" ");
      surname = parts.length > 1 ? parts[parts.length - 1] : parts[0] || "Family";
    } else if (trees.length > 1) {
      surname = "Multiple Families";
    }

    const rootTitle = title || "The " + surname + " Family";
    paging.initializeFamilyPaging({
      title: rootTitle,
      subtitle: "",
      familyTrees: trees,
      individuals,
      families,
    });
  } catch (e) {
    alert("Error parsing file: " + e.message);
  }
}

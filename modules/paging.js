import { familyTreeJsonToHtml } from "./renderer.js";
import { getRootFamilyIdsForIndividual } from "./gedcom.js";

function escapeSelectorValue(value) {
  const rawValue = String(value);
  return window.CSS && typeof CSS.escape === "function"
    ? CSS.escape(rawValue)
    : rawValue.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
}

export function createFamilyTreePaging() {
  let activeRootFamilyTrees = [];
  let activeIndividuals = {};
  let activeFamilies = {};
  let activeFamilyTitle = "Family Tree";
  let activeFamilySubtitle = "";
  let activeFamilyPageIndex = 0;
  const rootFamilyIdToIndexMap = new Map();
  const personRootFamilyIdsCache = {};

  function precomputeSpouseRootFamilyIds(node) {
    if (!node?.personId) return;

    node.rootFamilyIds = getRootFamilyIdsForIndividual(
      node.personId,
      activeIndividuals,
      activeFamilies,
      personRootFamilyIdsCache,
    ).filter((id) => rootFamilyIdToIndexMap.has(id));

    if (node.spouse?.personId) {
      node.spouse.rootFamilyIds = getRootFamilyIdsForIndividual(
        node.spouse.personId,
        activeIndividuals,
        activeFamilies,
        personRootFamilyIdsCache,
      ).filter((id) => rootFamilyIdToIndexMap.has(id));
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children || []) {
        precomputeSpouseRootFamilyIds(child);
      }
    }
  }

  function getPersonIdFromUrl() {
    const personId = new URL(window.location.href).searchParams.get("personId");
    return personId && personId.trim() ? personId.trim() : null;
  }

  function findPersonElementById(personId) {
    if (!personId) return null;
    const escapedPersonId = escapeSelectorValue(personId);
    return document.querySelector(
      `#family-tree-container .person[data-person-id="${escapedPersonId}"]`,
    );
  }

  function focusPersonById(personId) {
    const personEl = findPersonElementById(personId);
    if (!personEl) return false;

    if (!personEl.hasAttribute("tabindex")) {
      personEl.setAttribute("tabindex", "-1");
    }

    personEl.focus({ preventScroll: true });
    personEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    return true;
  }

  function setFamilyPage(pageIndex) {
    if (!activeRootFamilyTrees.length) return;

    const maxIndex = activeRootFamilyTrees.length - 1;
    activeFamilyPageIndex = Math.min(Math.max(pageIndex, 0), maxIndex);

    for (const key of Object.keys(personRootFamilyIdsCache)) {
      delete personRootFamilyIdsCache[key];
    }

    precomputeSpouseRootFamilyIds(activeRootFamilyTrees[activeFamilyPageIndex]);

    const tree = activeRootFamilyTrees[activeFamilyPageIndex];
    const paramValue = tree && tree.familyId ? tree.familyId : String(activeFamilyPageIndex);
    const url = new URL(window.location.href);
    url.searchParams.set("family", paramValue);
    try {
      history.replaceState(null, "", url.toString());
    } catch (e) {
      // replaceState on blob urls throws an error in some browsers, ignore
    }

    const familyTitleEl = document.getElementById("family-title");
    const familySubtitleEl = document.getElementById("family-subtitle");
    if (familyTitleEl) familyTitleEl.textContent = activeFamilyTitle;
    if (familySubtitleEl) familySubtitleEl.textContent = activeFamilySubtitle;

    const familyTreeContentEl = document.getElementById("family-tree-content");
    if (familyTreeContentEl) {
      familyTreeContentEl.innerHTML = familyTreeJsonToHtml(
        activeRootFamilyTrees,
        activeFamilyPageIndex,
      );
    }

    requestAnimationFrame(() => {
      const personIdFromUrl = getPersonIdFromUrl();
      if (personIdFromUrl && focusPersonById(personIdFromUrl)) {
        return;
      }

      const rootFamilyEl = document.querySelector("#family-tree-container .person.root-family");
      if (rootFamilyEl) {
        rootFamilyEl.focus();
        rootFamilyEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  function initializeFamilyPaging({ title, subtitle, familyTrees, individuals, families }) {
    activeFamilyTitle = title || "Family Tree";
    activeFamilySubtitle = subtitle || "";
    activeRootFamilyTrees = Array.isArray(familyTrees) ? familyTrees : [familyTrees];
    activeIndividuals = individuals || {};
    activeFamilies = families || {};

    rootFamilyIdToIndexMap.clear();
    activeRootFamilyTrees.forEach((tree, index) => {
      if (tree.familyId) {
        rootFamilyIdToIndexMap.set(tree.familyId, index);
      }
    });

    const familyUrlParam = new URL(window.location.href).searchParams.get("family");
    let startIndex = 0;
    if (familyUrlParam !== null) {
      if (rootFamilyIdToIndexMap.has(familyUrlParam)) {
        startIndex = rootFamilyIdToIndexMap.get(familyUrlParam);
      } else {
        const n = parseInt(familyUrlParam, 10);
        if (!Number.isNaN(n) && n >= 0 && n < activeRootFamilyTrees.length) {
          startIndex = n;
        }
      }
    }

    const personIdParam = getPersonIdFromUrl();
    if (!familyUrlParam && personIdParam && activeIndividuals[personIdParam]) {
      const personRootFamilyIds = getRootFamilyIdsForIndividual(
        personIdParam,
        activeIndividuals,
        activeFamilies,
        personRootFamilyIdsCache,
      ).filter((id) => rootFamilyIdToIndexMap.has(id));
      if (personRootFamilyIds.length > 0) {
        startIndex = rootFamilyIdToIndexMap.get(personRootFamilyIds[0]);
      }
    }

    setFamilyPage(startIndex);
  }

  function prevFamilyPage() {
    setFamilyPage(activeFamilyPageIndex - 1);
  }

  function nextFamilyPage() {
    setFamilyPage(activeFamilyPageIndex + 1);
  }

  function goToRootFamilyId(familyId) {
    const url = new URL(window.location.href);
    url.searchParams.set("family", familyId);
    window.location.href = url.toString();
  }

  function goToRootFamilyIdForPerson(familyId, personId) {
    const url = new URL(window.location.href);
    url.searchParams.set("family", familyId);
    if (personId) {
      url.searchParams.set("personId", personId);
    } else {
      url.searchParams.delete("personId");
    }
    window.location.href = url.toString();
  }

  function getState() {
    return {
      activeRootFamilyTrees,
      activeIndividuals,
      activeFamilies,
      rootFamilyIdToIndexMap,
      personRootFamilyIdsCache,
      activeFamilyPageIndex,
    };
  }

  return {
    initializeFamilyPaging,
    prevFamilyPage,
    nextFamilyPage,
    goToRootFamilyId,
    goToRootFamilyIdForPerson,
    getState,
  };
}

import { createFamilyTreePaging } from "./paging.js";
import { initializeDropZone } from "./dropzone.js";
import { familyJson } from "./sample.js";
import { createNotesStore } from "./notes.js";
import { updateFamilyTree } from "./renderer.js";
import {
  downloadHtmlAsFile,
  getWrappedHtmlForExport,
  loadGedcomFromUrl,
  openHtmlBlobInNewTab,
  urlToHumanReadableTitle,
} from "./io.js";
import {
  populatePublicGedcomSelectOptions,
  renderSelectedSourceMeta,
  selectOption,
  syncSelectWithUrlParam,
} from "./source_ui.js";
import { createModalControllers } from "./modals.js";
import {
  otherSourceValues,
} from "./sources.js";

function initializeFamilyTreeApp() {
  const paging = createFamilyTreePaging();
  const notesStore = createNotesStore();

  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const {
    showSpouseFamiliesModal,
    closeSpouseFamiliesModal,
    showNoteModal,
    closeNoteModal,
    personOnKeyDown,
    handleEscapeKey,
  } = createModalControllers({
    getNotesById: () => notesStore.getNotesById(),
    getPagingState: () => paging.getState(),
  });

  const updateTree = (input, title = "") =>
    updateFamilyTree(input, {
      title,
      notesStore,
      paging,
    });

  function updateFromTextArea() {
    updateTree(document.getElementById("family-json-input").value);
    selectOption("");
    renderSelectedSourceMeta("from_textarea");
  }

  function exportAsHtml() {
    const wrappedHtml = getWrappedHtmlForExport();
    downloadHtmlAsFile(wrappedHtml);
  }

  function openHTMLInNewTab() {
    const wrappedHtml = getWrappedHtmlForExport();
    openHtmlBlobInNewTab(wrappedHtml);
  }

  function prevFamilyPage() {
    paging.prevFamilyPage();
  }

  function nextFamilyPage() {
    paging.nextFamilyPage();
  }

  function goToRootFamilyId(familyId) {
    paging.goToRootFamilyId(familyId);
  }

  function goToRootFamilyIdForPerson(familyId, personId) {
    paging.goToRootFamilyIdForPerson(familyId, personId);
  }

  initializeDropZone({
    dropZone,
    fileInput,
    onText: (text) => updateTree(text),
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("keydown", handleEscapeKey);

    const urlParams = new URLSearchParams(window.location.search);
    const sourceParam = urlParams.get("source");

    if (sourceParam === "url") {
      const urlToLoad = urlParams.get("url");
      if (urlToLoad) {
        loadGedcomFromUrl({
          url: urlToLoad,
          title: urlToHumanReadableTitle(urlToLoad),
          onText: (text, title) => updateTree(text, title),
        }).catch((error) => {
          alert("Error loading GEDCOM file: " + error.message);
        });
      } else {
        alert("URL parameter 'url' is present but no URL specified");
      }
    } else {
      updateTree(JSON.stringify(familyJson));
    }

    populatePublicGedcomSelectOptions(document.getElementById("public-gedcom-select"));
    syncSelectWithUrlParam();
  });

  window.paging = paging;
  window.notesStore = notesStore;
  window.dropZone = dropZone;
  window.fileInput = fileInput;
  window.otherSourceValues = otherSourceValues;
  Object.assign(window, {
    updateFromTextArea,
    exportAsHtml,
    openHTMLInNewTab,
    showSpouseFamiliesModal,
    closeSpouseFamiliesModal,
    showNoteModal,
    closeNoteModal,
    personOnKeyDown,
    prevFamilyPage,
    nextFamilyPage,
    goToRootFamilyId,
    goToRootFamilyIdForPerson,
  });
}

initializeFamilyTreeApp();

export function createModalControllers({ getNotesById, getPagingState }) {
  let lastNoteModalTrigger = null;
  let noteModalFocusTrapHandler = null;

  function showSpouseFamiliesModal(spousePersonId) {
    const {
      activeIndividuals,
      activeRootFamilyTrees,
      rootFamilyIdToIndexMap,
      personRootFamilyIdsCache,
    } = getPagingState();

    const spousePerson = activeIndividuals[spousePersonId];
    const spouseName = spousePerson?.name || "Spouse";

    const allFamilyIds = (personRootFamilyIdsCache[spousePersonId] || []).filter((id) =>
      rootFamilyIdToIndexMap.has(id),
    );

    const modal = document.getElementById("spouse-families-modal");
    if (!modal) return;

    const titleEl = document.getElementById("spouse-families-modal-title");
    if (titleEl) titleEl.textContent = spouseName + " - Family Pages";

    const listEl = document.getElementById("spouse-families-modal-list");
    if (listEl) {
      if (allFamilyIds.length === 0) {
        listEl.innerHTML =
          '<p style="color:var(--muted);">No navigable family pages found for this person.</p>';
      } else {
        listEl.innerHTML = allFamilyIds
          .map((famId) => {
            const tree = activeRootFamilyTrees.find((t) => t.familyId === famId);
            const label = tree
              ? tree.spouse
                ? `${tree.name} & ${tree.spouse.name}`
                : tree.name
              : famId;
            return `<button class="button-small" style="display:block;width:100%;text-align:left;margin-bottom:6px;" onclick='goToRootFamilyIdForPerson(${JSON.stringify(famId)}, ${JSON.stringify(spousePersonId)});closeSpouseFamiliesModal();'>${label}</button>`;
          })
          .join("");
      }
    }

    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    document.body.classList.add("modal-open");
    const inner = modal.querySelector(".note-modal-inner");
    if (inner) inner.focus();
  }

  function closeSpouseFamiliesModal() {
    const modal = document.getElementById("spouse-families-modal");
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");
  }

  function enableNoteModalFocusTrap(modal) {
    if (noteModalFocusTrapHandler) return;
    noteModalFocusTrapHandler = (event) => {
      if (event.key !== "Tab") return;

      const modalInner = modal.querySelector(".note-modal-inner");
      if (!modalInner) return;

      const focusableNodes = modalInner.querySelectorAll(
        'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const focusable = Array.from(focusableNodes).filter((el) => el.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        modalInner.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", noteModalFocusTrapHandler);
  }

  function disableNoteModalFocusTrap() {
    if (!noteModalFocusTrapHandler) return;
    document.removeEventListener("keydown", noteModalFocusTrapHandler);
    noteModalFocusTrapHandler = null;
  }

  function showNoteModal(noteId, triggerEl) {
    const modal = document.getElementById("note-modal");
    if (!modal) return;

    lastNoteModalTrigger = triggerEl;
    const notesById = getNotesById();
    const text = noteId ? notesById[noteId] || "" : "";
    document.getElementById("note-modal-content").textContent = text;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    document.body.classList.add("modal-open");
    enableNoteModalFocusTrap(modal);

    const closeButton = modal.querySelector(".note-modal-close");
    if (closeButton) {
      closeButton.focus();
    }
  }

  function personOnKeyDown(event, thisEl) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      thisEl.click();
    }
  }

  function closeNoteModal() {
    const modal = document.getElementById("note-modal");
    if (!modal) return;

    disableNoteModalFocusTrap();
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");
    if (lastNoteModalTrigger) {
      lastNoteModalTrigger.focus();
      lastNoteModalTrigger = null;
    }
  }

  function handleEscapeKey(event) {
    if (event.key === "Escape") {
      closeNoteModal();
      closeSpouseFamiliesModal();
    }
  }

  return {
    showSpouseFamiliesModal,
    closeSpouseFamiliesModal,
    showNoteModal,
    closeNoteModal,
    personOnKeyDown,
    handleEscapeKey,
  };
}

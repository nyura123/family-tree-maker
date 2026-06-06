export function createNotesStore() {
  let notesById = {};
  let nextNoteId = 1;

  function resetNotesStore() {
    notesById = {};
    nextNoteId = 1;
  }

  function registerNoteText(noteText) {
    if (!noteText) return "";
    const noteId = `note-${nextNoteId++}`;
    notesById[noteId] = noteText;
    return noteId;
  }

  function populateNotesStore(data) {
    resetNotesStore();

    function walkPerson(person) {
      if (!person || typeof person !== "object") return;

      if (person.note) {
        person.noteId = registerNoteText(person.note);
      } else {
        delete person.noteId;
      }

      if (person.spouse && typeof person.spouse === "object") {
        if (person.spouse.note) {
          person.spouse.noteId = registerNoteText(person.spouse.note);
        } else {
          delete person.spouse.noteId;
        }
      }

      if (Array.isArray(person.children)) {
        for (const child of person.children) {
          walkPerson(child);
        }
      }
    }

    if (Array.isArray(data)) {
      for (const tree of data) {
        walkPerson(tree);
      }
      return;
    }

    if (data && typeof data === "object") {
      walkPerson(data);
    }
  }

  function getNotesById() {
    return notesById;
  }

  return {
    populateNotesStore,
    getNotesById,
  };
}

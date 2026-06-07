import { walkPerson } from "./json_family_utils.js";

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

  function onPerson(person) {
    if (person.note) {
      person.noteId = registerNoteText(person.note);
    } else {
      delete person.noteId;
    }
  }

  function populateNotesStore(data) {
    resetNotesStore();
    walkPerson(data, onPerson);
  }

  function getNotesById() {
    return notesById;
  }

  return {
    populateNotesStore,
    getNotesById,
  };
}

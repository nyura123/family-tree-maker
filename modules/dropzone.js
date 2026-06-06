export function initializeDropZone({ dropZone, fileInput, onText }) {
  if (!dropZone || !fileInput || typeof onText !== "function") {
    return;
  }

  const readFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      onText(typeof text === "string" ? text : "");
    };
    reader.readAsText(file);
  };

  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
    readFile(event.dataTransfer?.files?.[0]);
  });

  fileInput.addEventListener("change", (event) => {
    readFile(event.target?.files?.[0]);
  });
}

export function walkPerson(data, onPerson, visited = new Set()) {
  if (Array.isArray(data)) {
    for (const person of data) {
      walkPerson(person, onPerson, visited);
    }
    return;
  }

  const person = data;
  if (!person || typeof person !== "object" || visited.has(person)) return;
  visited.add(person);

  onPerson(person);

  if (person.spouse && typeof person.spouse === "object") {
    walkPerson(person.spouse, onPerson, visited);
  }

  if (Array.isArray(person.children)) {
    for (const child of person.children) {
      walkPerson(child, onPerson, visited);
    }
  }
}

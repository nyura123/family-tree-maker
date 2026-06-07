function parseNote(value, i, lines) {
  const noteLines = value ? [value] : [];
  while (i + 1 < lines.length) {
    const nextRaw = lines[i + 1].trim();
    const mNext = nextRaw.match(/^(\d+)\s+(\S+)(?:\s+(.*))?$/);
    if (!mNext) break;
    const nextLevel = parseInt(mNext[1]);
    const nextTag = mNext[2].toUpperCase();
    const nextValue = (mNext[3] || "").trim();

    if (nextTag === "CONC" && nextLevel >= 1 && nextLevel <= 2) {
      noteLines.push(nextValue === "" ? "\n" : nextValue);
      i++;
    } else if (nextTag === "CONT" && nextLevel >= 1 && nextLevel <= 2) {
      noteLines.push(nextValue === "" ? "\n" : nextValue);
      i++;
    } else {
      break;
    }
  }
  return { i, note: noteLines.join(" ") };
}

export function parseGedcom(text) {
  const individuals = {};
  const families = {};
  const notes = {};
  if (!text || typeof text !== "string") {
    return { individuals, families };
  }

  const lines = text.split(/\r?\n/);
  let rec = null;
  let subTag = null;

  for (let i = 0; i < lines.length; i++) {
    let raw = lines[i].trim();
    if (!raw) continue;

    const m = raw.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?(\S+)(?:\s+(.*))?$/);
    if (!m) continue;

    const level = parseInt(m[1]);
    const xref = m[2] ? m[2].replace(/@/g, "") : null;
    const tag = m[3].toUpperCase();
    const value = (m[4] || "").trim();

    if (level === 0) {
      subTag = null;
      if (tag === "NOTE" && xref) {
        const noteResult = parseNote(value, i, lines);
        i = noteResult.i;
        if (notes[xref]?.rec) {
          const linkedRecord = notes[xref].rec;
          linkedRecord.note = noteResult.note;
        } else {
          notes[xref] = { note: noteResult.note };
        }
      } else if (tag === "INDI" && xref) {
        rec = { type: "INDI", id: xref, famcList: [], famsList: [] };
        individuals[xref] = rec;
      } else if (tag === "FAM" && xref) {
        rec = { type: "FAM", id: xref, chilIds: [] };
        families[xref] = rec;
      } else {
        rec = null;
      }
      continue;
    }

    if (!rec) continue;
    if (level === 1) subTag = tag;

    if (rec.type === "INDI") {
      if (tag === "NAME" && level === 1) {
        if (!rec.name) {
          rec.name = value.replace(/\//g, " ").replace(/\s+/g, " ").trim();
        }
      } else if (tag === "SEX" && level === 1) {
        rec.sex = value;
      } else if (tag === "BIRT" && level === 1) {
        rec.birth = rec.birth || {};
      } else if (tag === "DEAT" && level === 1) {
        rec.death = rec.death || {};
      } else if (tag === "DATE" && level === 2) {
        if (subTag === "BIRT") {
          rec.birth = rec.birth || {};
          rec.birth.date = value;
        } else if (subTag === "DEAT") {
          rec.death = rec.death || {};
          rec.death.date = value;
        }
      } else if (tag === "PLAC" && level === 2) {
        if (subTag === "BIRT") {
          rec.birth = rec.birth || {};
          rec.birth.place = value;
        } else if (subTag === "DEAT") {
          rec.death = rec.death || {};
          rec.death.place = value;
        }
      } else if (tag === "OCCU" && level === 1) {
        rec.occupation = value;
      } else if (tag === "NOTE" && level === 1) {
        if (/^@[^@]+@$/.test(value)) {
          const noteId = value.replace(/@/g, "");
          if (notes[noteId]?.note) {
            rec.note = notes[noteId].note;
          } else {
            notes[noteId] = { rec };
          }
        } else {
          const noteResult = parseNote(value, i, lines);
          i = noteResult.i;
          rec.note = noteResult.note;
        }
      }
    } else if (rec.type === "FAM") {
      if (tag === "HUSB" && level === 1) {
        rec.husbId = value.replace(/@/g, "");
      } else if (tag === "WIFE" && level === 1) {
        rec.wifeId = value.replace(/@/g, "");
      } else if (tag === "CHIL" && level === 1) {
        rec.chilIds.push(value.replace(/@/g, ""));
      } else if (tag === "MARR" && level === 1) {
        rec.marr = rec.marr || {};
      } else if (tag === "DATE" && level === 2 && subTag === "MARR") {
        rec.marr = rec.marr || {};
        rec.marr.date = value;
      }
    }
  }

  for (const fam of Object.values(families)) {
    let parentIndividualsFound = false;
    if (fam.husbId) {
      const husb = individuals[fam.husbId];
      if (husb) {
        husb.famsList.push(fam.id);
        parentIndividualsFound = true;
      }
    }
    if (fam.wifeId) {
      const wife = individuals[fam.wifeId];
      if (wife) {
        wife.famsList.push(fam.id);
        parentIndividualsFound = true;
      }
    }

    // Only link children to families if at least one parent is found in individuals
    if (parentIndividualsFound) {
      for (const childId of fam.chilIds) {
        const child = individuals[childId];
        if (child) {
          child.famcList.push(fam.id);
        }
      }
    } else {
      console.warn(`Family with id ${fam.id} has no valid parents in individuals. Skipping linking children to this family.`);
    }
  }

  for (const indi of Object.values(individuals)) {
    indi.famcList = Array.from(new Set((indi.famcList || []).filter((id) => id)));
    indi.famsList = Array.from(new Set((indi.famsList || []).filter((id) => id)));
  }

  return { individuals, families };
}

function gedcomFormatDates(birth, death) {
  const b = birth && birth.date ? birth.date : null;
  const d = death && death.date ? death.date : null;
  if (b && d) return b + " \u2013 " + d;
  if (b) return "b.\u00a0" + b;
  if (d) return "d.\u00a0" + d;
  return "";
}

function getRootIndividuals(individuals, families) {
  const roots = [];
  for (const individual of Object.values(individuals)) {
    const childFamcIds = (individual.famcList || []);
    if (childFamcIds.length > 0) {
      continue;
    }

    const spouseFamIds = (individual.famsList || []);
    let hasAncestor = false;
    for (const famId of spouseFamIds) {
      const fam = families[famId];
      const spouseId = fam.husbId === individual.id ? fam.wifeId : fam.husbId;
      const spouse = individuals[spouseId];
      if (spouse) {
        const spouseFamcIds = (spouse.famcList || []);
        if (spouseFamcIds.length > 0) {
          hasAncestor = true;
          break;
        }
      }
    }

    if (!hasAncestor) {
      roots.push(individual);
    }
  }
  return roots;
}

function getTreeSize(individuals, families, personId, visited = new Set()) {
  if (visited.has(personId)) return 0;
  visited.add(personId);
  const person = individuals[personId];
  if (!person) return 0;

  let size = 1;
  const famIds = (person.famsList || []);
  for (const famId of famIds) {
    const fam = families[famId];
    const spouseId = fam.husbId === personId ? fam.wifeId : fam.husbId;
    if (spouseId) {
      size += 1;
      size += getTreeSize(individuals, families, spouseId, visited);
    }
    for (const childId of fam.chilIds || []) {
      size += getTreeSize(individuals, families, childId, visited);
    }
  }
  return size;
}

export function gedcomToTree(individuals, families) {
  const familyIds = new Set();

  function buildNodeVariants(personId, pathVisited = new Set()) {
    if (!personId) return [];
    const person = individuals[personId];
    if (!person) return [];

    const baseNode = {
      personId,
      name: person.name || "Unknown no name: " + `id: ${person.id || "no id"}`,
    };
    const dates = gedcomFormatDates(person.birth, person.death);
    if (dates) baseNode.dates = dates;
    if (person.occupation) baseNode.occupation = person.occupation;
    if (person.note) baseNode.note = person.note;

    const famIds = (person.famsList || []);
    const variants = [];

    for (let idx = 0; idx < famIds.length; idx++) {
      const famId = famIds[idx];
      const visitKey = `${personId}|${famId}`;
      if (pathVisited.has(visitKey)) {
        continue;
      }

      const fam = families[famId];
      const node = { ...baseNode, familyId: famId };
      if (famIds.length > 1) {
        node.marriageLabel = `Marriage ${idx + 1} of ${famIds.length}`;
      }

      const spouseId = fam.husbId === personId ? fam.wifeId : fam.husbId;
      if (spouseId) {
        const spouse = individuals[spouseId];
        if (spouse) {
          node.spouse = {
            name: spouse.name || "Unknown spouse no name: " + `id: ${spouse.id || "no id"}`,
            personId: spouseId,
            familyId: famId,
          };
          const spouseDates = gedcomFormatDates(spouse.birth, spouse.death);
          if (spouseDates) node.spouse.dates = spouseDates;
          if (spouse.occupation) node.spouse.occupation = spouse.occupation;
          if (spouse.note) node.spouse.note = spouse.note;
        }
      }

      if (familyIds.has(famId)) {
        node.familySkipped = true;
        variants.push(node);
      } else {
        familyIds.add(famId);

        const nextVisited = new Set(pathVisited);
        nextVisited.add(visitKey);
        const children = [];
        for (const childId of fam.chilIds || []) {
          children.push(...buildNodeVariants(childId, nextVisited));
        }
        if (children.length > 0) node.children = children;

        variants.push(node);
      }
    }

    return variants.length > 0 ? variants : [baseNode];
  }

  const roots = getRootIndividuals(individuals, families);
  roots.sort((a, b) => {
    const aTreeSize = getTreeSize(individuals, families, a.id, new Set());
    const bTreeSize = getTreeSize(individuals, families, b.id, new Set());
    return bTreeSize - aTreeSize;
  });

  const trees = [];
  const rootFamilyIds = new Set();
  for (const root of roots) {
    familyIds.clear();

    const familyNodes = buildNodeVariants(root.id);
    for (const familyNode of familyNodes) {
      if (familyNode.familyId) {
        if (rootFamilyIds.has(familyNode.familyId)) {
          continue;
        }
        rootFamilyIds.add(familyNode.familyId);
      }
      trees.push(familyNode);
    }
  }

  return trees;
}

export function getRootFamilyIdsForIndividual(personId, individuals, families, cache = {}, visited = new Set()) {
  if (cache[personId]) {
    return cache[personId];
  }

  const rootFamilyIds = new Set();
  if (visited.has(personId)) return [];
  visited.add(personId);

  const person = individuals[personId];
  if (!person) {
    console.warn(`Person with id ${personId} not found in individuals.`);
    return [];
  }

  const famcList = (person.famcList || []);
  // child with no parent: its famsList are root families
  if (famcList.length === 0) {
    (person.famsList || [])
      .forEach((familyId) => rootFamilyIds.add(familyId));
    const result = Array.from(rootFamilyIds);
    cache[personId] = result;
    return result;
  }

  for (const famId of famcList) {
    const fam = families[famId];
    const parentIds = [fam.husbId, fam.wifeId].filter((id) => id);
    for (const parentId of parentIds) {
      const parentRootFamilyIds = getRootFamilyIdsForIndividual(parentId, individuals, families, cache, visited);
      parentRootFamilyIds.forEach((id) => rootFamilyIds.add(id));
    }
  }

  const result = Array.from(rootFamilyIds);
  cache[personId] = result;
  return result;
}

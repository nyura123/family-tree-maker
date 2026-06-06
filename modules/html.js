function toHtmlString(value) {
  if (value === null || value === undefined || value === false) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map(toHtmlString).join("");
  }
  return String(value);
}

export function html(strings, ...values) {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += toHtmlString(values[i]);
    }
  }
  return result;
}

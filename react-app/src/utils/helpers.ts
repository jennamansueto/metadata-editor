// Port of global mixin methods from index_vuetify_main_app.php lines 7-134

/**
 * Replace dots with dashes in a class ID string
 */
export function normalizeClassID(classId: string): string {
  return classId.replace(/\./g, '-');
}

/**
 * Recursively convert a nested array/object structure to a flat string
 */
export function nestedArrayToStringValue(
  arr: unknown,
  output = ''
): string {
  if (Array.isArray(arr)) {
    arr.forEach((item) => {
      output = nestedArrayToStringValue(item, output);
    });
  } else if (typeof arr === 'object' && arr !== null) {
    const obj = arr as Record<string, unknown>;
    const keys = Object.keys(obj);
    keys.forEach((key) => {
      if (typeof obj[key] === 'object') {
        output = nestedArrayToStringValue(obj[key], output);
      } else {
        output += ' ' + String(obj[key]);
      }
    });
  }
  return output.trim();
}

/**
 * Copy text to clipboard
 */
export function copyToClipBoard(textToCopy: string): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(textToCopy);
    return;
  }
  // Fallback for older browsers
  const tmpTextField = document.createElement('textarea');
  tmpTextField.textContent = textToCopy;
  tmpTextField.setAttribute('style', 'position:absolute; right:200%;');
  document.body.appendChild(tmpTextField);
  tmpTextField.select();
  tmpTextField.setSelectionRange(0, 99999);
  document.execCommand('copy');
  tmpTextField.remove();
}

/**
 * Paste text from clipboard
 */
export async function pasteFromClipBoard(): Promise<string> {
  const text = await navigator.clipboard.readText();
  return text;
}

/**
 * Parse CSV string to a 2D array
 * Source: https://gist.github.com/bennadel/9753411
 */
export function CSVToArray(
  strData: string,
  strDelimiter?: string
): string[][] {
  strDelimiter = strDelimiter || ',';

  const objPattern = new RegExp(
    '(\\' +
      strDelimiter +
      '|\\r?\\n|\\r|^)' +
      '(?:"([^"]*(?:""[^"]*)*)"|' +
      '([^"\\' +
      strDelimiter +
      '\\r\\n]*))',
    'gi'
  );

  const arrData: string[][] = [[]];
  let arrMatches: RegExpExecArray | null = null;

  while ((arrMatches = objPattern.exec(strData))) {
    const strMatchedDelimiter = arrMatches[1];
    if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
      arrData.push([]);
    }

    let strMatchedValue: string;
    if (arrMatches[2]) {
      strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
    } else {
      strMatchedValue = arrMatches[3];
    }

    arrData[arrData.length - 1].push(strMatchedValue);
  }

  return arrData;
}

/**
 * Determine the display type of a form field
 * Port from vue-form-component.js fieldDisplayType method
 */
export function fieldDisplayType(field: {
  display_type?: string;
  type?: string;
}): string {
  if (field.display_type) {
    return field.display_type;
  }

  if (['text', 'string', 'boolean'].includes(field.type || '')) {
    return 'text';
  }

  if (['integer', 'number'].includes(field.type || '')) {
    return 'number';
  }

  return field.type || 'text';
}

/**
 * Find a template item by key in a nested items array
 * Port from Vuex getter getTemplateItemByKey
 */
/**
 * Recursively remove empty values from an object before saving.
 * Port of removeEmpty from index_vuetify.php lines 1340-1358.
 * Strips: empty strings, null, empty arrays, [{}}], [[]]
 */
export function removeEmpty(obj: unknown): void {
  try {
    if (typeof obj === 'string') return;
    if (!obj || typeof obj !== 'object') return;

    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const value = record[key];
      if (value === '' || value === null || value === undefined) {
        delete record[key];
      } else if (Array.isArray(value) && value.length === 0) {
        delete record[key];
      } else if (JSON.stringify(value) === '[{}]' || JSON.stringify(value) === '[[]]') {
        delete record[key];
      } else if (Object.prototype.toString.call(value) === '[object Object]') {
        removeEmpty(value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => removeEmpty(v));
      }
    }
  } catch (error) {
    console.error(error);
  }
}

export function findTemplateItemByKey(
  items: Array<{ key?: string; items?: unknown[] }>,
  key: string
): unknown | null {
  for (const item of items) {
    if (item.key === key) {
      return item;
    }
    if (item.items && Array.isArray(item.items)) {
      const found = findTemplateItemByKey(
        item.items as Array<{ key?: string; items?: unknown[] }>,
        key
      );
      if (found) return found;
    }
  }
  return null;
}

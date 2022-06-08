import { Editor, EditorPosition, parseYaml, stringifyYaml } from "obsidian";

export const yamlRegex = /^---\n(?:((?:.|\n)*?)\n)?---(?=\n|$)/;

// Exchange item position in array
export function itemMove<T>(arr: T[], itemIdx1: number, itemIdx2: number): void {
  [arr[itemIdx1], arr[itemIdx2]] = [arr[itemIdx2], arr[itemIdx1]];
}

// Add item in specific position
export function itemAdd<T>(arr: T[], itemIdx: number, item: T): void {
  arr.splice(itemIdx, 0, item)
}

// Delete specific item in array
export function itemDelete<T>(arr: T[], itemIndex: number): void {
  arr.splice(itemIndex, 1);
}

// Get yaml section
function getYaml(editor: Editor): string {
  const matchResult = editor.getValue().match(yamlRegex);
  
  return matchResult?.[0] ?? '';
} 

function generateActionKeyword(key: string, value: string, editor: Editor, action: 'replace' | 'insert' | 'remove') {
  const yaml = getYaml(editor);
  const objectYaml = yaml && parseYaml(yaml.slice(4, -4)) || {};

  const startPosition: EditorPosition = {line: 0, ch: 0};
  const endPosition: EditorPosition = editor.offsetToPos(yaml.length);

  if (!yaml) {
    if (action === 'replace') objectYaml[key] = value;
    if (action === 'insert') objectYaml[key] = [value];
  }

  if (yaml && objectYaml) {
    if (action === 'replace') objectYaml[key] = value;
    if (action === 'insert') objectYaml[key].push(value);
    if (action === 'remove') objectYaml[key] = objectYaml[key].filter((val: string) => val !== value);
  }

  const replacement = `---\n${stringifyYaml(objectYaml)}---`;

  return {replacement, startPosition, endPosition}
}

export function replace(key: string, value: string, editor: Editor): void {
  const {replacement, startPosition, endPosition} = generateActionKeyword(key, value, editor, 'replace');

  editor.replaceRange(replacement, startPosition, endPosition)
}

export function insert(key: string, value: string, editor: Editor): void {
  const {replacement, startPosition, endPosition} = generateActionKeyword(key, value, editor, 'insert');

  editor.replaceRange(replacement, startPosition, endPosition)
}

export function remove(key: string, value: string, editor: Editor): void {
  const {replacement, startPosition, endPosition} = generateActionKeyword(key, value, editor, 'remove');

  editor.replaceRange(replacement, startPosition, endPosition)
}

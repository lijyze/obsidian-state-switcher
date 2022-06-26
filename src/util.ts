import { Editor, EditorPosition, parseYaml, stringifyYaml } from "obsidian";

export const YAML_REGEX = /^---\n(?:((?:.|\n)*?)\n)?---(?=\n|$)/;

type CommonUpdateParam = {
  editor: Editor;
  key: string;
  value: string;
  action: 'replace' | 'insert' | 'remove';
}

type BulkUpdateParam = {
  editor: Editor;
  updateDatas: Record<string, unknown>;
  removeDatas: string[];
  action: 'bulk'
}

// Get objectify yaml of current file
export function getObjectYaml(editor: Editor) {
  const stringYaml = getYaml(editor);

  return stringYaml? parseYaml(stringYaml.slice(4, -4)): {}
}

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
  const matchResult = editor.getValue().match(YAML_REGEX);
  
  return matchResult?.[0] ?? '';
} 

function generateActionKeyword(data: CommonUpdateParam | BulkUpdateParam) {
  const {editor, action} = data;
  const yaml = getYaml(editor);
  const objectYaml = getObjectYaml(editor);

  const startPosition: EditorPosition = {line: 0, ch: 0};
  const endPosition: EditorPosition = editor.offsetToPos(yaml.length);

  if (!yaml) {
    if (action === 'replace') objectYaml[data.key] = data.value;
    if (action === 'insert') objectYaml[data.key] = [data.value];
    if (action === 'bulk') {
      Object.entries(data.updateDatas).forEach(([key, value]) => objectYaml[key] = value);
    }
  } else {
    if (action === 'replace') objectYaml[data.key] = data.value;
    if (action === 'insert') objectYaml[data.key] = objectYaml[data.key]? [...objectYaml[data.key], data.value]: [data.value];
    if (action === 'remove' && objectYaml[data.key]) {
      const newValue = objectYaml[data.key].filter((val: string) => val !== data.value);
      newValue.length? objectYaml[data.key] = newValue: delete objectYaml[data.key];
    }
    if (action === 'bulk') {
      data.removeDatas.forEach((key) => delete objectYaml[key])
      Object.entries(data.updateDatas).forEach(([key, value]) => objectYaml[key] = value);
    }
  }

  const replacement = `---\n${stringifyYaml(objectYaml)}---`;

  return {replacement, startPosition, endPosition}
}

function flatYamlFields(yaml: string, flatFields: string[]): string {
  const objectYaml = parseYaml(yaml.slice(4, -4));

  return flatFields.reduce((res, key) => {
    const YAML_FIELD_REGEX = new RegExp(`(${key}:).+?(?=\\n\\S|$)`, 'gs');

    return yaml.replace(YAML_FIELD_REGEX, `$1 [${objectYaml[key].join(', ')}]`)
  }, yaml)
}

export function replace(key: string, value: string, editor: Editor): void {
  const {replacement, startPosition, endPosition} = generateActionKeyword({key, value, editor, action: 'replace'});

  editor.replaceRange(replacement, startPosition, endPosition)
}

export function insert(key: string, value: string, flat: boolean, editor: Editor): void {
  const {replacement, startPosition, endPosition} = generateActionKeyword({key, value, editor, action: 'insert'});

  const postProcessedReplacement = flat? flatYamlFields(replacement, [key]): replacement;

  editor.replaceRange(postProcessedReplacement, startPosition, endPosition)
}

export function remove(key: string, value: string, flat: boolean, editor: Editor): void {
  const {replacement, startPosition, endPosition} = generateActionKeyword({key, value, editor, action: 'remove'});

  const postProcessedReplacement = flat? flatYamlFields(replacement, [key]): replacement;

  editor.replaceRange(postProcessedReplacement, startPosition, endPosition)
}

export function bulkUpdate(updateDatas: Record<string, unknown>, removeDatas: string[], flatFields: string[], editor: Editor): void {
  const {replacement, startPosition, endPosition} = generateActionKeyword({updateDatas, removeDatas, editor, action: 'bulk'});
  
  const flattedReplacement = flatYamlFields(replacement, flatFields);

  editor.replaceRange(flattedReplacement, startPosition, endPosition);
}

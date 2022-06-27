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
  const yamlSection = getYaml(editor);
  const yaml = yamlSection.slice(4, -3);
  const objectYaml = getObjectYaml(editor);
  const objectSnippet: Record<string, unknown> = {};

  if (action === 'replace') objectSnippet[data.key] = data.value;

  if (action === 'insert') objectSnippet[data.key] = objectYaml[data.key]? [...objectYaml[data.key], data.value]: [data.value];

  if (action === 'remove') {
    const newValue = objectYaml[data.key].filter((val: string) => val !== data.value);
    objectSnippet[data.key] = newValue.length? newValue: null;
  }

  if (action === 'bulk') {
    Object.entries(data.updateDatas).forEach(([key, value]) => objectSnippet[key] = value );
    data.removeDatas.forEach((key) => objectSnippet[key] = null)
  }

  const replacement = `---\n${generateReplacement(yaml, objectSnippet)}---`;
  const startPosition: EditorPosition = {line: 0, ch: 0};
  const endPosition: EditorPosition = editor.offsetToPos(yamlSection.length);

  return {replacement, startPosition, endPosition}
}

function generateReplacement(yaml: string, snippet: Record<string, unknown>) {
  return Object.entries(snippet).reduce((res, [key, value]) => {
    const YAML_FIELD_REGEX = new RegExp(`(${key} *:).+?\\n(?=\\S|$)`, 'gs');
  
    const replacement = (value === null)? '': stringifyYaml({[key]: value});
  
    return yaml.match(YAML_FIELD_REGEX)? yaml.replace(YAML_FIELD_REGEX, replacement): `${yaml}${replacement}`;
  }, yaml)
}

function flatYamlFields(yaml: string, flatFields: string[]): string {
  const objectYaml = parseYaml(yaml.slice(4, -4));

  return flatFields.reduce((res, key) => {
    const YAML_FIELD_REGEX = new RegExp(`(${key}:).+?(?=\\n\\S|$)`, 'gs');

    return yaml.match(YAML_FIELD_REGEX)? yaml.replace(YAML_FIELD_REGEX, `$1 [${objectYaml[key].join(', ')}]`): yaml;
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

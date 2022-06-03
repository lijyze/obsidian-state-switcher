import { Editor, EditorPosition } from "obsidian";

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

function generateAncherRegex(ancher: string): RegExp {
  return new RegExp(` *(?:-\\s+)?${ancher}(?:\\s*:.+?\\n)`);
}

// Get offset of value
function getValueOffset(str: string): number {
  const matchRes = str.match(/\w+/g);
  if (matchRes.length >= 2) return str.indexOf(matchRes[1]);

  return str.match(/:/).index + 2;
}

// Get last yaml line
function getInsertLine(yaml: string): number {
  const lines = yaml.split('\n');
  const nonEmptyRegex = /\S/;
  
  for (let i = lines.lastIndexOf('---') - 1; i >= 0; i--) {
    if (lines[i].match(nonEmptyRegex)) return i + 1;
  }
}

export function replace(key: string, value: string, editor: Editor): void {
  const yaml = editor.getValue().match(yamlRegex);
  let replacement: string;
  let startPosition: EditorPosition;
  let endPosition: EditorPosition;

  if (!yaml)  {
    replacement = 
      '---\n' + 
      `${key}: ${value}\n` + 
      '---\n';
    
    startPosition = {line: 0, ch: 0}
    endPosition = {line: 0, ch: 0}
  } else {
    const targetLine = yaml[0].match(generateAncherRegex(key));
    
    if (targetLine) {
      const valueOffset = getValueOffset(targetLine[0]);
  
      replacement = value;
      startPosition = editor.offsetToPos(targetLine.index + valueOffset);
      endPosition = {line: startPosition.line, ch: Infinity}
    } else {
      const appendLineNum = getInsertLine(yaml[0]);

      replacement = `${key}: ${value}\n`;
      startPosition = {line: appendLineNum, ch: 0}
      endPosition = {line: appendLineNum, ch: 0}
    }
  }


  editor.replaceRange(replacement, startPosition, endPosition)
}
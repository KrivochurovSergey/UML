// @ts-expect-error no types for plantuml-encoder
import plantumlEncoder from 'plantuml-encoder';
import type { DiagramStyle } from '../types/style';

const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';

/** Emit a skinparam line only when the value is a non-empty string */
function color(name: string, value: string, indent = '  '): string {
  return value?.trim() ? `${indent}${name} ${value.trim()}` : '';
}

function buildSkinparams(style: DiagramStyle): string {
  const rawLines: string[] = [];

  // defaultFontName/Size must be top-level declarations — they don't work inside a skinparam {} block
  if (style.fontName) rawLines.push(`skinparam defaultFontName ${style.fontName}`);
  if (style.fontSize != null) rawLines.push(`skinparam defaultFontSize ${style.fontSize}`);
  rawLines.push(color('skinparam defaultFontColor', style.textColor, ''));
  rawLines.push('skinparam Shadowing false');

  rawLines.push('skinparam {');
  rawLines.push(color('BackgroundColor', style.backgroundColor));
  rawLines.push(color('ArrowColor', style.lineColor));
  rawLines.push(color('BorderColor', style.lineColor));
  if (style.roundCorner != null) rawLines.push(`  RoundCorner ${style.roundCorner}`);

  // Participants / entities
  const entityTypes = [
    'Actor', 'Participant', 'Boundary', 'Control',
    'Entity', 'Database', 'Collections', 'Queue',
    'Class', 'Component', 'Usecase', 'Node', 'Object',
  ];
  entityTypes.forEach((t) => {
    rawLines.push(color(`${t}BackgroundColor`, style.primaryColor));
    rawLines.push(color(`${t}BorderColor`, style.lineColor));
  });

  // Notes
  rawLines.push(color('NoteBackgroundColor', style.noteColor));
  rawLines.push(color('NoteBorderColor', style.lineColor));

  // Sequence lifelines
  rawLines.push(color('SequenceLifeLineBorderColor', style.lineColor));

  // Groups (alt / opt / loop / par …)
  rawLines.push(color('SequenceGroupBackgroundColor', style.tertiaryColor));
  rawLines.push(color('SequenceGroupBorderColor', style.lineColor));

  // Boxes (box … end box participant grouping)
  rawLines.push(color('SequenceBoxBackgroundColor', style.boxColor));
  rawLines.push(color('SequenceBoxBorderColor', style.lineColor));
  rawLines.push(color('BoxFontColor', style.boxTitleColor));

  // Dividers (== text ==)
  rawLines.push(color('SequenceDividerBackgroundColor', style.dividerColor));
  rawLines.push(color('SequenceDividerBorderColor', style.lineColor));
  rawLines.push(color('SequenceDividerFontColor', style.textColor));

  // Font name + style per element type
  const participantTypes = ['Actor', 'Participant', 'Boundary', 'Control', 'Entity', 'Database', 'Collections', 'Queue'];
  participantTypes.forEach((t) => {
    if (style.participantFontName) rawLines.push(`  ${t}FontName ${style.participantFontName}`);
    if (style.participantFontStyle) rawLines.push(`  ${t}FontStyle ${style.participantFontStyle}`);
  });
  if (style.messageFontName) rawLines.push(`  SequenceMessageFontName ${style.messageFontName}`);
  if (style.messageFontStyle) rawLines.push(`  SequenceMessageFontStyle ${style.messageFontStyle}`);
  if (style.noteFontName) rawLines.push(`  NoteFontName ${style.noteFontName}`);
  if (style.noteFontStyle) rawLines.push(`  NoteFontStyle ${style.noteFontStyle}`);
  if (style.titleFontName) rawLines.push(`  TitleFontName ${style.titleFontName}`);
  if (style.titleFontStyle) rawLines.push(`  TitleFontStyle ${style.titleFontStyle}`);
  if (style.titleFontName) rawLines.push(`  SequenceBoxFontName ${style.titleFontName}`);
  if (style.titleFontStyle) rawLines.push(`  SequenceBoxFontStyle ${style.titleFontStyle}`);
  if (style.titleFontName) rawLines.push(`  SequenceDividerFontName ${style.titleFontName}`);
  if (style.titleFontStyle) rawLines.push(`  SequenceDividerFontStyle ${style.titleFontStyle}`);
  rawLines.push('}');

  // Drop empty lines produced by color() when value was blank
  return rawLines.filter((l) => l !== '').join('\n');
}

export function injectStyle(umlSource: string, style: DiagramStyle): string {
  const skinparams = buildSkinparams(style);

  const startIdx = umlSource.toLowerCase().indexOf('@start');
  if (startIdx === -1) {
    return `@startuml\n${skinparams}\n${umlSource}\n@enduml`;
  }

  const newlineIdx = umlSource.indexOf('\n', startIdx);
  if (newlineIdx === -1) {
    return umlSource + '\n' + skinparams;
  }

  return umlSource.slice(0, newlineIdx + 1) + skinparams + '\n' + umlSource.slice(newlineIdx + 1);
}

export function encodeUml(umlSource: string): string {
  return plantumlEncoder.encode(umlSource);
}

export function getSvgUrl(encoded: string): string {
  return `${PLANTUML_SERVER}/svg/${encoded}`;
}

export function getPngUrl(encoded: string): string {
  return `${PLANTUML_SERVER}/png/${encoded}`;
}

export async function fetchSvg(encoded: string): Promise<string> {
  const url = getSvgUrl(encoded);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PlantUML server error: ${res.status}`);
  return res.text();
}

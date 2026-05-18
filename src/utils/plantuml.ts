// @ts-expect-error no types for plantuml-encoder
import plantumlEncoder from 'plantuml-encoder';
import type { DiagramStyle } from '../types/style';

const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';

const HEX_RE = /^#[0-9a-f]{6}$/i;

/** Emit a skinparam line only for valid, complete hex colors — always lowercase */
function color(name: string, value: string, indent = '  '): string {
  const v = value?.trim();
  if (!v || !HEX_RE.test(v)) return '';
  return `${indent}${name} ${v.toLowerCase()}`;
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
  if (style.roundCorner != null) rawLines.push(`  RoundCorner ${style.roundCorner}`);

  // Participants / entities — boxed (rectangular border)
  const boxedTypes = ['Actor', 'Participant', 'Collections', 'Queue', 'Class', 'Component', 'Usecase', 'Node', 'Object'];
  // Shapeless (Boundary=circle+line, Control=circle+arrow, Entity=circle, Database=cylinder)
  const shapeTypes = ['Boundary', 'Control', 'Entity', 'Database'];
  const entityBorder = style.entityBorderColor || style.lineColor;
  const shapeTextColor = style.shapeTextColor || style.participantTextColor;

  boxedTypes.forEach((t) => {
    rawLines.push(color(`${t}BackgroundColor`, style.primaryColor));
    rawLines.push(color(`${t}BorderColor`, entityBorder));
    rawLines.push(color(`${t}FontColor`, style.participantTextColor));
  });
  shapeTypes.forEach((t) => {
    rawLines.push(color(`${t}BackgroundColor`, style.primaryColor));
    rawLines.push(color(`${t}BorderColor`, entityBorder));
    rawLines.push(color(`${t}FontColor`, shapeTextColor));
  });

  // Notes
  rawLines.push(color('NoteBackgroundColor', style.noteColor));
  rawLines.push(color('NoteBorderColor', style.lineColor));

  // Sequence lifelines
  rawLines.push(color('SequenceLifeLineBorderColor', style.lineColor));

  // Groups (alt / opt / loop / par …) + Ref (same palette)
  rawLines.push(color('SequenceGroupBackgroundColor', style.tertiaryColor));
  rawLines.push(color('SequenceGroupBorderColor', style.lineColor));
  rawLines.push(color('SequenceReferenceBackgroundColor', style.backgroundColor));
  rawLines.push(color('SequenceReferenceHeaderBackgroundColor', style.tertiaryColor));
  rawLines.push(color('SequenceReferenceBorderColor', style.lineColor));
  rawLines.push(color('SequenceReferenceFontColor', style.textColor));

  // Boxes (box … end box participant grouping)
  rawLines.push(color('SequenceBoxBackgroundColor', style.boxColor));
  rawLines.push(color('SequenceBoxBorderColor', style.boxBorderColor || style.lineColor));
  rawLines.push(color('SequenceBoxFontColor', style.boxTitleColor));

  // Dividers (== text ==)
  rawLines.push(color('SequenceDividerBackgroundColor', style.dividerColor));
  rawLines.push(color('SequenceDividerBorderColor', style.lineColor));
  rawLines.push(color('SequenceDividerFontColor', style.textColor));

  // Font name + style per element type
  const participantTypes = ['Actor', 'Participant', 'Boundary', 'Control', 'Entity', 'Database', 'Collections', 'Queue'];
  participantTypes.forEach((t) => {
    if (style.participantFontName) rawLines.push(`  ${t}FontName ${style.participantFontName}`);
  });
  if (style.messageFontName) rawLines.push(`  SequenceMessageFontName ${style.messageFontName}`);
  if (style.noteFontName) rawLines.push(`  NoteFontName ${style.noteFontName}`);
  if (style.titleFontName) rawLines.push(`  TitleFontName ${style.titleFontName}`);
  if (style.titleFontName) rawLines.push(`  SequenceBoxFontName ${style.titleFontName}`);
  if (style.titleFontName) rawLines.push(`  SequenceDividerFontName ${style.titleFontName}`);
  rawLines.push('}');

  // Drop empty lines produced by color() when value was blank
  return rawLines.filter((l) => l !== '').join('\n');
}

function buildStyleBlock(style: DiagramStyle): string {
  const lines: string[] = ['<style>'];
  lines.push(`lifeLine { LineThickness ${style.lifelineThickness} }`);
  lines.push('</style>');
  return lines.join('\n');
}

export function injectStyle(umlSource: string, style: DiagramStyle): string {
  const skinparams = buildSkinparams(style);
  const styleBlock = buildStyleBlock(style);
  const injection = styleBlock + '\n' + skinparams;

  const startIdx = umlSource.toLowerCase().indexOf('@start');
  if (startIdx === -1) {
    return `@startuml\n${injection}\n${umlSource}\n@enduml`;
  }

  const newlineIdx = umlSource.indexOf('\n', startIdx);
  if (newlineIdx === -1) {
    return umlSource + '\n' + injection;
  }

  return umlSource.slice(0, newlineIdx + 1) + injection + '\n' + umlSource.slice(newlineIdx + 1);
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

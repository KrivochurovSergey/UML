export interface CustomIcon {
  fileName: string;
  dataUrl: string;
}

export type EntityType =
  | 'actor'
  | 'participant'
  | 'boundary'
  | 'control'
  | 'entity'
  | 'database'
  | 'collections'
  | 'queue';

export type EntityIcons = Partial<Record<EntityType, CustomIcon>>;

export const ENTITY_LABELS: Record<EntityType, string> = {
  actor:       'Actor',
  participant: 'Participant',
  boundary:    'Boundary',
  control:     'Control',
  entity:      'Entity',
  database:    'Database',
  collections: 'Collections',
  queue:       'Queue',
};

export const ALL_ENTITY_TYPES: EntityType[] = [
  'actor', 'participant', 'boundary', 'control',
  'entity', 'database', 'collections', 'queue',
];

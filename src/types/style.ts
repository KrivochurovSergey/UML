export interface DiagramStyle {
  id: string;
  name: string;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  lineColor: string;
  entityBorderColor: string;
  textColor: string;
  participantTextColor: string;
  shapeTextColor: string;
  noteColor: string;
  boxColor: string;
  boxTitleColor: string;
  boxBorderColor: string;
  dividerColor: string;
  fontName: string;
  fontSize: number;
  participantFontName: string;
  messageFontName: string;
  noteFontName: string;
  titleFontName: string;
  borderThickness: number;
  roundCorner: number;
  lifelineThickness: number;
  arrowSolidThickness: number;
  arrowDashedThickness: number;
  diagramType: 'default' | 'sequence' | 'class' | 'component' | 'usecase' | 'activity';
}

export const DEFAULT_STYLE: DiagramStyle = {
  id: 'default',
  name: 'По умолчанию',
  backgroundColor: '#FFFFFF',
  primaryColor: '#FEFECE',
  secondaryColor: '#FFFFDF',
  tertiaryColor: '#FBFB77',
  lineColor: '#A80036',
  entityBorderColor: '',
  textColor: '#000000',
  participantTextColor: '',
  shapeTextColor: '',
  noteColor: '#FFFFCC',
  boxColor: '#DDDDDD',
  boxTitleColor: '#000000',
  boxBorderColor: '',
  dividerColor: '#EEEEEE',
  fontName: 'Arial',
  fontSize: 14,
  participantFontName: '',
  messageFontName: '',
  noteFontName: '',
  titleFontName: '',
  borderThickness: 0.5,
  roundCorner: 5,
  lifelineThickness: 0.5,
  arrowSolidThickness: 1,
  arrowDashedThickness: 1,
  diagramType: 'default',
};

export const STYLE_PRESETS: DiagramStyle[] = [
  {
    ...DEFAULT_STYLE,
    id: 'default',
    name: 'Classic',
  },
  {
    ...DEFAULT_STYLE,
    id: 'rmr-1',
    name: 'RedMadRobot_1',
    backgroundColor: '#ffffff',
    primaryColor: '#ffffff',
    secondaryColor: '#d6d6d6',
    tertiaryColor: '#ffffff',
    lineColor: '#ff0000',
    noteColor: '#d0dbd7',
    boxColor: '#d6d6d6',
    boxBorderColor: '#000000',
    dividerColor: '#ffffff',
    fontName: 'CoFo Redmadrobot Regular',
    fontSize: 12,
    borderThickness: 1.5,
    roundCorner: 2,
  },
  {
    ...DEFAULT_STYLE,
    id: 'rmr-2',
    name: 'RedMadRobot_2',
    backgroundColor: '#ffffff',
    primaryColor: '#d6d6d6',
    secondaryColor: '#d6d6d6',
    tertiaryColor: '#d0dbd7',
    lineColor: '#ff0000',
    entityBorderColor: '#807f80',
    noteColor: '#d0dbd7',
    boxColor: '#d6d6d6',
    boxBorderColor: '#807f80',
    dividerColor: '#ffffff',
    fontName: 'CoFo Redmadrobot Regular',
    fontSize: 12,
    borderThickness: 1.5,
    roundCorner: 2,
  },
  {
    ...DEFAULT_STYLE,
    id: 'rmr-3',
    name: 'RedMadRobot_3',
    backgroundColor: '#ffffff',
    primaryColor: '#d6d6d6',
    secondaryColor: '#d6d6d6',
    tertiaryColor: '#d0dbd7',
    lineColor: '#807f80',
    textColor: '#ff0000',
    participantTextColor: '#000000',
    noteColor: '#d0dbd7',
    boxColor: '#d6d6d6',
    dividerColor: '#ffffff',
    fontSize: 12,
    borderThickness: 1.5,
    roundCorner: 2,
  },
  {
    ...DEFAULT_STYLE,
    id: 'rmr-4',
    name: 'RedMadRobot_4',
    backgroundColor: '#ffffff',
    primaryColor: '#06163e',
    secondaryColor: '#d6d6d6',
    tertiaryColor: '#ff0000',
    lineColor: '#ff0000',
    entityBorderColor: '#06163e',
    textColor: '#06163e',
    participantTextColor: '#ffffff',
    shapeTextColor: '#06163e',
    noteColor: '#ffffff',
    boxColor: '#06163e',
    boxTitleColor: '#ff0000',
    boxBorderColor: '#807f80',
    dividerColor: '#ffffff',
    fontName: 'CoFo Redmadrobot Regular',
    fontSize: 12,
    borderThickness: 1.5,
    roundCorner: 2,
  },
];

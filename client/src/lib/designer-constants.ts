// Designer Constants and Utilities

export const DESIGNER_TOOLS = {
  SELECT: 'select',
  TEXT: 'text',
  SHAPE: 'shape',
  IMAGE: 'image',
} as const;

export const CANVAS_PRESETS = [
  { id: 'business-card', name: 'Business Card', width: 350, height: 200, description: 'Standard business card size' },
  { id: 'flyer', name: 'Flyer', width: 300, height: 400, description: 'Portrait flyer layout' },
  { id: 'poster', name: 'Poster', width: 350, height: 500, description: 'Large format poster' },
  { id: 'banner', name: 'Banner', width: 500, height: 200, description: 'Horizontal banner' },
  { id: 'a4', name: 'A4 Paper', width: 400, height: 565, description: 'Standard A4 paper ratio' },
  { id: 'a3', name: 'A3 Paper', width: 565, height: 400, description: 'Large A3 paper ratio' },
  { id: 'custom', name: 'Custom', width: 0, height: 0, description: 'Set your own dimensions' }
] as const;

export const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Comic Sans MS',
  'Impact',
  'Lucida Console'
] as const;

export const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
  '#ffc0cb', '#a52a2a', '#808080', '#000080', '#008000'
] as const;

export const DEFAULT_CANVAS_SETTINGS = {
  width: 400,
  height: 240,
  backgroundColor: '#ffffff',
  fontSize: 16,
  selectedFont: 'Inter',
  colors: ['#3B82F6', '#8B5CF6', '#F97316'],
} as const;

export const CANVAS_SIZE_LIMITS = {
  minWidth: 200,
  minHeight: 200,
  maxWidth: 1200,
  maxHeight: 1200,
} as const;

export const KEYBOARD_SHORTCUTS = {
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  ADD_TEXT: 'Ctrl+T',
  DUPLICATE: 'Ctrl+D',
  FIX_INTERACTIVITY: 'Ctrl+I',
  DELETE: 'Delete',
  ZOOM_IN: 'Ctrl+=',
  ZOOM_OUT: 'Ctrl+-',
  RESET_ZOOM: 'Ctrl+0',
  MOVE_UP: '↑',
  MOVE_DOWN: '↓',
  MOVE_LEFT: '←',
  MOVE_RIGHT: '→',
  MOVE_UP_LARGE: 'Shift+↑',
  MOVE_DOWN_LARGE: 'Shift+↓',
  MOVE_LEFT_LARGE: 'Shift+←',
  MOVE_RIGHT_LARGE: 'Shift+→',
} as const;

// Utility functions
export const getCanvasPreset = (presetId: string) => {
  return CANVAS_PRESETS.find(preset => preset.id === presetId);
};

export const validateCanvasSize = (width: number, height: number): boolean => {
  return width >= CANVAS_SIZE_LIMITS.minWidth &&
         height >= CANVAS_SIZE_LIMITS.minHeight &&
         width <= CANVAS_SIZE_LIMITS.maxWidth &&
         height <= CANVAS_SIZE_LIMITS.maxHeight;
};

export const clampCanvasSize = (width: number, height: number) => {
  return {
    width: Math.max(CANVAS_SIZE_LIMITS.minWidth, Math.min(width, CANVAS_SIZE_LIMITS.maxWidth)),
    height: Math.max(CANVAS_SIZE_LIMITS.minHeight, Math.min(height, CANVAS_SIZE_LIMITS.maxHeight)),
  };
};

export const formatCanvasSize = (width: number, height: number): string => {
  return `${width} × ${height}px`;
};

export const getAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

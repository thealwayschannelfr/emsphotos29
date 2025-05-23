export interface FileData {
  file: File;
  name: string;
  preview: string;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  zoom?: number;
}

export interface ProcessedImage {
  dataUrl: string;
  name: string;
  leftPhoto: string;
  rightPhoto: string;
  displayName?: string;
  textOptions?: TextOptions;
}

export interface TextOptions {
  enabled: boolean;
  text: string;
  font: string;
  size: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface CropperState {
  crop: { x: number; y: number };
  zoom: number;
}
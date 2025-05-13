import * as THREE from 'three';

export const DEFAULT_TEXTURE_SETTINGS = {
  wrapS: THREE.RepeatWrapping,
  wrapT: THREE.RepeatWrapping,
  anisotropy: 8,
  colorSpace: THREE.SRGBColorSpace,
  minFilter: THREE.LinearMipMapLinearFilter,
  magFilter: THREE.LinearFilter,
  generateMipmaps: true,
};

export const LOD_LEVELS = {
  ultra: { segments: 256, distance: 20, quality: '8k' },
  high: { segments: 128, distance: 40, quality: '4k' },
  medium: { segments: 64, distance: 60, quality: '2k' },
  low: { segments: 32, distance: 80, quality: '1k' },
};

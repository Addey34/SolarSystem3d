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
  high: { segments: 128, distance: 5, quality: '8k' },
  medium: { segments: 64, distance: 10, quality: '4k' },
  low: { segments: 32, distance: 20, quality: '2k' },
  basic: { segments: 16, distance: 40, quality: '1k' },
};

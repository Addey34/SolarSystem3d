import * as THREE from 'three';
import { DEFAULT_TEXTURE_SETTINGS, LOD_LEVELS } from './constants.js';

export const RENDER_SETTINGS = {
  antialias: true,
  shadowMap: {
    enabled: true,
    type: THREE.PCFSoftShadowMap,
    width: 2048,
    height: 2048,
  },
  toneMapping: THREE.ACESFilmicToneMapping,
  physicallyCorrectLights: true,
  maxPixelRatio: 1,
};

export const CAMERA_SETTINGS = {
  fov: 75,
  near: 0.1,
  far: 3000,
  initialPosition: new THREE.Vector3(0, 50, 500),
};

export const LIGHTING_SETTINGS = {
  ambient: {
    color: 0xfff4e6,
    intensity: 0.2,
  },
  sun: {
    color: 0xfff4e6,
    intensity: 10,
    distance: 20000,
    decay: 2,
  },
};

export const CELESTIAL_CONFIG = {
  common: {
    textureBasePath: '/assets/textures/',
    lodLevels: LOD_LEVELS,
    defaultTextureSettings: DEFAULT_TEXTURE_SETTINGS,
  },
  bodies: {
    sun: {
      radius: 19.0,
      rotationSpeed: 0.001,
      orbitalRadius: 0,
      textureResolutions: { surface: ['4k', '2k', '1k'] },
      textures: { surface: 'sun/sunSurface' },
    },
    mercury: {
      radius: 0.383,
      rotationSpeed: 0.003,
      orbitalRadius: 58,
      textureResolutions: {
        surface: ['8k', '4k', '2k', '1k'],
        bump: ['1k'],
      },
      textures: {
        surface: 'mercury/mercurySurface',
        bump: 'mercury/mercuryBump',
      },
    },
    venus: {
      radius: 0.949,
      rotationSpeed: -0.0001,
      orbitalRadius: 108,
      textureResolutions: {
        surface: ['8k', '4k', '2k', '1k'],
        bump: ['1k'],
        atmosphere: ['4k', '2k', '1k'],
      },
      textures: {
        surface: 'venus/venusSurface',
        atmosphere: 'venus/venusAtmosphere',
        bump: 'venus/venusBump',
      },
    },
    earth: {
      radius: 1.0,
      rotationSpeed: 0.0008,
      orbitalRadius: 150,
      textureResolutions: {
        surface: ['8k', '4k', '2k', '1k'],
        normalMap: ['8k', '4k', '2k', '1k'],
        clouds: ['8k', '4k', '2k', '1k'],
        spec: ['8k', '4k', '2k', '1k'],
        lights: ['8k', '4k', '2k', '1k'],
      },
      textures: {
        surface: 'earth/earthSurface',
        normalMap: 'earth/earthNormalMap',
        clouds: 'earth/earthClouds',
        spec: 'earth/earthSpec',
        lights: 'earth/earthLights',
      },
      satellites: {
        moon: {
          type: 'satellite',
          radius: 0.273,
          rotationSpeed: 0.0002,
          orbitalRadius: 3,
          textureResolutions: {
            surface: ['8k', '4k', '2k', '1k'],
            bump: ['4k', '2k', '1k'],
          },
          textures: {
            surface: 'moon/moonSurface',
            bump: 'moon/moonBump',
          },
        },
      },
    },
    mars: {
      radius: 0.532,
      rotationSpeed: 0.001,
      orbitalRadius: 228,
      textureResolutions: {
        surface: ['8k', '4k', '2k', '1k'],
        normalMap: ['1k'],
      },
      textures: {
        surface: 'mars/marsSurface',
        normalMap: 'mars/marsNormalMap',
      },
    },
    jupiter: {
      radius: 11.21,
      rotationSpeed: 0.003,
      orbitalRadius: 778,
      textureResolutions: { surface: ['4k', '2k', '1k'] },
      textures: { surface: 'jupiter/jupiterSurface' },
    },
    saturn: {
      radius: 9.45,
      rotationSpeed: 0.0015,
      orbitalRadius: 1430,
      ring: {
        saturnRing: {
          bodyName: 'saturnRing',
          innerRadius: 1.5,
          outerRadius: 2,
          rotationSpeed: 0.00005,
          textureResolutions: ['8k', '4k', '2k', '1k'],
          textures: 'saturn/saturnRing',
        },
      },
      textureResolutions: { surface: ['4k', '2k', '1k'] },
      textures: { surface: 'saturn/saturnSurface' },
    },
    uranus: {
      radius: 4.01,
      rotationSpeed: 0.001,
      orbitalRadius: 2870,
      textureResolutions: { surface: ['2k', '1k'] },
      textures: { surface: 'uranus/uranusSurface' },
    },
    neptune: {
      radius: 3.88,
      rotationSpeed: 0.0012,
      orbitalRadius: 4500,
      textureResolutions: { surface: ['2k', '1k'] },
      textures: { surface: 'neptune/neptuneSurface' },
    },
  },
};

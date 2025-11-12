import * as THREE from 'three';

export const APP_SETTINGS = {
  debug: true,
  performance: {
    targetFPS: 60,
    maxAnisotropy: 16,
    textureQuality: {
      ultra: { segments: 256, distance: 0, quality: '8k' },
      high: { segments: 128, distance: 20, quality: '4k' },
      medium: { segments: 64, distance: 40, quality: '2k' },
      low: { segments: 32, distance: 60, quality: '1k' },
    },
  },
};

export const RENDER_SETTINGS = {
  antialias: true,
  powerPreference: 'high-performance',
  shadowMap: {
    enabled: true,
    type: THREE.PCFSoftShadowMap,
    resolution: [2048, 2048],
  },
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
  physicallyCorrectLights: true,
  maxPixelRatio: 1.5,
};

export const CAMERA_SETTINGS = {
  fov: 75,
  near: 0.1,
  far: 20000,
  initialPosition: new THREE.Vector3(0, 50, 0),
  controls: {
    damping: 0.25,
    minDistance: 0,
    maxDistance: 100,
    maxPolarAngle: Math.PI,
    minPolarAngle: 0,
  },
  bodyDistances: {
    sun: 50,
    mercury: 2,
    venus: 5,
    earth: 5,
    moon: 2,
    mars: 3,
    jupiter: 25,
    saturn: 20,
    uranus: 10,
    neptune: 10,
  },
};

export const LIGHTING_SETTINGS = {
  ambient: {
    color: 0xfff4e6,
    intensity: 1,
  },
  sun: {
    color: 0xfff4e6,
    intensity: 10,
    distance: 20000,
    decay: 2,
    position: new THREE.Vector3(0, 0, 0),
  },
};

export const TEXTURE_SETTINGS = {
  basePath: '/assets/textures/',
  defaultSettings: {
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
    anisotropy: 8,
    colorSpace: THREE.SRGBColorSpace,
    minFilter: THREE.LinearMipMapLinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: true,
  },
  loadPriority: [
    'stars',
    'sun',
    'earth',
    'moon',
    'mars',
    'jupiter',
    'saturn',
    'venus',
    'mercury',
    'uranus',
    'neptune',
  ],
};

export const CELESTIAL_CONFIG = {
  bodies: {
    stars: {
      radius: 0,
      rotationSpeed: 0,
      orbitalRadius: 0,
      orbitalColor: 0x000000,
      textureResolutions: { surface: ['8k'] },
      textures: { surface: 'stars/starsSurface' },
    },
    sun: {
      radius: 10,
      rotationSpeed: 0.001,
      orbitalRadius: 0,
      orbitSpeed: 0,
      orbitalColor: 0x000000,
      textureResolutions: { surface: ['4k', '2k', '1k'] },
      textures: { surface: 'sun/sunSurface' },
    },
    mercury: {
      radius: 0.4,
      rotationSpeed: 0.003,
      orbitSpeed: 0.04,
      orbitalRadius: 20,
      orbitalColor: 0xaaaaaa,
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
      radius: 0.9,
      rotationSpeed: -0.0001,
      orbitSpeed: 0.015,
      orbitalRadius: 28,
      orbitalColor: 0xffa500,
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
      radius: 1,
      rotationSpeed: 0.0008,
      orbitSpeed: 0.01,
      orbitalRadius: 35,
      orbitalColor: 0x00bfff,
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
          radius: 0.27,
          rotationSpeed: 0.0002,
          orbitSpeed: 0.1,
          orbitalRadius: 2,
          orbitalColor: 0x999999,
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
      radius: 0.6,
      rotationSpeed: 0.001,
      orbitSpeed: 0.005,
      orbitalRadius: 45,
      orbitalColor: 0xff4500,
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
      radius: 3.5,
      rotationSpeed: 0.003,
      orbitSpeed: 0.001,
      orbitalRadius: 70,
      orbitalColor: 0xffc04d,
      textureResolutions: { surface: ['4k', '2k', '1k'] },
      textures: { surface: 'jupiter/jupiterSurface' },
    },
    saturn: {
      radius: 3,
      rotationSpeed: 0.0015,
      orbitSpeed: 0.0005,
      orbitalRadius: 90,
      orbitalColor: 0xf5deb3,
      ring: {
        bodyName: 'saturn-ring',
        innerRadius: 1.5,
        outerRadius: 2,
        rotationSpeed: 0.00005,
        textureResolutions: ['8k', '4k', '2k', '1k'],
        textures: 'saturn/saturnRing',
      },
      textureResolutions: { surface: ['4k', '2k', '1k'] },
      textures: { surface: 'saturn/saturnSurface' },
    },
    uranus: {
      radius: 2,
      rotationSpeed: 0.001,
      orbitSpeed: 0.0002,
      orbitalRadius: 110,
      orbitalColor: 0x7fffd4,
      textureResolutions: { surface: ['2k', '1k'] },
      textures: { surface: 'uranus/uranusSurface' },
    },
    neptune: {
      radius: 1.8,
      rotationSpeed: 0.0012,
      orbitSpeed: 0.0001,
      orbitalRadius: 130,
      orbitalColor: 0x4169e1,
      textureResolutions: { surface: ['2k', '1k'] },
      textures: { surface: 'neptune/neptuneSurface' },
    },
  },
};

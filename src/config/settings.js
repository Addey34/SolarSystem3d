/**
 * @fileoverview Configuration centralisée de l'application Solar System 3D.
 * Regroupe tous les paramètres : performance, rendu, caméra, éclairage,
 * textures et définition des corps célestes.
 */

import * as THREE from 'three';

// ============================================================================
// DÉTECTION MOBILE
// ============================================================================

/**
 * Détecte si l'appareil est un mobile/tablette.
 * @returns {boolean}
 */
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
};

/** @type {boolean} Cache de la détection mobile */
export const IS_MOBILE = isMobile();

// ============================================================================
// CONFIGURATION DU LOGGER
// ============================================================================

/**
 * Paramètres du système de logging.
 * @property {boolean} debug - Active/désactive les logs de debug
 */
export const LOGGER_SETTINGS = {
  debug: false,
};

// ============================================================================
// CONFIGURATION DE L'APPLICATION
// ============================================================================

/**
 * Paramètres généraux de l'application.
 * @property {boolean} debug - Mode debug global
 * @property {Object} performance - Paramètres de performance
 * @property {number} performance.targetFPS - FPS cible (60)
 * @property {number} performance.maxAnisotropy - Filtrage anisotropique max
 * @property {Object} performance.textureQuality - Niveaux de qualité LOD
 */
export const APP_SETTINGS = {
  debug: false,
  performance: {
    targetFPS: 60,
    maxAnisotropy: IS_MOBILE ? 8 : 16,
    textureQuality: IS_MOBILE
      ? {
          // Mobile : max 4K, pas de 8K
          ultra: { segments: 128, distance: 10, quality: '4k' },
          high: { segments: 64, distance: 20, quality: '2k' },
          medium: { segments: 64, distance: 40, quality: '2k' },
          low: { segments: 32, distance: 80, quality: '1k' },
        }
      : {
          ultra: { segments: 256, distance: 10, quality: '8k' },
          high: { segments: 128, distance: 20, quality: '4k' },
          medium: { segments: 64, distance: 40, quality: '2k' },
          low: { segments: 32, distance: 80, quality: '1k' },
        },
  },
};

export const RENDER_SETTINGS = {
  antialias: !IS_MOBILE,
  powerPreference: 'high-performance',
  shadowMap: {
    enabled: true,
    type: THREE.PCFSoftShadowMap,
    resolution: [2048, 2048],
  },
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
  physicallyCorrectLights: true,
  maxPixelRatio: IS_MOBILE ? 1.5 : 2,
};

export const CAMERA_SETTINGS = {
  fov: 75,
  near: 0.1,
  far: 20000,
  initialPosition: new THREE.Vector3(0, 50, 0),
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

export const CAMERA_CONTROLS_SETTINGS = {
  smoothness: 0.15,
  minDistanceMultiplier: 2,
  damping: 0.08,
  minDistance: 0.5,
  maxDistance: 500,
  maxPolarAngle: Math.PI,
  minPolarAngle: 0,
  screenSpacePanning: false,
  enablePan: false,
  enableZoom: true,
  enableRotate: true,
  rotateSpeed: 0.2,
  zoomSpeed: 0.2,
};

export const LIGHTING_SETTINGS = {
  ambient: {
    color: 0x404040,
    intensity: 0.05,
  },
  sun: {
    color: 0xfffaf0,
    intensity: 2.5,
    distance: 0,
    decay: 0,
    position: new THREE.Vector3(0, 0, 0),
    shadow: {
      enabled: true,
      mapSize: IS_MOBILE ? 2048 : 4096,
      bias: -0.00005,
      normalBias: 0.02,
      radius: 1.5,
      near: 0.1,
      far: 1000,
    },
  },
};

/**
 * Configuration des shaders personnalisés.
 * @property {Object} nightLights - Paramètres pour les lumières nocturnes
 */
export const SHADER_SETTINGS = {
  nightLights: {
    intensity: 1.5,
    threshold: -0.1,
    smoothness: 0.4,
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
    // ========================================================================
    // CONFIGURATION DES CORPS CÉLESTES
    // ========================================================================
    // ÉCHELLE PÉDAGOGIQUE (non réaliste mais proportionnelle)
    //
    // RÉFÉRENCE : Terre
    //   - Rayon      : 1 (unité de base)
    //   - Rotation   : 0.3 (période de 24h)
    //   - Orbite     : 0.05 (période de 365 jours) - accéléré x5 pour visibilité
    //   - Distance   : 35 (orbitalRadius)
    //
    // FORMULES UTILISÉES :
    //   - rotationSpeed = 0.3 × (24 / période_rotation_heures)
    //   - orbitSpeed    = 0.05 × (365 / période_orbitale_jours)
    //
    // PARTICULARITÉS :
    //   - Vénus : rotation rétrograde (valeur négative)
    //   - Lune  : rotation synchrone (rotationSpeed = orbitSpeed)
    //   - Jupiter/Saturne : rotation très rapide (~10h)
    // ========================================================================

    stars: {
      radius: 0,
      rotationSpeed: 0,
      orbitalRadius: 0,
      orbitSpeed: 0,
      orbitalColor: 0x000000,
      textureResolutions: { surface: ['8k'] },
      textures: { surface: 'stars/starsSurface' },
    },

    sun: {
      radius: 10, // Réel: 109× Terre (réduit pour l'échelle)
      rotationSpeed: 0.012, // Période: 25 jours
      orbitalRadius: 0,
      orbitSpeed: 0,
      orbitalColor: 0x000000,
      textureResolutions: { surface: ['4k', '2k', '1k'] },
      textures: { surface: 'sun/sunSurface' },
    },

    mercury: {
      radius: 0.38, // Réel: 0.38× Terre
      rotationSpeed: 0.005, // Période: 59 jours (très lent)
      orbitSpeed: 0.205, // Période: 88 jours (le plus rapide)
      orbitalRadius: 18,
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
      radius: 0.95, // Réel: 0.95× Terre
      rotationSpeed: -0.0012, // Période: 243 jours, RÉTROGRADE (négatif)
      orbitSpeed: 0.08, // Période: 225 jours
      orbitalRadius: 25,
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
      radius: 1, // RÉFÉRENCE
      rotationSpeed: 0.3, // RÉFÉRENCE - Période: 24h
      orbitSpeed: 0.05, // RÉFÉRENCE - Période: 365 jours (accéléré x5)
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
          radius: 0.27, // Réel: 0.27× Terre
          rotationSpeed: 0.675, // Rotation SYNCHRONE (= orbitSpeed)
          orbitSpeed: 0.675, // Période: 27 jours (~13 orbites/an terrestre)
          orbitalRadius: 2.5,
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
      radius: 0.53, // Réel: 0.53× Terre
      rotationSpeed: 0.29, // Période: 24h37 (similaire à Terre)
      orbitSpeed: 0.0265, // Période: 687 jours (~1.88 ans)
      orbitalRadius: 50,
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
      radius: 4, // Réel: 11× Terre (réduit pour l'échelle)
      rotationSpeed: 0.73, // Période: 9h50 (TRÈS RAPIDE!)
      orbitSpeed: 0.00415, // Période: 12 ans
      orbitalRadius: 80,
      orbitalColor: 0xffc04d,
      textureResolutions: { surface: ['4k', '2k', '1k'] },
      textures: { surface: 'jupiter/jupiterSurface' },
    },

    saturn: {
      radius: 3.5, // Réel: 9× Terre (réduit pour l'échelle)
      rotationSpeed: 0.67, // Période: 10h33 (très rapide)
      orbitSpeed: 0.0017, // Période: 29 ans
      orbitalRadius: 100,
      orbitalColor: 0xf5deb3,
      ring: {
        bodyName: 'saturn-ring',
        innerRadius: 1.5,
        outerRadius: 2.2,
        rotationSpeed: 0.0001,
        textureResolutions: ['8k', '4k', '2k', '1k'],
        textures: 'saturn/saturnRing',
      },
      textureResolutions: { surface: ['4k', '2k', '1k'] },
      textures: { surface: 'saturn/saturnSurface' },
    },

    uranus: {
      radius: 2, // Réel: 4× Terre (réduit pour l'échelle)
      rotationSpeed: 0.42, // Période: 17h (rapide)
      orbitSpeed: 0.0006, // Période: 84 ans
      orbitalRadius: 130,
      orbitalColor: 0x7fffd4,
      textureResolutions: { surface: ['2k', '1k'] },
      textures: { surface: 'uranus/uranusSurface' },
    },

    neptune: {
      radius: 1.9, // Réel: 3.9× Terre (réduit pour l'échelle)
      rotationSpeed: 0.45, // Période: 16h (rapide)
      orbitSpeed: 0.0003, // Période: 165 ans (le plus lent)
      orbitalRadius: 160,
      orbitalColor: 0x4169e1,
      textureResolutions: { surface: ['2k', '1k'] },
      textures: { surface: 'neptune/neptuneSurface' },
    },
  },
};

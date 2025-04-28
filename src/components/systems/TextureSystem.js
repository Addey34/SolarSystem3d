import * as THREE from 'three';

const CONCURRENT_LOAD_LIMIT = 6;
const MAX_ANISOTROPY_LIMIT = 16;

// Gestion des textures
export class TextureSystem {
  constructor(config) {
    this.config = config;
    this.textureLoader = new THREE.TextureLoader();
    this.textures = new Map();
    this.cache = new Map();
    this.loadingQueue = [];
    this.loadedCount = 0;
    this.totalToLoad = 0;
    this.maxAnisotropy = this.getMaxAnisotropy();
  }

  // Charge les textures
  async load(progressCallback = () => {}) {
    this.loadingQueue = this.generateTextureList();
    this.totalToLoad = this.loadingQueue.length;
    const batchPromises = [];
    for (const textureDef of this.loadingQueue) {
      batchPromises.push(this.loadTexture(textureDef));
      if (batchPromises.length >= CONCURRENT_LOAD_LIMIT) {
        await Promise.all(batchPromises);
        batchPromises.length = 0;
        const progress = this.getLoadProgress();
        progressCallback(progress);
      }
    }
    if (batchPromises.length > 0) {
      await Promise.all(batchPromises);
      const progress = this.getLoadProgress();
      progressCallback(progress);
    }
    return this.getTexturesObject();
  }

  // Nettoie les ressources
  dispose() {
    for (const texture of this.textures.values()) {
      texture.dispose?.();
    }
    this.textures.clear();
    this.cache.clear();
  }
  async loadTexture({ name, path }) {
    try {
      if (this.cache.has(path)) {
        const cachedTexture = this.cache.get(path);
        this.textures.set(name, cachedTexture);
        this.loadedCount++;
        return;
      }
      const texture = await this.textureLoader.loadAsync(
        `${this.config.common.textureBasePath}${path}.jpg`
      );
      this.cache.set(path, texture);
      this.textures.set(name, texture);
      this.loadedCount++;
    } catch (error) {
      console.error(`Texture load error [${name}]: ${error.message}`);
    }
  }

  // Génère la liste des textures à charger
  generateTextureList() {
    const textures = [];
    const { bodies } = this.config;
    const processBody = (bodyName, bodyConfig) => {
      if (bodyConfig.textures) {
        for (const [type, basePath] of Object.entries(bodyConfig.textures)) {
          const resolutions = bodyConfig.textureResolutions?.[type];
          for (const resolution of resolutions) {
            const textureDef = {
              name: `${bodyName}_${type}_${resolution}`,
              path: `${basePath}_${resolution}`,
              type,
              resolution,
            };
            textures.push(textureDef);
          }
        }
      }

      if (bodyConfig.satellites) {
        for (const [satName, satConfig] of Object.entries(
          bodyConfig.satellites
        )) {
          if (satConfig.textures) {
            for (const [type, basePath] of Object.entries(satConfig.textures)) {
              const resolutions = satConfig.textureResolutions?.[type] ||
                defaultResolutions[type] || ['1k'];
              for (const resolution of resolutions) {
                const textureDef = {
                  name: `${satName}_${type}_${resolution}`,
                  path: `${basePath}_${resolution}`,
                  type: type,
                  resolution,
                };
                textures.push(textureDef);
              }
            }
          }
        }
      }

      if (bodyConfig.ring) {
        for (const [ringName, ringConfig] of Object.entries(bodyConfig.ring)) {
          if (ringConfig.textures && ringConfig.textureResolutions) {
            for (const resolution of ringConfig.textureResolutions) {
              const textureDef = {
                name: `${ringName}_${resolution}`,
                path: `${ringConfig.textures}_${resolution}`,
                type: 'ring',
                resolution,
              };
              textures.push(textureDef);
            }
          }
        }
      }
    };
    for (const [bodyName, bodyConfig] of Object.entries(bodies)) {
      processBody(bodyName, bodyConfig);
    }
    textures.push({
      name: 'starsBackground',
      path: 'stars/starsmilky_8k',
      type: 'skybox',
      resolution: '8k',
    });
    return textures;
  }

  getMaxAnisotropy() {
    try {
      const renderer = new THREE.WebGLRenderer({ antialias: false });
      const max = renderer.capabilities.getMaxAnisotropy();
      renderer.dispose();
      const finalValue = Math.min(max, MAX_ANISOTROPY_LIMIT);
      return finalValue;
    } catch (error) {
      console.warn('[TextureSystem] Anisotropy detection failed:', error);
      return 1;
    }
  }

  getLoadProgress() {
    const progress = Math.round((this.loadedCount / this.totalToLoad) * 100);
    return progress;
  }

  getTexturesObject() {
    const result = {};
    for (const [key, value] of this.textures) {
      result[key] = value;
    }
    return result;
  }
}

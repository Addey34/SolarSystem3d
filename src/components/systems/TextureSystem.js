import * as THREE from 'three';
import Logger from '../../utils/Logger.js';

export class TextureSystem {
  static #instance;

  // Singleton
  static getInstance(config) {
    if (!TextureSystem.#instance) {
      TextureSystem.#instance = new TextureSystem(config);
    } else {
    }
    return TextureSystem.#instance;
  }

  // Constructor
  constructor(config) {
    if (TextureSystem.#instance) {
      return TextureSystem.#instance;
    }
    this.textureLoader = new THREE.TextureLoader();
    this.config = config;
    this.basePath = config.basePath;
    this.defaultSettings = config.defaultSettings;
    this.cache = new Map();
    this.loadingPromises = new Map();
    Logger.info('[TextureSystem] Instance created ✅');
  }

  // Load a texture
  async loadTexture(relativePath, quality) {
    const fullPath = `${this.basePath}${relativePath}_${quality}.jpg`;
    if (this.cache.has(fullPath)) {
      Logger.debug(`[TextureSystem] Cache hit: ${fullPath}`);
      return this.cache.get(fullPath);
    }
    Logger.debug(`[TextureSystem] Loading: ${fullPath}`);
    const promise = new Promise((resolve, reject) => {
      this.textureLoader.load(
        fullPath,
        (texture) => {
          Logger.success(`[TextureSystem] Loaded: ${fullPath}`);
          Object.entries(this.defaultSettings).forEach(([key, value]) => {
            if (key in texture) texture[key] = value;
          });
          texture.needsUpdate = true;
          this.cache.set(fullPath, texture);
          resolve(texture);
          this.loadingPromises.delete(fullPath);
        },
        undefined,
        (err) => {
          Logger.warn(`[TextureSystem] Failed: ${fullPath}`, err);
          this.loadingPromises.delete(fullPath);
          reject(err);
        }
      );
    });
    this.loadingPromises.set(fullPath, promise);
    return promise;
  }

  // Preload critical textures
  async preloadCriticalTextures(progressCallback = () => {}) {
    const priorityList = this.config.loadPriority;
    const total = priorityList.length;
    let loaded = 0;
    Logger.info(`[TextureSystem] Priority list: ${priorityList}`);
    Logger.info(`[TextureSystem] Preloading top priority textures (${total})`);
    for (const bodyName of priorityList) {
      let bodyConfig = this.config.bodies?.[bodyName];
      if (!bodyConfig) {
        const parentName = Object.keys(this.config.bodies).find(
          (planet) => this.config.bodies[planet]?.satellites?.[bodyName]
        );
        if (parentName) {
          bodyConfig = this.config.bodies[parentName].satellites[bodyName];
        }
      }
      if (!bodyConfig) {
        Logger.warn(`[TextureSystem] No config for body: ${bodyName}`);
        continue;
      }
      const textureKeys = Object.keys(bodyConfig.textures);
      for (const key of textureKeys) {
        const textureBasePath = bodyConfig.textures[key];
        const resolutions = bodyConfig.textureResolutions?.[key];
        const bestQuality = resolutions[0];
        progressCallback(
          loaded / total,
          `Loading ${bodyName} ${key} (${bestQuality})`
        );
        try {
          Logger.debug(
            `[TextureSystem] Preload ${bodyName}:${key} -> ${bestQuality}`
          );
          await this.loadTexture(textureBasePath, bestQuality);
        } catch {
          Logger.warn(
            `[TextureSystem] Failed preload: ${textureBasePath}_${bestQuality}`
          );
        }
      }
      loaded++;
      progressCallback(loaded / total, `Loaded ${bodyName}`);
    }
    progressCallback(1, 'All critical textures loaded');
    Logger.success('[TextureSystem] Priority textures loaded');
  }

  // Get a LOD texture
  async getLODTexture(bodyName, textureKey, distance) {
    let bodyConfig = this.config.bodies?.[bodyName];
    if (!bodyConfig) {
      const parentBody = Object.keys(this.config.bodies).find(
        (planet) => this.config.bodies[planet]?.satellites?.[bodyName]
      );
      if (parentBody) {
        bodyConfig = this.config.bodies[parentBody]?.satellites?.[bodyName];
      }
    }
    if (!bodyConfig) {
      throw new Error(`Unknown body: ${bodyName}`);
    }
    const textureBasePath = bodyConfig.textures?.[textureKey];
    const resolutions = bodyConfig.textureResolutions?.[textureKey];
    if (!textureBasePath || !resolutions) {
      throw new Error(
        `Texture key "${textureKey}" not found for body "${bodyName}"`
      );
    }
    const chosenQuality = this.chooseQualityBasedOnDistance(
      distance,
      resolutions
    );
    Logger.debug(
      `[TextureSystem] LOD ${bodyName}:${textureKey} -> ${chosenQuality} (distance: ${distance})`
    );
    return this.loadTexture(textureBasePath, chosenQuality);
  }

  chooseQualityBasedOnDistance(distance, resolutions) {
    const perfQualities = this.config.textureQuality || {
      ultra: { distance: 0, quality: '8k' },
      high: { distance: 20, quality: '4k' },
      medium: { distance: 40, quality: '2k' },
      low: { distance: 60, quality: '1k' },
    };
    let chosenQuality = resolutions[resolutions.length - 1];
    const sortedDistances = Object.values(perfQualities)
      .map((v) => v.distance)
      .sort((a, b) => a - b);
    for (const distLimit of sortedDistances) {
      if (distance <= distLimit) {
        const qualityMatch = Object.keys(perfQualities).find(
          (key) => perfQualities[key].distance === distLimit
        );
        chosenQuality = resolutions.includes(qualityMatch)
          ? qualityMatch
          : resolutions.find((q) => perfQualities[q]?.distance <= distLimit) ||
            chosenQuality;
        break;
      }
    }

    return chosenQuality;
  }

  dispose() {
    Logger.warn('[TextureSystem] Disposing textures cache...');
    this.cache.forEach((texture) => texture.dispose?.());
    this.cache.clear();
    this.loadingPromises.clear();
    Logger.success('[TextureSystem] Cleanup complete');
  }
}

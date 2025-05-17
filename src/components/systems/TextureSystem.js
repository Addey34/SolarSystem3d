import * as THREE from 'three';

export class TextureSystem {
  static #instance;

  // Méthode pour récupérer l'instance unique du TextureSystem
  static getInstance(config) {
    if (!TextureSystem.#instance) {
      TextureSystem.#instance = new TextureSystem(config);
    } else {
    }
    return TextureSystem.#instance;
  }

  // Constructeur de la classe TextureSystem
  constructor(config) {
    if (TextureSystem.#instance) {
      return TextureSystem.#instance;
    }

    // Initialisation des propriétés du système de textures
    this.config = config;
    this.textureLoader = new THREE.TextureLoader();
    this.cache = new Map();
    this.basePath = config.basePath;
    this.defaultSettings = config.defaultSettings;
    this.loadingPromises = new Map();
  }

  // Méthode pour charger une texture
  async loadTexture(relativePath, quality = '8k') {
    const fullPath = `${this.basePath}${relativePath}_${quality}.jpg`;
    if (this.cache.has(fullPath)) {
      return Promise.resolve(this.cache.get(fullPath));
    }
    const promise = new Promise((resolve, reject) => {
      this.textureLoader.load(
        fullPath,
        (texture) => {
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
          console.warn(
            `[TextureSystem] Failed to load texture: ${fullPath}`,
            err
          );
          this.loadingPromises.delete(fullPath);
          reject(err);
        }
      );
    });

    this.loadingPromises.set(fullPath, promise);
    return promise;
  }

  // Méthode pour précharger les textures critiques avec un suivi de progression
  async preloadCriticalTextures(progressCallback = () => {}) {
    const priorityList = this.config.loadPriority;
    const total = priorityList.length;
    let loaded = 0;
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
        console.warn(`[TextureSystem] Body config not found for: ${bodyName}`);
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
          await this.loadTexture(textureBasePath, bestQuality);
        } catch {
          console.warn(
            `[TextureSystem] Failed to preload texture ${textureBasePath}_${bestQuality}`
          );
        }
      }
      loaded++;
      progressCallback(loaded / total, `Loaded ${bodyName}`);
    }
    progressCallback(1, 'All critical textures loaded');
  }

  // Méthode pour récupérer une texture en fonction de la distance (LOD)
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
    const perfQualities = this.config.textureQuality || {
      ultra: { distance: 0 },
      high: { distance: 20 },
      medium: { distance: 40 },
      low: { distance: 60 },
    };
    const sortedDistances = Object.values(perfQualities)
      .map((v) => v.distance)
      .sort((a, b) => a - b);
    let chosenQuality = resolutions[resolutions.length - 1];
    for (const distLimit of sortedDistances) {
      if (distance <= distLimit) {
        const entry = Object.entries(perfQualities).find(
          ([, v]) => v.distance === distLimit
        );
        if (entry) {
          const qualityName = entry[0];
          if (resolutions.includes(qualityName)) {
            chosenQuality = qualityName;
          } else {
            chosenQuality =
              resolutions.find(
                (q) => perfQualities[q]?.distance <= distLimit
              ) || chosenQuality;
          }
        }
        break;
      }
    }
    return this.loadTexture(textureBasePath, chosenQuality);
  }

  dispose() {
    this.cache.forEach((texture, key) => {
      texture.dispose?.();
    });
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

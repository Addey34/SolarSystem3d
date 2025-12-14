/**
 * @fileoverview Système de gestion des textures avec support LOD (Level of Detail).
 * Implémente le pattern Singleton pour garantir une seule instance.
 * Gère le chargement asynchrone, le cache et la sélection de qualité selon la distance.
 */

import * as THREE from 'three';
import Logger from '../../utils/Logger.js';

/**
 * Système de gestion des textures avec LOD dynamique.
 * Singleton assurant un cache unique pour toutes les textures.
 */
export class TextureSystem {
  /** @type {TextureSystem|undefined} Instance singleton privée */
  static #instance;

  /**
   * Récupère l'instance singleton du système de textures.
   * @param {Object} config - Configuration (utilisée uniquement à la première création)
   * @returns {TextureSystem} L'instance unique
   */
  static getInstance(config) {
    if (!TextureSystem.#instance) {
      TextureSystem.#instance = new TextureSystem(config);
    }
    return TextureSystem.#instance;
  }

  /**
   * Constructeur privé (utiliser getInstance à la place).
   * @param {Object} config - Configuration des textures et des corps célestes
   */
  constructor(config) {
    // Protection contre les instanciations multiples
    if (TextureSystem.#instance) {
      return TextureSystem.#instance;
    }

    /** @type {THREE.TextureLoader} Chargeur de textures Three.js */
    this.textureLoader = new THREE.TextureLoader();

    /** @type {Object} Configuration complète */
    this.config = config;

    /** @type {string} Chemin de base pour les textures */
    this.basePath = config.basePath;

    /** @type {Object} Paramètres par défaut appliqués aux textures */
    this.defaultSettings = config.defaultSettings;

    /** @type {Map<string, THREE.Texture>} Cache des textures chargées */
    this.cache = new Map();

    /** @type {Map<string, Promise>} Promesses de chargement en cours */
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
    const perfQualities = this.config.performance?.textureQuality;

    let chosenQuality = resolutions[resolutions.length - 1];

    const qualitiesArray = Object.entries(perfQualities).sort(
      (a, b) => a[1].distance - b[1].distance
    );

    for (const [qualityName, qualityConfig] of qualitiesArray) {
      if (
        distance <= qualityConfig.distance &&
        resolutions.includes(qualityConfig.quality)
      ) {
        chosenQuality = qualityConfig.quality;
        break;
      }
    }

    if (!resolutions.includes(chosenQuality)) {
      chosenQuality = resolutions[resolutions.length - 1];
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

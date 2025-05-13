import * as THREE from 'three';

const CONCURRENT_LOAD_LIMIT = 6;
const MAX_ANISOTROPY_LIMIT = 16;

export class TextureSystem {
  constructor(config) {
    this.config = config;
    this.textureLoader = new THREE.TextureLoader();
    this.textures = new Map();
    this.cache = new Map();
    this.loadedCount = 0;
    this.totalToLoad = 0;
    this.maxAnisotropy = this.getMaxAnisotropy();
  }

  async load(progressCallback = () => {}) {
    this.loadingQueue = this.generateTextureList();
    this.totalToLoad = this.loadingQueue.length;
    for (let i = 0; i < this.loadingQueue.length; i += CONCURRENT_LOAD_LIMIT) {
      const batch = this.loadingQueue.slice(i, i + CONCURRENT_LOAD_LIMIT);
      await Promise.all(batch.map((def) => this.loadTexture(def)));
      progressCallback(Math.round((i / this.loadingQueue.length) * 100));
    }
    console.log(this.getTexturesObject());
    return this.getTexturesObject();
  }

  async loadTexture({ name, path }) {
    try {
      if (this.cache.has(path)) {
        this.textures.set(name, this.cache.get(path));
        this.loadedCount++;
        return;
      }
      const texture = await this.textureLoader.loadAsync(
        `${this.config.common.textureBasePath}${path}.jpg`
      );
      Object.assign(texture, this.config.common.defaultTextureSettings);
      texture.anisotropy = this.maxAnisotropy;
      texture.needsUpdate = true;
      this.cache.set(path, texture);
      this.textures.set(name, texture);
      this.loadedCount++;
    } catch (error) {
      console.error(`Texture load error [${name}]:`, error);
    }
  }

  generateTextureList() {
    const textures = [];
    const { bodies } = this.config;
    const processTextures = (prefix, config) => {
      if (!config.textures) return;
      Object.entries(config.textures).forEach(([type, basePath]) => {
        const resolutions = config.textureResolutions?.[type];
        resolutions.forEach((resolution) => {
          textures.push({
            name: `${prefix}_${type}_${resolution}`,
            path: `${basePath}_${resolution}`,
            type,
            resolution,
          });
        });
      });
    };
    Object.entries(bodies).forEach(([name, config]) => {
      processTextures(name, config);
      if (config.satellites) {
        Object.entries(config.satellites).forEach(([satName, satConfig]) => {
          processTextures(satName, satConfig);
        });
      }
      if (config.ring) {
        const ringConfig = config.ring;
        ringConfig.textureResolutions.forEach((resolution) => {
          textures.push({
            name: `${ringConfig.bodyName}_${resolution}`,
            path: `${ringConfig.textures}_${resolution}`,
            type: 'ring',
            resolution,
          });
        });
      }
    });
    textures.push({
      name: 'starsBackground',
      path: 'stars/starsMilky_8k',
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
      return Math.min(max, MAX_ANISOTROPY_LIMIT);
    } catch (error) {
      console.warn('Anisotropy detection failed:', error);
      return 1;
    }
  }

  getTexturesObject() {
    return Object.fromEntries(this.textures.entries());
  }

  dispose() {
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
    this.cache.clear();
  }
}

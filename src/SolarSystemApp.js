import CelestialObjectFactory from './components/celestial/CelestialObjectFactory.js';
import { AnimationSystem } from './components/systems/AnimationSystem.js';
import { CameraSystem } from './components/systems/CameraSystem.js';
import { LightingSystem } from './components/systems/LightingSystem.js';
import { SceneSystem } from './components/systems/SceneSystem.js';
import { TextureSystem } from './components/systems/TextureSystem.js';
import {
  APP_SETTINGS,
  CELESTIAL_CONFIG,
  TEXTURE_SETTINGS,
} from './config/settings.js';

export class SolarSystemApp {
  constructor() {
    this.bodyCache = null;
    this.state = {
      initialized: false,
      bodies: null,
    };
    this.systems = {
      texture: null,
      scene: null,
      lighting: new LightingSystem(),
      camera: new CameraSystem(),
      animation: new AnimationSystem(),
    };
  }

  async init(progressCallback) {
    if (this.state.initialized) {
      console.warn('[SolarSystemApp] Already initialized.');
      return;
    }
    try {
      await this.loadResources(progressCallback);
      this.initCoreSystems(progressCallback);
      this.state.bodies = await this.getCelestialBodies();
      this.finalizeSetup(progressCallback);
      this.state.initialized = true;
      return this.getPublicAPI();
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  // Chargement des textures critiques avec suivi de progression
  async loadResources(progressCallback) {
    this.systems.texture = TextureSystem.getInstance({
      ...CELESTIAL_CONFIG,
      ...APP_SETTINGS,
      ...TEXTURE_SETTINGS,
    });
    await this.systems.texture.preloadCriticalTextures((percent, msg) => {
      progressCallback(percent * 0.4, msg);
    });
  }

  // Initialisation de la scène et de l’éclairage
  initCoreSystems(progressCallback) {
    progressCallback(45, 'Building scene...');
    this.systems.scene = new SceneSystem(
      CELESTIAL_CONFIG,
      this.systems.texture
    );
    this.systems.scene.init();
    progressCallback(60, 'Setting up lighting...');
    this.systems.lighting.setup(this.systems.scene.scene);
  }

  // Création ou récupération en cache des corps célestes
  async getCelestialBodies() {
    if (this.bodyCache) {
      return this.bodyCache;
    }
    const factory = new CelestialObjectFactory(
      this.systems.texture,
      CELESTIAL_CONFIG,
      this.systems.animation
    );
    this.bodyCache = await factory.createAll();
    return this.bodyCache;
  }

  // Finalisation : ajout des corps à la scène, config caméra et animation
  finalizeSetup(progressCallback) {
    progressCallback(85, 'Finalizing...');
    this.systems.scene.setupCelestialBodies(this.state.bodies);
    this.systems.camera.init(
      this.systems.scene.camera,
      this.systems.scene.renderer,
      this.state.bodies,
      this.systems.scene
    );
    this.systems.animation.init({
      scene: this.systems.scene.scene,
      camera: this.systems.scene.camera,
      renderer: this.systems.scene.renderer,
      cameraSystem: this.systems.camera,
    });
    progressCallback(95, 'Starting...');
    this.systems.animation.run();
  }

  // API publique exposée après initialisation
  getPublicAPI() {
    return {
      sceneSystem: this.systems.scene,
      animationSystem: this.systems.animation,
      cameraSystem: this.systems.camera,
      cleanup: () => this.dispose(),
    };
  }

  // Nettoyage complet des systèmes et reset de l’état
  dispose() {
    Object.values(this.systems).forEach((sys) => sys.dispose?.());
    this.bodyCache = null;
    this.state.initialized = false;
  }
}

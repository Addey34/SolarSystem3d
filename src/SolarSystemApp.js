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
import Logger from './utils/Logger.js';

export class SolarSystemApp {
  constructor() {
    Logger.info('[SolarSystemApp] Initializing core containers...');
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

  // Fonction d'initialisation
  async init(progressCallback) {
    if (this.state.initialized) {
      Logger.warn('[SolarSystemApp] init() called twice — ignored.');
      return this.getPublicAPI();
    }
    try {
      Logger.group('SolarSystemApp Init');

      Logger.info('→ Loading resources...');
      await this.loadResources(progressCallback);

      Logger.info('→ Initializing core systems...');
      this.initCoreSystems(progressCallback);

      Logger.info('→ Creating celestial bodies...');
      this.state.bodies = await this.getCelestialBodies();

      Logger.info('→ Finalizing setup...');
      this.finalizeSetup(progressCallback);

      this.state.initialized = true;
      Logger.success('Solar System successfully initialized ✅');
      Logger.groupEnd();

      return this.getPublicAPI();
    } catch (error) {
      Logger.error('❌ SolarSystemApp failed to initialize:', error);
      this.dispose();
      throw error;
    }
  }

  // Chargement des ressources (textures, etc.)
  async loadResources(progressCallback) {
    this.systems.texture = TextureSystem.getInstance({
      ...CELESTIAL_CONFIG,
      ...APP_SETTINGS,
      ...TEXTURE_SETTINGS,
    });

    Logger.debug('Texture system ready — preloading critical assets...');
    await this.systems.texture.preloadCriticalTextures((percent, msg) => {
      progressCallback(percent * 0.4, msg);
      Logger.debug(`[TextureLoader] ${msg} — ${Math.round(percent * 40)}%`);
    });
  }

  // Initialisation des systèmes principaux (scene, camera, lighting)
  initCoreSystems(progressCallback) {
    progressCallback(45, 'Building scene...');
    this.systems.scene = new SceneSystem(
      CELESTIAL_CONFIG,
      this.systems.texture
    );
    this.systems.scene.init();
    Logger.debug('Scene initialized.');

    progressCallback(60, 'Setting up lighting...');
    this.systems.lighting.setup(this.systems.scene.scene);
    Logger.debug('Lighting initialized.');
  }

  // Création des corps célestes
  async getCelestialBodies() {
    if (this.bodyCache) {
      Logger.debug('Celestial bodies cached — reusing.');
      return this.bodyCache;
    }

    const factory = new CelestialObjectFactory(
      this.systems.texture,
      CELESTIAL_CONFIG,
      this.systems.animation
    );

    Logger.debug('Creating celestial bodies with factory...');
    this.bodyCache = await factory.createAll();
    Logger.success('Celestial bodies created ✅');

    return this.bodyCache;
  }

  // Finalisation de l'initialisation (configuration de la caméra, animation, etc.).
  finalizeSetup(progressCallback) {
    progressCallback(85, 'Finalizing...');

    this.systems.scene.setupCelestialBodies(this.state.bodies);
    Logger.debug('Bodies added to scene.');

    this.systems.camera.init(
      this.systems.scene.camera,
      this.systems.scene.renderer,
      this.state.bodies,
      this.systems.scene
    );
    Logger.debug('Camera system initialized.');

    this.systems.animation.init({
      scene: this.systems.scene.scene,
      camera: this.systems.scene.camera,
      renderer: this.systems.scene.renderer,
      cameraSystem: this.systems.camera,
      celestialBodies: this.state.bodies,
      sceneSystem: this.systems.scene,
    });
    Logger.debug('Animation system initialized.');

    progressCallback(95, 'Starting...');
    this.systems.animation.run();
    Logger.success('Animation loop running 🚀');
  }

  // Retourne l'API publique pour l'accès extérieur
  getPublicAPI() {
    return {
      sceneSystem: this.systems.scene,
      animationSystem: this.systems.animation,
      cameraSystem: this.systems.camera,
      cleanup: () => this.dispose(),
    };
  }

  // Nettoyage de l'application
  dispose() {
    Logger.warn('Disposing systems...');
    Object.values(this.systems).forEach((sys) => sys.dispose?.());
    this.bodyCache = null;
    this.state.initialized = false;
    Logger.success('Cleanup complete.');
  }
}

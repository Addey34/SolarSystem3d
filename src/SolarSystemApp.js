/**
 * @fileoverview Classe principale orchestrant l'ensemble du système solaire 3D.
 * Coordonne l'initialisation et la communication entre tous les sous-systèmes :
 * - TextureSystem : Gestion et chargement des textures avec LOD
 * - SceneSystem : Configuration de la scène Three.js, caméra et renderer
 * - LightingSystem : Éclairage de la scène (soleil + ambiant)
 * - CameraSystem : Contrôles de caméra et navigation entre planètes
 * - AnimationSystem : Boucle de rendu et mise à jour des objets
 */

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

/**
 * Classe principale de l'application Solar System.
 * Implémente le pattern Facade pour simplifier l'interaction avec les sous-systèmes.
 */
export class SolarSystemApp {
  /**
   * Crée une nouvelle instance de l'application.
   * Initialise les conteneurs pour les systèmes mais ne les démarre pas encore.
   */
  constructor() {
    Logger.info('[SolarSystemApp] Initializing core containers...');

    /** @type {Object|null} Cache des corps célestes pour éviter les recréations */
    this.bodyCache = null;

    /** @type {Object} État interne de l'application */
    this.state = {
      /** @type {boolean} Indique si l'application est initialisée */
      initialized: false,
      /** @type {Object|null} Référence aux corps célestes créés */
      bodies: null,
    };

    /** @type {Object} Conteneur des sous-systèmes */
    this.systems = {
      /** @type {TextureSystem|null} Système de gestion des textures */
      texture: null,
      /** @type {SceneSystem|null} Système de gestion de la scène */
      scene: null,
      /** @type {LightingSystem} Système d'éclairage */
      lighting: new LightingSystem(),
      /** @type {CameraSystem} Système de contrôle de la caméra */
      camera: new CameraSystem(),
      /** @type {AnimationSystem} Système d'animation et boucle de rendu */
      animation: new AnimationSystem(APP_SETTINGS.performance.targetFPS),
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

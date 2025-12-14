/**
 * @fileoverview Factory pour la création des corps célestes.
 * Implémente le pattern Factory pour centraliser la création des objets
 * et gérer la hiérarchie parent-satellite (ex: Terre -> Lune).
 */

import Logger from '../../utils/Logger.js';
import CelestialObject from './CelestialObject.js';

/**
 * Factory responsable de la création de tous les corps célestes.
 * Gère le cache des instances et la création récursive des satellites.
 */
export default class CelestialObjectFactory {
  /**
   * Crée une nouvelle instance de la factory.
   * @param {TextureSystem} textureSystem - Système de gestion des textures
   * @param {Object} objectConfig - Configuration de tous les corps célestes (CELESTIAL_CONFIG)
   * @param {AnimationSystem} animationSystem - Système d'animation
   */
  constructor(textureSystem, objectConfig, animationSystem) {
    /** @type {TextureSystem} Référence au système de textures */
    this.textureSystem = textureSystem;

    /** @type {Object} Configuration des corps célestes */
    this.objectConfig = objectConfig;

    /** @type {AnimationSystem} Référence au système d'animation */
    this.animationSystem = animationSystem;

    /** @type {Map<string, CelestialObject>} Cache des corps créés pour éviter les doublons */
    this.classCache = new Map();
  }

  // Création de tous les corps célestes avec leurs satellites
  async createAll() {
    const bodies = {};
    const creationPromises = [];

    Logger.info('[CelestialObjectFactory] Creating all celestial bodies...');

    for (const [name, config] of Object.entries(this.objectConfig.bodies)) {
      // Exclure 'stars' car c'est un skybox géré séparément
      if (name === 'stars') continue;

      creationPromises.push(
        this.createBodyWithHierarchy(name, config, null, bodies)
      );
    }

    await Promise.all(creationPromises);
    Logger.success('[CelestialObjectFactory] All celestial bodies created');
    return bodies;
  }

  // Création d'un corps céleste avec ses satellites
  async createBodyWithHierarchy(name, config, parentName, bodies) {
    if (this.classCache.has(name)) {
      Logger.debug(`[CelestialObjectFactory] Using cached body: ${name}`);
      return this.classCache.get(name);
    }

    let body;
    try {
      Logger.debug(`[CelestialObjectFactory] Creating body: ${name}`);
      body = new CelestialObject(
        this.textureSystem,
        config,
        name,
        this.animationSystem
      );
      body.group.userData = {
        config,
        type: 'celestial-body',
        parent: parentName,
        radius: config.radius,
      };
      bodies[name] = body;
      this.classCache.set(name, body);
      Logger.success(`[CelestialObjectFactory] Body created: ${name}`);
    } catch (error) {
      Logger.error(
        `[CelestialObjectFactory] Failed to create body: ${name}`,
        error
      );
      return null;
    }

    // Création récursive des satellites
    if (config.satellites) {
      await Promise.all(
        Object.entries(config.satellites).map(([satName, satConfig]) =>
          this.createBodyWithHierarchy(satName, satConfig, name, bodies)
        )
      );
    }

    return body;
  }
}

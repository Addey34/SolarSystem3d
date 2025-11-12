import Logger from '../../utils/Logger.js';
import CelestialObject from './CelestialObject.js';

export default class CelestialObjectFactory {
  constructor(textureSystem, objectConfig, animationSystem) {
    this.textureSystem = textureSystem;
    this.objectConfig = objectConfig;
    this.animationSystem = animationSystem;
    this.classCache = new Map();
  }

  // Création de tous les corps célestes avec leurs satellites
  async createAll() {
    const bodies = {};
    const creationPromises = [];

    Logger.info('[CelestialObjectFactory] Creating all celestial bodies...');

    for (const [name, config] of Object.entries(this.objectConfig.bodies)) {
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

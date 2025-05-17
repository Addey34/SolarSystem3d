import CelestialObject from './CelestialObject.js';

export default class CelestialObjectFactory {
  constructor(textureSystem, objectConfig, animationSystem) {
    this.textureSystem = textureSystem;
    this.objectConfig = objectConfig;
    this.animationSystem = animationSystem;
    this.classCache = new Map();
  }

  // Crée tous les corps célestes définis dans la config
  async createAll() {
    const bodies = {};
    const creationPromises = [];
    // Création des corps célestes avec leurs configurations respectives
    for (const [name, config] of Object.entries(this.objectConfig.bodies)) {
      creationPromises.push(
        this.createBodyWithHierarchy(name, config, null, bodies)
      );
    }
    await Promise.all(creationPromises);
    return bodies;
  }

  // Crée un corps céleste et ses satellites récursivement
  async createBodyWithHierarchy(name, config, parentName, bodies) {
    let body;
    try {
      // Créer l'objet céleste en utilisant CelestialObject
      body = new CelestialObject(
        this.textureSystem,
        config,
        name,
        this.animationSystem
      );
      // Ajout des métadonnées utilisateur pour la hiérarchie et propriétés
      body.group.userData = {
        config,
        type: 'celestial-body',
        parent: parentName,
        radius: config.radius,
      };
      bodies[name] = body;
    } catch (error) {
      console.error(`Erreur lors de la création de ${name}`, error);
      return null;
    }
    // Création récursive des satellites s’il y en a
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

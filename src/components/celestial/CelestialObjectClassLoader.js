import { CelestialObject } from './CelestialObject.js';

// Classe pour charger les classes des objets célestes
export class CelestialObjectClassLoader {
  constructor(objectConfig) {
    this.objectConfig = objectConfig;
    this.objectClasses = new Map();
  }

  // Charge les classes des objets célestes
  async loadObjectClasses() {
    const bodies = Object.keys(this.objectConfig.bodies);

    await Promise.all(
      bodies.map(async (name) => {
        try {
          const className = name.charAt(0).toUpperCase() + name.slice(1);
          const module = await import(`./bodies/${className}.js`);
          this.objectClasses.set(name, module.default || module);
        } catch {
          // Fallback à la classe de base
          this.objectClasses.set(name, CelestialObject);
        }
      })
    );
  }

  // Récupère la classe d'un objet céleste
  getObjectClass(name) {
    return this.objectClasses.get(name) || CelestialObject;
  }
}

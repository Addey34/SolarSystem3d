import { CelestialObjectClassLoader } from './CelestialObjectClassLoader.js';

export class CelestialObjectFactory {
  constructor(textures, objectConfig) {
    this.textures = textures;
    this.objectConfig = objectConfig;
    this.objectClassLoader = new CelestialObjectClassLoader(objectConfig);
  }

  async createAll() {
    await this.objectClassLoader.loadObjectClasses();
    const bodies = {};
    const createBody = (name, config, parentName = null) => {
      try {
        const ObjectClass = this.objectClassLoader.getObjectClass(name);
        const body = new ObjectClass(this.textures, config, name);
        body.group.userData = {
          config,
          type: 'celestial-body',
          parent: parentName,
        };
        bodies[name] = body;
        if (config.satellites) {
          Object.entries(config.satellites).forEach(([satName, satConfig]) => {
            createBody(satName, satConfig, name);
          });
        }
        return body;
      } catch (error) {
        console.error(`Failed to create ${name}:`, error);
        return null;
      }
    };

    await Promise.all(
      Object.entries(this.objectConfig.bodies).map(([name, config]) =>
        createBody(name, config)
      )
    );

    return bodies;
  }
}

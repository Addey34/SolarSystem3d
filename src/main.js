import { CelestialObjectFactory } from './components/celestial/CelestialObjectFactory.js';
import { AnimationSystem } from './components/systems/AnimationSystem.js';
import { CameraSystem } from './components/systems/CameraSystem.js';
import { LightingSystem } from './components/systems/LightingSystem.js';
import { SceneSystem } from './components/systems/SceneSystem.js';
import { TextureSystem } from './components/systems/TextureSystem.js';
import { CELESTIAL_CONFIG } from './config/settings.js';

export async function main(progressCallback) {
  try {
    const textureSystem = new TextureSystem(CELESTIAL_CONFIG);
    const textures = await textureSystem.load(progressCallback);
    const sceneSystem = new SceneSystem(CELESTIAL_CONFIG);

    sceneSystem.init(textures);

    const celestialBodies = await new CelestialObjectFactory(
      textures,
      CELESTIAL_CONFIG
    ).createAll();
    sceneSystem.setupCelestialBodies(celestialBodies);

    const lightingSystem = new LightingSystem();
    lightingSystem.setup(sceneSystem.scene, celestialBodies);

    const cameraSystem = new CameraSystem(sceneSystem);
    cameraSystem.init(
      sceneSystem.camera,
      sceneSystem.renderer,
      celestialBodies
    );

    const animationSystem = new AnimationSystem();
    animationSystem.init({
      scene: sceneSystem.scene,
      camera: sceneSystem.camera,
      renderer: sceneSystem.renderer,
      celestialBodies,
      orbitGroups: sceneSystem.orbitGroups,
      lightingSystem,
      sceneSystem,
      cameraSystem,
    });

    animationSystem.run();

    return {
      sceneSystem,
      animationSystem,
      cameraManager: animationSystem.cameraSystem,
      cleanup: () => {
        animationSystem.dispose();
        sceneSystem.dispose();
        textureSystem.dispose();
      },
    };
  } catch (error) {
    console.error('Initialization failed:', error);
    throw error;
  }
}

import { CelestialObjectFactory } from './components/celestial/CelestialObjectFactory.js';
import { AnimationSystem } from './components/systems/AnimationSystem.js';
import { LightingSystem } from './components/systems/LightingSystem.js';
import { SceneSystem } from './components/systems/SceneSystem.js';
import { TextureSystem } from './components/systems/TextureSystem.js';
import { CELESTIAL_CONFIG } from './config/settings.js';

export async function main(progressCallback) {
  try {
    // 1. Chargement des textures
    const textureSystem = new TextureSystem(CELESTIAL_CONFIG);
    const textures = await textureSystem.load(progressCallback);

    // 2. Initialisation de la scène
    const sceneSystem = new SceneSystem(CELESTIAL_CONFIG);
    await sceneSystem.init(textures);

    // 3. Création des objets célestes
    const celestialBodies = await new CelestialObjectFactory(
      textures,
      CELESTIAL_CONFIG
    ).createAll();

    // 4. Configuration de la scène
    sceneSystem.setupCelestialBodies(celestialBodies);
    if (!sceneSystem.targetObject) {
      console.warn(
        'SceneSystem targetObject not initialized, creating fallback'
      );
      sceneSystem.targetObject = new THREE.Object3D();
      sceneSystem.scene.add(sceneSystem.targetObject);
    }

    // 5. Initialisation de l'éclairage
    const lightingSystem = new LightingSystem();
    lightingSystem.setup(sceneSystem.scene, celestialBodies);

    // 6. Configuration des systèmes
    const animationSystem = new AnimationSystem();
    animationSystem.init({
      scene: sceneSystem.scene,
      camera: sceneSystem.camera,
      renderer: sceneSystem.renderer,
      celestialBodies,
      orbitGroups: sceneSystem.orbitGroups,
      lightingSystem,
      sceneSystem,
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

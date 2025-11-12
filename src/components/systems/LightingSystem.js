import * as THREE from 'three';
import { LIGHTING_SETTINGS } from '../../config/settings.js';
import Logger from '../../utils/Logger.js';

export class LightingSystem {
  constructor() {
    this.lights = {};
    this.scene = null;
    Logger.info('[LightingSystem] Instance created ✅');
  }

  setup(scene) {
    if (!scene) {
      Logger.error('[LightingSystem] No scene provided for lighting setup');
      return this;
    }

    this.scene = scene;

    // Ambient light
    this.lights.ambient = new THREE.AmbientLight(
      LIGHTING_SETTINGS.ambient.color,
      LIGHTING_SETTINGS.ambient.intensity
    );
    this.scene.add(this.lights.ambient);
    Logger.success('[LightingSystem] Ambient light added');

    // Sun / Point light
    this.lights.sun = new THREE.PointLight(
      LIGHTING_SETTINGS.sun.color,
      LIGHTING_SETTINGS.sun.intensity,
      LIGHTING_SETTINGS.sun.distance,
      LIGHTING_SETTINGS.sun.decay
    );
    this.lights.sun.position.set(0, 0, 0);
    this.scene.add(this.lights.sun);
    Logger.success('[LightingSystem] Sun light added at (0,0,0)');

    return this;
  }

  dispose() {
    if (!this.scene) return;
    Object.values(this.lights).forEach((light) => {
      this.scene.remove(light);
      if (light.dispose) light.dispose();
    });
    this.lights = {};
    Logger.warn('[LightingSystem] Lights removed and disposed');
  }
}

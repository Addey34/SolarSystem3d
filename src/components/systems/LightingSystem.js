import * as THREE from 'three';
import { LIGHTING_SETTINGS } from '../../config/settings.js';

export class LightingSystem {
  constructor() {
    this.lights = {};
  }

  setup(scene = {}) {
    this.scene = scene;
    this.lights.ambient = new THREE.AmbientLight(
      LIGHTING_SETTINGS.ambient.color,
      LIGHTING_SETTINGS.ambient.intensity
    );
    scene.add(this.lights.ambient);
    this.lights.sun = new THREE.PointLight(
      LIGHTING_SETTINGS.sun.color,
      LIGHTING_SETTINGS.sun.intensity,
      LIGHTING_SETTINGS.sun.distance,
      LIGHTING_SETTINGS.sun.decay
    );
    this.lights.sun.position.set(50, 50, 50);
    scene.add(this.lights.sun);
    return this;
  }
}

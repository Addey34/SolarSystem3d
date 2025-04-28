import * as THREE from 'three';
import { LIGHTING_SETTINGS } from '../../config/settings.js';

// Classe pour gérer l'éclairage
export class LightingSystem {
  constructor() {
    this.lights = {};
  }

  // Initialise l'éclairage
  setup(scene = {}) {
    this.scene = scene;
    // 1. Lumière ambiante de base
    this.lights.ambient = new THREE.AmbientLight(
      LIGHTING_SETTINGS.ambient.color,
      LIGHTING_SETTINGS.ambient.intensity
    );
    scene.add(this.lights.ambient);
    return this;
  }
}

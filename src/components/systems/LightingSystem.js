/**
 * @fileoverview Système d'éclairage de la scène.
 * Configure l'éclairage ambiant et la lumière ponctuelle du soleil.
 */

import * as THREE from 'three';
import { LIGHTING_SETTINGS } from '../../config/settings.js';
import Logger from '../../utils/Logger.js';

/**
 * Système gérant l'éclairage de la scène 3D.
 * Comprend une lumière ambiante globale et une lumière ponctuelle au centre (soleil).
 */
export class LightingSystem {
  /**
   * Crée une nouvelle instance du système d'éclairage.
   */
  constructor() {
    /** @type {Object} Dictionnaire des lumières créées */
    this.lights = {};

    /** @type {THREE.Scene|null} Référence à la scène */
    this.scene = null;

    Logger.info('[LightingSystem] Instance created ✅');
  }

  /**
   * Configure et ajoute les lumières à la scène.
   * @param {THREE.Scene} scene - La scène Three.js
   * @returns {LightingSystem} Cette instance pour le chaînage
   */
  setup(scene) {
    if (!scene) {
      Logger.error('[LightingSystem] No scene provided for lighting setup');
      return this;
    }

    this.scene = scene;

    // Lumière ambiante : éclaire uniformément tous les objets
    // Permet de voir les faces non éclairées par le soleil
    this.lights.ambient = new THREE.AmbientLight(
      LIGHTING_SETTINGS.ambient.color,
      LIGHTING_SETTINGS.ambient.intensity
    );
    this.scene.add(this.lights.ambient);
    Logger.success('[LightingSystem] Ambient light added');

    // Lumière ponctuelle du soleil : source principale d'éclairage
    // Positionnée au centre (0,0,0) où se trouve le soleil
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

  /**
   * Supprime et nettoie toutes les lumières de la scène.
   */
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

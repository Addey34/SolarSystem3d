/**
 * @fileoverview Système d'éclairage de la scène.
 * Configure l'éclairage ambiant et la lumière ponctuelle du soleil avec ombres.
 */

import * as THREE from 'three';
import { LIGHTING_SETTINGS } from '../../config/settings.js';
import Logger from '../../utils/Logger.js';

/**
 * Système gérant l'éclairage de la scène 3D.
 * Comprend une lumière ambiante globale et une lumière ponctuelle au centre (soleil).
 * Supporte le shadow mapping pour les ombres projetées.
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
    const shadowConfig = LIGHTING_SETTINGS.sun.shadow;

    // Lumière ambiante : éclaire uniformément tous les objets
    // Très faible pour un bon contraste jour/nuit
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

    // Configuration des ombres pour la lumière du soleil
    if (shadowConfig?.enabled) {
      this.lights.sun.castShadow = true;
      this.lights.sun.shadow.mapSize.width = shadowConfig.mapSize;
      this.lights.sun.shadow.mapSize.height = shadowConfig.mapSize;
      this.lights.sun.shadow.bias = shadowConfig.bias;
      this.lights.sun.shadow.normalBias = shadowConfig.normalBias ?? 0;
      this.lights.sun.shadow.radius = shadowConfig.radius;
      this.lights.sun.shadow.camera.near = shadowConfig.near;
      this.lights.sun.shadow.camera.far = shadowConfig.far;
      Logger.success(`[LightingSystem] Shadow mapping enabled (${shadowConfig.mapSize}px)`);
    }

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

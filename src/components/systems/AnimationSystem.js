/**
 * @fileoverview Système d'animation gérant la boucle de rendu principale.
 * Coordonne les mises à jour de tous les objets animés, les tweens,
 * le LOD des textures et le rendu de la scène.
 */

import { Group as TweenGroup } from '@tweenjs/tween.js';
import * as THREE from 'three';
import { FPSCounter } from '../../utils/FPSCounter.js';
import Logger from '../../utils/Logger.js';

// ============================================================================
// CONSTANTES
// ============================================================================

/** Intervalle de mise à jour LOD (en frames) */
const LOD_UPDATE_INTERVAL = 5;

/** Distance maximale pour les mises à jour LOD */
const LOD_MAX_DISTANCE = 100;

/** Seuil de changement de distance pour déclencher un LOD update */
const LOD_DISTANCE_THRESHOLD = 5;

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

/**
 * Système central gérant la boucle d'animation et le rendu.
 * Utilise requestAnimationFrame avec limitation de FPS configurable.
 */
export class AnimationSystem {
  /**
   * Crée une nouvelle instance du système d'animation.
   * @param {number} [targetFPS=60] - FPS cible pour la limitation
   */
  constructor(targetFPS = 60) {
    // Timing
    this.clock = new THREE.Clock();
    this.targetFPS = targetFPS;
    this.lastFrameTime = 0;
    this.lodUpdateFrame = 0;

    // État
    this.isRunning = false;
    this.animationFrame = null;

    // Objets à mettre à jour
    this.updatables = new Set();

    // Systèmes externes
    this.tweenGroup = new TweenGroup();
    this.fpsCounter = new FPSCounter();

    // Vecteurs réutilisés (optimisation mémoire)
    this._cameraPos = new THREE.Vector3();
    this._sunWorldPos = new THREE.Vector3();

    Logger.info('[AnimationSystem] Instance created ✅');
  }

  // ==========================================================================
  // INITIALISATION
  // ==========================================================================

  /**
   * Initialise le système avec les références nécessaires.
   */
  init({ scene, camera, renderer, cameraSystem, celestialBodies, sceneSystem }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.cameraSystem = cameraSystem;
    this.celestialBodies = celestialBodies;
    this.sceneSystem = sceneSystem;

    // Partager le tweenGroup avec le système de caméra
    if (this.cameraSystem) {
      this.cameraSystem.tweenGroup = this.tweenGroup;
    }

    this.fpsCounter.init();
    Logger.success('[AnimationSystem] Initialized');
  }

  // ==========================================================================
  // BOUCLE D'ANIMATION
  // ==========================================================================

  /**
   * Démarre la boucle d'animation.
   */
  run() {
    if (this.isRunning) {
      Logger.warn('[AnimationSystem] Already running');
      return;
    }

    this.isRunning = true;
    this.clock.start();
    Logger.info('[AnimationSystem] Starting animation loop');
    this._animate();
  }

  /**
   * Boucle principale d'animation (requestAnimationFrame).
   * @private
   */
  _animate() {
    this.animationFrame = requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();
    const now = performance.now();
    const frameInterval = 1000 / this.targetFPS;

    // Mise à jour des tweens
    this.tweenGroup.update(now);

    // Limitation du frame rate
    if (now - this.lastFrameTime >= frameInterval) {
      this._update(delta);
      this._render();
      this.fpsCounter.update(now);
      this.lastFrameTime = now;
    }
  }

  // ==========================================================================
  // MISE À JOUR
  // ==========================================================================

  /**
   * Met à jour tous les objets de la scène.
   * @private
   */
  _update(delta) {
    if (!this.camera) {
      Logger.warn('[AnimationSystem] Camera not defined');
      return;
    }

    // Position du soleil pour les shaders de lumières nocturnes
    const sunWorldPosition = this._getSunWorldPosition();

    // Mise à jour des objets triés par distance (plus proche en premier)
    this._updateObjects(delta, sunWorldPosition);

    // Mise à jour du système de caméra
    this.cameraSystem?.update?.(delta);

    // Mise à jour LOD périodique
    this._updateLOD();
  }

  /**
   * Récupère la position mondiale du soleil.
   * @private
   * @returns {THREE.Vector3|null}
   */
  _getSunWorldPosition() {
    const sunBody = this.celestialBodies?.sun;
    if (!sunBody?.group) return null;

    sunBody.group.getWorldPosition(this._sunWorldPos);
    return this._sunWorldPos;
  }

  /**
   * Met à jour tous les objets animés, triés par distance.
   * @private
   */
  _updateObjects(delta, sunWorldPosition) {
    this._cameraPos.copy(this.camera.position);

    // Tri par distance (plus proche = priorité)
    const sorted = Array.from(this.updatables).sort((a, b) => {
      const distA = a.group?.position.distanceToSquared(this._cameraPos) ?? Infinity;
      const distB = b.group?.position.distanceToSquared(this._cameraPos) ?? Infinity;
      return distA - distB;
    });

    for (const obj of sorted) {
      if (typeof obj.update === 'function') {
        obj.update(delta, sunWorldPosition);
      }
    }
  }

  /**
   * Met à jour le LOD des textures (tous les N frames).
   * @private
   */
  _updateLOD() {
    this.lodUpdateFrame++;
    if (this.lodUpdateFrame % LOD_UPDATE_INTERVAL !== 0) return;

    if (!this.celestialBodies) return;

    for (const body of Object.values(this.celestialBodies)) {
      if (typeof body.updateLODTextures === 'function' && body.group) {
        body.updateLODTextures(this.camera, LOD_MAX_DISTANCE, LOD_DISTANCE_THRESHOLD);
      }
    }
  }

  // ==========================================================================
  // RENDU
  // ==========================================================================

  /**
   * Effectue le rendu de la scène.
   * @private
   */
  _render() {
    if (!this.scene || !this.camera || !this.renderer) {
      Logger.warn('[AnimationSystem] Missing scene/camera/renderer');
      return;
    }
    this.renderer.render(this.scene, this.camera);
  }

  // ==========================================================================
  // GESTION DES OBJETS
  // ==========================================================================

  /**
   * Ajoute un objet à la liste des objets à mettre à jour.
   * @param {Object} obj - Objet avec une méthode update()
   */
  addUpdatable(obj) {
    if (typeof obj.update !== 'function') {
      Logger.warn('[AnimationSystem] Object ignored (no update method)');
      return;
    }
    this.updatables.add(obj);
  }

  /**
   * Retire un objet de la liste des mises à jour.
   * @param {Object} obj - Objet à retirer
   */
  removeUpdatable(obj) {
    this.updatables.delete(obj);
  }

  // ==========================================================================
  // NETTOYAGE
  // ==========================================================================

  /**
   * Arrête l'animation et libère les ressources.
   */
  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.updatables.clear();
    this.fpsCounter.dispose();
    this.isRunning = false;

    Logger.warn('[AnimationSystem] Disposed');
  }
}

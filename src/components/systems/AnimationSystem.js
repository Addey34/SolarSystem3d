/**
 * @fileoverview Système d'animation gérant la boucle de rendu principale.
 * Coordonne les mises à jour de tous les objets animés, les tweens,
 * le LOD des textures et le rendu de la scène.
 */

import { Group as TweenGroup } from '@tweenjs/tween.js';
import * as THREE from 'three';
import { FPSCounter } from '../../utils/FPSCounter.js';
import Logger from '../../utils/Logger.js';

/**
 * Système central gérant la boucle d'animation et le rendu.
 * Utilise requestAnimationFrame avec limitation de FPS configurable.
 */
export class AnimationSystem {
  /**
   * Crée une nouvelle instance du système d'animation.
   * @param {number} [targetFPS=60] - FPS cible pour la limitation de frame rate
   */
  constructor(targetFPS = 60) {
    /** @type {THREE.Clock} Horloge Three.js pour calculer le delta time */
    this.clock = new THREE.Clock();

    /** @type {Set<Object>} Ensemble des objets à mettre à jour chaque frame */
    this.updatables = new Set();

    /** @type {FPSCounter} Compteur de FPS affiché à l'écran */
    this.fpsCounter = new FPSCounter();

    /** @type {number} FPS cible pour la limitation */
    this.targetFPS = targetFPS;

    /** @type {number} Timestamp de la dernière frame rendue */
    this.lastFrameTime = 0;

    /** @type {boolean} Indique si la boucle d'animation est active */
    this.isRunning = false;

    /** @type {TweenGroup} Groupe de tweens pour les animations de caméra */
    this.tweenGroup = new TweenGroup();

    // Vecteurs réutilisés pour éviter les allocations mémoire dans la boucle
    /** @type {THREE.Vector3} Position de la caméra (réutilisé) */
    this._cameraPos = new THREE.Vector3();

    /** @type {THREE.Vector3} Position monde temporaire (réutilisé) */
    this._worldPos = new THREE.Vector3();

    Logger.info('[AnimationSystem] Instance created ✅');
  }

  init({
    scene,
    camera,
    renderer,
    cameraSystem,
    celestialBodies,
    sceneSystem,
  }) {
    Logger.info('[AnimationSystem] Initializing...');
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.cameraSystem = cameraSystem;
    this.celestialBodies = celestialBodies;
    this.sceneSystem = sceneSystem;
    this.lodUpdateFrame = 0;

    // Passer le tweenGroup au CameraSystem (déjà initialisé dans SolarSystemApp)
    if (this.cameraSystem) {
      this.cameraSystem.tweenGroup = this.tweenGroup;
    }

    this.fpsCounter.init();
    Logger.success('[AnimationSystem] Initialization complete');
  }

  run() {
    if (this.isRunning) {
      Logger.warn('[AnimationSystem] Already running');
      return;
    }
    this.isRunning = true;
    this.clock.start();
    Logger.info('[AnimationSystem] Starting animation loop');
    this.animate();
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    const now = performance.now();
    const frameInterval = 1000 / this.targetFPS;

    this.tweenGroup.update(now);

    if (now - this.lastFrameTime >= frameInterval) {
      this.update(delta);
      this.render();
      this.fpsCounter.update(now);
      this.lastFrameTime = now;
    }
  }

  update(delta) {
    if (!this.camera) {
      Logger.warn('[AnimationSystem] Camera not defined in update');
      return;
    }

    this._cameraPos.copy(this.camera.position);
    const sorted = Array.from(this.updatables).sort((a, b) => {
      const distA =
        a.group?.position.distanceToSquared(this._cameraPos) ?? Infinity;
      const distB =
        b.group?.position.distanceToSquared(this._cameraPos) ?? Infinity;
      return distA - distB;
    });

    for (const obj of sorted) {
      if (typeof obj.update === 'function') {
        obj.update(delta, this._cameraPos);
      } else {
        Logger.warn(
          '[AnimationSystem] Updatable object without update method',
          obj
        );
      }
    }
    if (typeof this.cameraSystem?.update === 'function') {
      this.cameraSystem.update(delta);
    }

    this.lodUpdateFrame++;
    if (this.lodUpdateFrame % 5 === 0) {
      this.updateCelestialBodiesLOD();
    }
  }

  updateCelestialBodiesLOD() {
    if (!this.celestialBodies || Object.keys(this.celestialBodies).length === 0) {
      return;
    }

    for (const celestialBody of Object.values(this.celestialBodies)) {
      if (
        typeof celestialBody.updateLODTextures === 'function'
        && celestialBody.group
      ) {
        celestialBody.updateLODTextures(this.camera, 100, 5);
      }
    }
  }

  render() {
    if (!this.scene || !this.camera || !this.renderer) {
      Logger.warn(
        '[AnimationSystem] Scene, camera or renderer missing in render()'
      );
      return;
    }
    this.renderer.render(this.scene, this.camera);
  }

  addUpdatable(obj) {
    if (typeof obj.update === 'function') {
      this.updatables.add(obj);
      Logger.debug('[AnimationSystem] Updatable added', obj);
    } else {
      Logger.warn('[AnimationSystem] Ignored object (no update method)', obj);
    }
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.updatables.clear();
    this.fpsCounter.dispose();
    this.isRunning = false;
    Logger.warn('[AnimationSystem] Animation stopped and resources cleared');
  }
}

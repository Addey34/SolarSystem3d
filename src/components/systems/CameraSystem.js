/**
 * @fileoverview Système de contrôle de la caméra avec suivi de cible.
 * Gère les OrbitControls, les animations de transition entre planètes,
 * et le suivi fluide des corps célestes en mouvement.
 */

import TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  CAMERA_CONTROLS_SETTINGS,
  CAMERA_SETTINGS,
} from '../../config/settings.js';
import Logger from '../../utils/Logger.js';

/**
 * Système de contrôle de la caméra.
 * Permet la navigation orbitale autour des corps célestes avec transitions animées.
 */
export class CameraSystem {
  /**
   * Crée une nouvelle instance du système de caméra.
   * Les contrôles sont initialisés plus tard via init().
   */
  constructor() {
    /** @type {OrbitControls|null} Contrôles orbitaux Three.js */
    this.controls = null;

    /** @type {boolean} Indique si une animation de transition est en cours */
    this.isAnimating = false;

    /** @type {Object|null} Cible actuelle de la caméra {name, group, distance} */
    this.currentTarget = null;

    /** @type {number} Facteur de lissage pour le suivi */
    this.smoothness = CAMERA_CONTROLS_SETTINGS.smoothness;

    /** @type {number} Multiplicateur de distance minimale basé sur le rayon */
    this.minDistanceMultiplier = CAMERA_CONTROLS_SETTINGS.minDistanceMultiplier;

    /** @type {boolean} Indique si le système est initialisé */
    this.initialized = false;

    // Vecteurs pour le suivi fluide de la cible
    /** @type {THREE.Vector3} Position monde actuelle de la cible */
    this.targetWorldPosition = new THREE.Vector3();

    /** @type {THREE.Vector3} Position lissée pour les transitions */
    this.smoothTargetPosition = new THREE.Vector3();

    /** @type {THREE.Vector3} Décalage caméra-cible conservé pendant le suivi */
    this.cameraOffset = new THREE.Vector3();

    /** @type {THREE.Vector3} Dernière position connue de la cible */
    this.lastTargetPosition = new THREE.Vector3();

    Logger.info('[CameraSystem] Camera instance created ✅');
  }

  init(
    camera,
    renderer,
    celestialBodies,
    sceneSystem = null,
    tweenGroup = null,
    animationSystem = null
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.celestialBodies = celestialBodies;
    this.sceneSystem = sceneSystem;
    this.tweenGroup = tweenGroup;
    this.animationSystem = animationSystem;

    this.initializeControls();
    this.initialized = true;
    Logger.success('[CameraSystem] Initialized camera and controls');
  }

  initializeControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.screenSpacePanning =
      CAMERA_CONTROLS_SETTINGS.screenSpacePanning;
    this.controls.maxPolarAngle = CAMERA_CONTROLS_SETTINGS.maxPolarAngle;
    this.controls.minPolarAngle = CAMERA_CONTROLS_SETTINGS.minPolarAngle;
    this.controls.enablePan = CAMERA_CONTROLS_SETTINGS.enablePan;
    this.controls.enableZoom = CAMERA_CONTROLS_SETTINGS.enableZoom;
    this.controls.enableRotate = CAMERA_CONTROLS_SETTINGS.enableRotate;
    this.controls.minDistance = CAMERA_CONTROLS_SETTINGS.minDistance;
    this.controls.maxDistance = CAMERA_CONTROLS_SETTINGS.maxDistance;
    this.controls.rotateSpeed = CAMERA_CONTROLS_SETTINGS.rotateSpeed || 0.8;
    this.controls.zoomSpeed = CAMERA_CONTROLS_SETTINGS.zoomSpeed || 1.0;
    this.controls.target.set(0, 0, 0);
    this.smoothTargetPosition.set(0, 0, 0);
    Logger.debug('[CameraSystem] OrbitControls configured');
  }

  setTarget(bodyName) {
    const body = this.celestialBodies[bodyName]?.group;
    if (!body) {
      Logger.warn(`[CameraSystem] Body "${bodyName}" not found`);
      return;
    }

    body.updateWorldMatrix(true, false);
    body.getWorldPosition(this.targetWorldPosition);
    const radius = body.userData?.radius || 1;
    const defaultDistance = this.getDefaultDistance(bodyName);
    const minDistance = radius * this.minDistanceMultiplier;
    const distance = Math.max(defaultDistance, minDistance);
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize();
    if (direction.length() < 0.1) {
      direction.set(1, 0.3, 1).normalize();
    }

    const cameraPosition = this.targetWorldPosition
      .clone()
      .add(direction.multiplyScalar(distance));

    this.currentTarget = {
      name: bodyName,
      group: body,
      distance,
    };
    this.cameraOffset.subVectors(cameraPosition, this.targetWorldPosition);
    this.lastTargetPosition.copy(this.targetWorldPosition);
    Logger.info(
      `[CameraSystem] Animating camera to: ${bodyName}, distance: ${distance.toFixed(
        1
      )}`
    );
    this.animateToTarget(cameraPosition, this.targetWorldPosition.clone());
  }

  animateToTarget(cameraPosition, targetPosition) {
    this.isAnimating = true;

    if (this.controls) {
      this.controls.enabled = false;
    }

    const cameraTween = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    };

    const cameraTo = {
      x: cameraPosition.x,
      y: cameraPosition.y,
      z: cameraPosition.z,
    };

    const targetTween = {
      x: this.smoothTargetPosition.x,
      y: this.smoothTargetPosition.y,
      z: this.smoothTargetPosition.z,
    };

    const targetTo = {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
    };

    new TWEEN.Tween(cameraTween, this.tweenGroup)
      .to(cameraTo, 1200)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        this.camera.position.set(cameraTween.x, cameraTween.y, cameraTween.z);
      })
      .start();

    new TWEEN.Tween(targetTween, this.tweenGroup)
      .to(targetTo, 1200)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        this.smoothTargetPosition.set(
          targetTween.x,
          targetTween.y,
          targetTween.z
        );
        if (this.controls) {
          this.controls.target.copy(this.smoothTargetPosition);
        }
      })
      .onComplete(() => {
        this.isAnimating = false;
        if (this.currentTarget?.group) {
          this.currentTarget.group.getWorldPosition(this.lastTargetPosition);
        }
        if (this.controls) {
          this.controls.enabled = true;
        }
        Logger.success('[CameraSystem] Camera animation completed');
      })
      .start();
  }

  update(delta) {
    if (!this.controls) return;

    if (this.currentTarget?.group && !this.isAnimating) {
      const offsetX = this.camera.position.x - this.controls.target.x;
      const offsetY = this.camera.position.y - this.controls.target.y;
      const offsetZ = this.camera.position.z - this.controls.target.z;

      this.currentTarget.group.getWorldPosition(this.targetWorldPosition);

      this.controls.target.copy(this.targetWorldPosition);

      this.camera.position.x = this.targetWorldPosition.x + offsetX;
      this.camera.position.y = this.targetWorldPosition.y + offsetY;
      this.camera.position.z = this.targetWorldPosition.z + offsetZ;
    }

    this.controls.update();
  }

  getDefaultDistance(bodyName) {
    return CAMERA_SETTINGS.bodyDistances[bodyName] ?? 10;
  }

  dispose() {
    if (this.controls) this.controls.dispose();
    Logger.warn('[CameraSystem] Controls disposed');
  }
}

import TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMERA_SETTINGS } from '../../config/settings.js';

export class CameraSystem {
  constructor() {
    this.controls = null;
    this.isAnimating = false;
    this.currentTarget = null;
    this.smoothness = 0.1;
    this.minDistanceMultiplier = 1;
    this.userControlledZoom = false;
    this.initialized = false;
    this.targetObject = new THREE.Object3D();
    this.targetObject.position.set(0, 0, 0);
  }

  // Initialisation du système caméra avec la caméra, renderer, corps célestes et système de scène (optionnel)
  init(camera, renderer, celestialBodies, sceneSystem = null) {
    this.camera = camera;
    this.renderer = renderer;
    this.celestialBodies = celestialBodies;
    // Si pas de système de scène passé, on crée un fallback avec un updateCameraTarget basique
    this.sceneSystem = sceneSystem || {
      targetObject: this.targetObject,
      updateCameraTarget: (pos) => {
        this.targetObject.position.copy(pos);
        this.camera.lookAt(this.targetObject.position);
      },
    };
    this.initializeControls();
    // Si un système de scène avec targetObject est fourni, on remplace celui par défaut
    if (sceneSystem?.targetObject) {
      this.targetObject = sceneSystem.targetObject;
    }
    this.initialized = true;
  }

  // Configuration des contrôles orbitaux de la caméra (souris / tactile)
  initializeControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.target.copy(this.targetObject.position);
    this.controls.maxPolarAngle = Math.PI;
    this.controls.minPolarAngle = 0;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.minDistance = 0;
    this.controls.maxDistance = 1000;
  }

  // Change la cible de la caméra vers un corps céleste donné
  setTarget(bodyName) {
    const body = this.celestialBodies[bodyName]?.group;
    if (!body) {
      console.error(`[CameraSystem] Corps céleste "${bodyName}" introuvable`);
      return;
    }
    const targetPosition = new THREE.Vector3();
    body.getWorldPosition(targetPosition);
    const radius = body.userData?.radius || 1;
    const defaultDistance = this.getDefaultDistance(bodyName);
    const minDistance = radius * this.minDistanceMultiplier;
    const distance = Math.max(defaultDistance, minDistance);
    const direction = new THREE.Vector3(0, 0, 1).normalize();
    const cameraPosition = targetPosition
      .clone()
      .add(direction.multiplyScalar(distance));
    this.currentTarget = {
      name: bodyName,
      group: body,
      distance,
      position: targetPosition,
    };
    this.animateToTarget(cameraPosition, targetPosition);
  }

  // Animation en douceur de la caméra vers une position cible avec TWEEN.js
  animateToTarget(cameraPosition, targetPosition) {
    this.isAnimating = true;
    new TWEEN.Tween(this.camera.position)
      .to(cameraPosition, 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();
    new TWEEN.Tween(this.targetObject.position)
      .to(targetPosition, 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        if (this.controls) {
          this.controls.target.copy(this.targetObject.position);
          this.controls.update();
        }
      })
      .onComplete(() => {
        this.isAnimating = false;
        if (this.controls) {
          this.controls.enabled = true;
        }
      })
      .start();
  }

  update(delta) {
    if (!this.currentTarget || !this.sceneSystem) return;
    this.currentTarget.group.getWorldPosition(this.currentTarget.position);
    this.sceneSystem.updateCameraTarget(this.currentTarget.position);
    if (this.controls) {
      this.controls.target.copy(this.targetObject.position);
      this.controls.update();
    }
  }

  getDefaultDistance(bodyName) {
    return CAMERA_SETTINGS.bodyDistances[bodyName];
  }

  dispose() {
    if (this.controls) this.controls.dispose();
  }
}

import TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMERA_SETTINGS } from '../../config/settings.js';
import Logger from '../../utils/Logger.js';

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
    Logger.info('[CameraSystem] Camera instance created ✅');
  }

  init(
    camera,
    renderer,
    celestialBodies,
    sceneSystem = null,
    tweenGroup = null
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.celestialBodies = celestialBodies;
    this.sceneSystem = sceneSystem || {
      targetObject: this.targetObject,
      updateCameraTarget: (pos) => {
        this.targetObject.position.copy(pos);
        this.camera.lookAt(this.targetObject.position);
      },
    };
    this.tweenGroup = tweenGroup;
    this.initializeControls();
    if (sceneSystem?.targetObject) {
      this.targetObject = sceneSystem.targetObject;
    }
    this.initialized = true;
    Logger.success('[CameraSystem] Initialized camera and controls');
  }

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
    this.controls.minDistance = 2;
    this.controls.maxDistance = 1000;
    Logger.debug('[CameraSystem] OrbitControls configured');
  }

  setTarget(bodyName) {
    const body = this.celestialBodies[bodyName]?.group;
    if (!body) {
      Logger.warn(`[CameraSystem] Body "${bodyName}" not found`);
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

    Logger.info(
      `[CameraSystem] Animating camera to target: ${bodyName} at distance ${distance}`
    );
    this.animateToTarget(cameraPosition, targetPosition);
  }

  animateToTarget(cameraPosition, targetPosition) {
    this.isAnimating = true;
    const from = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    };

    const to = {
      x: cameraPosition.x,
      y: cameraPosition.y,
      z: cameraPosition.z,
    };

    new TWEEN.Tween(from, this.tweenGroup)
      .to(to, 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.camera.position.set(from.x, from.y, from.z);
        if (this.controls) this.controls.update();
      })
      .onComplete(() => {
        this.isAnimating = false;
        if (this.controls) {
          this.controls.target.copy(this.targetObject.position);
          this.controls.update();
          this.controls.enabled = true;
        }
        Logger.success('[CameraSystem] Camera animation completed');
      })
      .start();

    new TWEEN.Tween(this.targetObject.position, this.tweenGroup)
      .to(targetPosition, 1000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        if (this.controls) {
          this.controls.target.copy(this.targetObject.position);
          this.controls.update();
        }
      })
      .start();
  }

  update(_delta) {
    if (!this.currentTarget || !this.sceneSystem) return;
    this.currentTarget.group.getWorldPosition(this.currentTarget.position);
    this.sceneSystem.updateCameraTarget(this.currentTarget.position);

    if (this.controls) {
      if (!this.isAnimating && !this.userControlledZoom) {
        this.controls.target.copy(this.targetObject.position);
      }
      this.controls.update();
    }
  }

  getDefaultDistance(bodyName) {
    return CAMERA_SETTINGS.bodyDistances[bodyName];
  }

  dispose() {
    if (this.controls) this.controls.dispose();
    Logger.warn('[CameraSystem] Controls disposed');
  }
}

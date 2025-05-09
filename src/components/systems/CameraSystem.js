import TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Classe pour gérer la caméra
export class CameraSystem {
  constructor() {
    this.controls = null;
    this.targetObject = new THREE.Object3D();
    this.isAnimating = false;
    this.animationTween = null;
    this.defaultDistance = 40;
    this.currentTarget = null;
    this.smoothness = 0.1;
    this.fixedDistance = false;
    this.minDistanceMultiplier = 3;
    this.userControlledZoom = false;
  }

  init(camera, renderer, celestialBodies, sceneSystem) {
    this.camera = camera;
    this.renderer = renderer;
    this.celestialBodies = celestialBodies;
    this.sceneSystem = sceneSystem;
    this.targetObject = sceneSystem?.targetObject || new THREE.Object3D();
    this.initializeControls();
    this.camera.position.set(0, 50, 200);
    this.setTarget('sun');
  }

  initializeControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.minPolarAngle = 0;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.target.copy(this.targetObject.position);
  }

  update(delta) {
    const targetPosition = new THREE.Vector3();
    this.currentTarget.group.getWorldPosition(targetPosition);
    this.targetObject.position.copy(targetPosition);
    if (this.controls) {
      this.controls.target.copy(this.targetObject.position);
      this.controls.update();
    }
  }

  setTarget(bodyName) {
    const body = this.celestialBodies[bodyName]?.group;
    let distance = this.getDefaultDistance(bodyName);
    if (body.userData?.radius) {
      const minDistance = body.userData.radius * this.minDistanceMultiplier;
      distance = Math.max(distance, minDistance);
    }

    // Sauvegarde la distance cible
    this.targetDistance = distance;
    // Position et direction
    const targetPosition = new THREE.Vector3();
    body.getWorldPosition(targetPosition);
    const currentDirection = this.userControlledZoom
      ? new THREE.Vector3()
          .subVectors(this.camera.position, this.targetObject.position)
          .normalize()
      : new THREE.Vector3(0.2, 0.3, 1).normalize();
    this.currentTarget = {
      name: bodyName,
      group: body,
      distance: distance,
      position: targetPosition,
    };
    const cameraPosition = targetPosition
      .clone()
      .add(currentDirection.multiplyScalar(distance));
    this.animateToTarget(cameraPosition, targetPosition);
  }

  updateCameraPosition() {
    if (!this.currentTarget) {
      return;
    }
    // Force la mise à jour des matrices
    this.currentTarget.group.updateMatrixWorld(true);
    // Récupère la position actuelle
    const targetPosition = new THREE.Vector3();
    this.currentTarget.group.getWorldPosition(targetPosition);
    this.currentTarget.position.copy(targetPosition);
    // Calcule la position de la caméra
    const cameraDirection = new THREE.Vector3()
      .subVectors(this.camera.position, targetPosition)
      .normalize();
    // Si la direction est nulle (première fois), utilise une direction par défaut
    if (cameraDirection.length() < 0.1) {
      cameraDirection.set(0.2, 0.3, 1).normalize();
    }
    const cameraPosition = targetPosition
      .clone()
      .add(cameraDirection.multiplyScalar(this.currentTarget.distance));
    this.animateToTarget(cameraPosition, targetPosition);
  }

  animateToTarget(cameraPosition, targetPosition) {
    if (this.animationTween) {
      this.animationTween.stop();
    }
    this.isAnimating = true;
    // Utilisation d'une approche plus fluide avec interpolation
    const startPos = this.camera.position.clone();
    const startTarget = this.targetObject.position.clone();
    const duration = 1000;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const t =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      this.camera.position.lerpVectors(startPos, cameraPosition, t);
      this.targetObject.position.lerpVectors(startTarget, targetPosition, t);
      // Mise à jour des contrôles
      if (this.controls) {
        this.controls.target.copy(this.targetObject.position);
      }
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        if (this.controls) {
          this.controls.enabled = true;
          this.controls.target.copy(targetPosition);
          this.controls.update();
        }
      }
    };
    if (this.controls) {
      this.controls.enabled = false;
    }
    requestAnimationFrame(animate);
  }

  getDefaultDistance(bodyName) {
    const distances = {
      sun: 40,
      mercury: 5,
      venus: 10,
      earth: 10,
      moon: 5,
      mars: 5,
      jupiter: 15,
      saturn: 15,
      uranus: 10,
      neptune: 10,
    };
    const distance = distances[bodyName] || this.defaultDistance;
    return distance;
  }

  dispose() {
    if (this.animationTween) {
      this.animationTween.stop();
    }
    if (this.controls) {
      this.controls.dispose();
    }
    TWEEN.removeAll();
    if (this.targetObject.parent) {
      this.targetObject.parent.remove(this.targetObject);
    }
    console.groupEnd();
  }
}

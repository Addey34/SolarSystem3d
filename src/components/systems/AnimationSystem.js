import TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { FPSCounter } from '../utils/FPSCounter.js';
import { CameraSystem } from './CameraSystem.js';

export class AnimationSystem {
  constructor() {
    this.clock = new THREE.Clock();
    this.fpsCounter = new FPSCounter();
    this.animationFrameId = null;
    this.isRunning = false;
    this.cameraSystem = new CameraSystem();
    console.groupEnd();
  }

  init({
    scene,
    camera,
    renderer,
    celestialBodies,
    orbitGroups,
    lightingSystem,
    sceneSystem,
  }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.celestialBodies = celestialBodies;
    this.orbitGroups = orbitGroups;
    this.lightingSystem = lightingSystem;
    this.fpsCounter.init();
    this.cameraSystem.init(
      this.camera,
      this.renderer,
      this.celestialBodies,
      sceneSystem
    );
  }

  run() {
    this.isRunning = true;
    this.clock.start();
    this.fpsCounter.reset();
    this.animate();
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    this.update(delta);
    this.render();
    this.fpsCounter.update(performance.now(), this.renderer);
  }

  update(delta) {
    Object.entries(this.orbitGroups).forEach(([name, group]) => {
      if (group) {
        group.updateMatrixWorld();
      } else {
        console.warn(`Orbit group "${name}" is null`);
      }
    });
    // Mise à jour des corps célestes
    Object.entries(this.celestialBodies).forEach(([name, body]) => {
      if (body?.group) {
        body.group.updateMatrixWorld(true);
      } else {
        console.warn(`Celestial body "${name}" has no group`);
      }
    });
    // Mise à jour des contrôles
    if (this.cameraSystem.controls && !this.cameraSystem.isAnimating) {
      this.cameraSystem.controls.update();
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.fpsCounter.dispose();
    this.cameraSystem.dispose();
    TWEEN.removeAll();
  }
}

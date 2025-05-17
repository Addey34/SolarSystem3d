import * as THREE from 'three';
import { FPSCounter } from '../utils/FPSCounter.js';

export class AnimationSystem {
  constructor(targetFPS = 60) {
    this.clock = new THREE.Clock();
    this.updatables = new Set();
    this.fpsCounter = new FPSCounter();
    this.targetFPS = targetFPS;
    this.lastFrameTime = 0;
    this.isRunning = false;
  }

  init({ scene, camera, renderer, cameraSystem }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.cameraSystem = cameraSystem;
    this.fpsCounter.init();
  }

  run() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    const now = performance.now();
    const frameInterval = 1000 / this.targetFPS;
    if (now - this.lastFrameTime >= frameInterval) {
      this.update(delta);
      this.render();
      this.fpsCounter.update(now, this.renderer);
      this.lastFrameTime = now;
    }
  }

  update(delta) {
    if (!this.camera) {
      console.warn('[AnimationSystem] Caméra non définie dans update.');
      return;
    }
    const cameraPos = this.camera.position.clone();
    const sorted = Array.from(this.updatables).sort((a, b) => {
      const distA = a.group?.position.distanceToSquared(cameraPos) ?? Infinity;
      const distB = b.group?.position.distanceToSquared(cameraPos) ?? Infinity;
      return distA - distB;
    });
    for (const obj of sorted) {
      if (typeof obj.update === 'function') {
        obj.update(delta, cameraPos);
      }
    }
    if (typeof this.cameraSystem?.update === 'function') {
      this.cameraSystem.update(delta);
    }
  }

  render() {
    if (!this.scene || !this.camera || !this.renderer) {
      console.warn(
        '[AnimationSystem] Scène, caméra ou renderer manquants dans render().'
      );
      return;
    }
    this.renderer.render(this.scene, this.camera);
  }

  addUpdatable(obj) {
    if (typeof obj.update === 'function') {
      this.updatables.add(obj);
    } else {
      console.warn(
        '[AnimationSystem] Objet ignoré (pas de méthode update).',
        obj
      );
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
  }
}

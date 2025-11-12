import { Group as TweenGroup } from '@tweenjs/tween.js';
import * as THREE from 'three';
import { FPSCounter } from '../../utils/FPSCounter.js';
import Logger from '../../utils/Logger.js';

export class AnimationSystem {
  constructor(targetFPS = 60) {
    this.clock = new THREE.Clock();
    this.updatables = new Set();
    this.fpsCounter = new FPSCounter();
    this.targetFPS = targetFPS;
    this.lastFrameTime = 0;
    this.isRunning = false;
    this.tweenGroup = new TweenGroup();
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
    this.tweenGroup = new TweenGroup();
    if (this.cameraSystem?.init) {
      this.cameraSystem.init(
        camera,
        renderer,
        celestialBodies,
        sceneSystem,
        this.tweenGroup
      );
      Logger.success('[AnimationSystem] CameraSystem initialized');
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
      this.fpsCounter.update(now, this.renderer);
      this.lastFrameTime = now;
    }
  }

  update(delta) {
    if (!this.camera) {
      Logger.warn('[AnimationSystem] Camera not defined in update');
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

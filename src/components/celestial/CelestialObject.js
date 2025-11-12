import * as THREE from 'three';
import Logger from '../../utils/Logger.js';

export default class CelestialObject {
  constructor(textureSystem, config, name, animationSystem) {
    this.name = name;
    this.config = config;
    this.textureSystem = textureSystem;
    this.animationSystem = animationSystem;
    this.group = this.createMainGroup();
    this.orbitAngle = 0;
    this.orbitRadius = config.orbitalRadius;
    this.rotationSpeed = config.rotationSpeed;
    this.orbitSpeed = config.orbitSpeed;
    if (this.animationSystem) {
      this.animationSystem.addUpdatable(this);
    }
    Logger.info(`[CelestialObject] Created "${this.name}"`);
  }

  createMainGroup() {
    const group = new THREE.Group();
    group.name = this.name;
    this.loadAndApplyTextures().catch((err) =>
      Logger.error(
        `[CelestialObject] Error loading textures for ${this.name}`,
        err
      )
    );
    return group;
  }

  async loadAndApplyTextures(distance = 100) {
    const textureKeys = Object.keys(this.config.textures);
    Logger.debug(
      `[CelestialObject] Loading textures for ${this.name}:`,
      textureKeys
    );

    const texturePromises = textureKeys.map(async (key) => {
      try {
        const texture = await this.textureSystem.getLODTexture(
          this.name,
          key,
          distance
        );
        this.applyTextureToMaterial(key, texture);
        Logger.success(
          `[CelestialObject] Texture applied for ${this.name} (${key})`
        );
      } catch (err) {
        Logger.warn(
          `[CelestialObject] Failed to load texture ${key} for ${this.name}`,
          err
        );
      }
    });

    await Promise.all(texturePromises);
  }

  applyTextureToMaterial(key, texture) {
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const geometry = new THREE.SphereGeometry(this.config.radius, 64, 64);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${this.name}_${key}`;
    this.group.add(mesh);
  }

  update(delta) {
    // Rotation sur soi-même
    this.group.rotation.y += this.rotationSpeed * delta;

    // Orbite autour du parent
    if (this.orbitRadius > 0 && this.group.parent) {
      this.orbitAngle += this.orbitSpeed * delta;

      const x = Math.cos(this.orbitAngle) * this.orbitRadius;
      const z = Math.sin(this.orbitAngle) * this.orbitRadius;

      this.group.position.set(x, 0, z);
    }
  }

  dispose() {
    this.group?.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    Logger.warn(`[CelestialObject] Disposed "${this.name}"`);
  }
}

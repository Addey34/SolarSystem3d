/**
 * @fileoverview Classe représentant un corps céleste (planète, lune, soleil).
 * Gère la création du mesh 3D, le chargement des textures avec LOD dynamique,
 * la rotation propre et le mouvement orbital.
 */

import * as THREE from 'three';
import Logger from '../../utils/Logger.js';

/**
 * Représente un corps céleste dans le système solaire.
 * Chaque corps céleste possède son propre groupe Three.js, ses textures,
 * et peut être mis à jour indépendamment dans la boucle d'animation.
 */
export default class CelestialObject {
  /**
   * Crée un nouveau corps céleste.
   * @param {TextureSystem} textureSystem - Système de gestion des textures
   * @param {Object} config - Configuration du corps (rayon, vitesse, textures, etc.)
   * @param {string} name - Nom unique du corps céleste
   * @param {AnimationSystem} animationSystem - Système d'animation pour les mises à jour
   */
  constructor(textureSystem, config, name, animationSystem) {
    /** @type {string} Nom unique identifiant ce corps céleste */
    this.name = name;

    /** @type {Object} Configuration complète du corps céleste */
    this.config = config;

    /** @type {TextureSystem} Référence au système de textures */
    this.textureSystem = textureSystem;

    /** @type {AnimationSystem} Référence au système d'animation */
    this.animationSystem = animationSystem;

    /** @type {THREE.Group} Groupe Three.js contenant tous les éléments du corps */
    this.group = this.createMainGroup();

    /** @type {number} Angle actuel sur l'orbite (en radians) */
    this.orbitAngle = 0;

    /** @type {number} Rayon de l'orbite autour du parent */
    this.orbitRadius = config.orbitalRadius;

    /** @type {number} Vitesse de rotation sur l'axe propre */
    this.rotationSpeed = config.rotationSpeed;

    /** @type {number} Vitesse de révolution orbitale */
    this.orbitSpeed = config.orbitSpeed;

    /** @type {Map<string, THREE.Mesh>} Cache des meshes créés pour éviter les doublons */
    this.meshes = new Map();

    /** @type {string|null} Qualité LOD actuellement appliquée */
    this.currentLODQuality = null;

    /** @type {number} Distance de la dernière mise à jour LOD (optimisation) */
    this.lastLODUpdateDistance = Infinity;

    // Enregistrer ce corps dans le système d'animation pour les mises à jour
    if (this.animationSystem) {
      this.animationSystem.addUpdatable(this);
    }

    Logger.info(`[CelestialObject] Created "${this.name}"`);
  }

  // Création du groupe principal pour le corps céleste
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

  // Chargement et application des textures initiales
  async loadAndApplyTextures() {
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
          100
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

  // Application d'une texture spécifique au matériau du mesh
  applyTextureToMaterial(key, texture) {
    let mesh = this.meshes.get(this.name);

    if (!mesh) {
      const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
      });
      const geometry = new THREE.SphereGeometry(this.config.radius, 64, 64);
      mesh = new THREE.Mesh(geometry, material);
      mesh.name = this.name;
      this.meshes.set(this.name, mesh);
      this.group.add(mesh);
    }

    this.applyTextureToMeshMaterial(mesh, key, texture);
  }

  // Mise à jour des textures LOD en fonction de la distance à la caméra
  async updateLODTextures(
    camera,
    maxUpdateDistance = 200,
    distanceThreshold = 5
  ) {
    if (!camera || !this.group) return;

    const worldPos = new THREE.Vector3();
    this.group.getWorldPosition(worldPos);
    const distance = camera.position.distanceTo(worldPos);

    if (distance > maxUpdateDistance) {
      this.lastLODUpdateDistance = distance;
      return;
    }

    const distanceChange = Math.abs(distance - this.lastLODUpdateDistance);
    if (distanceChange < distanceThreshold) {
      return;
    }

    this.lastLODUpdateDistance = distance;

    Logger.debug(
      `[CelestialObject] Updating LOD for ${
        this.name
      } - Distance: ${distance.toFixed(2)}`
    );

    const textureKeys = Object.keys(this.config.textures);
    for (const textureKey of textureKeys) {
      await this.updateTextureQuality(textureKey, distance);
    }
  }

  // Mise à jour de la qualité d'une texture spécifique en fonction de la distance
  async updateTextureQuality(textureKey, distance) {
    try {
      const texture = await this.textureSystem.getLODTexture(
        this.name,
        textureKey,
        distance
      );

      const mesh = this.meshes.get(this.name);

      if (mesh && mesh.material) {
        this.applyTextureToMeshMaterial(mesh, textureKey, texture);
        Logger.debug(
          `[CelestialObject] Updated ${
            this.name
          }:${textureKey} to distance ${distance.toFixed(2)}`
        );
      }
    } catch (err) {
      Logger.warn(
        `[CelestialObject] Failed to update texture ${textureKey} for ${this.name}`,
        err
      );
    }
  }

  // Application de la texture au matériau du mesh en fonction du type de texture
  applyTextureToMeshMaterial(mesh, textureKey, texture) {
    if (!mesh.material) return;

    switch (textureKey) {
      case 'surface':
        mesh.material.map = texture;
        break;
      case 'normalMap':
        mesh.material.normalMap = texture;
        break;
      case 'bump':
        mesh.material.bumpMap = texture;
        break;
      case 'spec':
      case 'specularMap':
        mesh.material.metalnessMap = texture;
        break;
      case 'clouds':
      case 'atmosphere':
        mesh.material.map = texture;
        break;
      case 'lights':
        mesh.material.emissiveMap = texture;
        break;
      default:
        mesh.material.map = texture;
    }

    mesh.material.needsUpdate = true;
    texture.needsUpdate = true;
  }

  update(delta) {
    // Rotation sur l'axe propre
    this.group.rotation.y += this.rotationSpeed * delta;

    // Mouvement orbital
    if (this.orbitRadius > 0 && this.orbitSpeed > 0) {
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

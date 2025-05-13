import * as THREE from 'three';
import { LOD_LEVELS } from '../../config/constants.js';
import { CELESTIAL_CONFIG } from '../../config/settings.js';

export class CelestialObjectLOD {
  constructor(name, textures, settings) {
    this.name = name;
    this.textures = textures;
    console.log(textures);
    this.settings = settings;
    this.config = this.getObjectConfig();
    this.lod = new THREE.LOD();
    this.additionalLayers = [];
    this.isInShadow = false;
    this.init();
  }

  init() {
    for (const { segments, distance } of Object.values(LOD_LEVELS)) {
      const tex = this.getTexturesForDistance(distance);
      this.addLODLevel(segments, distance, tex);
    }
  }

  addLODLevel(segments, distance, textures) {
    const geometry = new THREE.SphereGeometry(
      this.settings.radius,
      segments,
      segments
    );
    const material = this.createMaterial(textures);
    const mesh = new THREE.Mesh(geometry, material);
    this.lod.addLevel(mesh, distance);
    this.addOptionalLayers(mesh, textures, segments);
  }

  createMaterial(textures) {
    const material = new THREE.MeshStandardMaterial({
      map: textures.surface,
      roughness: 0.8,
      metalness: 0.2,
    });
    if (textures.normalMap) {
      material.normalMap = textures.normalMap;
      material.normalScale = new THREE.Vector2(1, 1);
    } else if (textures.bumpMap) {
      material.bumpMap = textures.bumpMap;
      material.bumpScale = 0.05;
    }
    if (textures.spec) {
      material.roughnessMap = textures.spec;
      material.roughness = 0.7;
    }
    if (textures.lights) {
      material.emissiveMap = textures.lights;
      material.emissiveIntensity = this.isInShadow ? 0 : 1;
    }
    return material;
  }

  addOptionalLayers(parentMesh, textures, segments) {
    const layers = [
      { type: 'clouds', texture: textures.clouds, size: 1.01, opacity: 0.8 },
      {
        type: 'atmosphere',
        texture: textures.atmosphere,
        size: 1.02,
        opacity: 0.6,
      },
    ];
    layers.forEach((layer) => {
      if (!layer.texture) return;
      const geometry = new THREE.SphereGeometry(
        this.settings.radius * layer.size,
        segments,
        segments
      );
      const material = new THREE.MeshStandardMaterial({
        map: layer.texture,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.DoubleSide,
      });
      const layerMesh = new THREE.Mesh(geometry, material);
      parentMesh.add(layerMesh);
      this.additionalLayers.push({ mesh: layerMesh, type: layer.type });
    });
  }

  update(delta, cameraPosition, isInShadow = false) {
    if (!cameraPosition || !this.lod.parent) return;
    if (this.isInShadow !== isInShadow) {
      this.isInShadow = isInShadow;
      this.updateMaterials();
    }
    this.lod.updateMatrixWorld(true);
    this.lod.update(cameraPosition);
    const rotationSpeed = this.settings.rotationSpeed * 0.5 * delta;
    this.additionalLayers.forEach((layer) => {
      layer.mesh.rotation.y +=
        rotationSpeed * (layer.type === 'clouds' ? 1 : 0.3);
    });
  }

  updateMaterials() {
    this.lod.levels.forEach((level) => {
      const material = level.object.material;
      if (material.emissiveMap) {
        material.emissiveIntensity = this.isInShadow ? 0.3 : 0.8;
        material.needsUpdate = true;
      }
    });
  }

  dispose() {
    this.lod.levels.forEach((level) => {
      level.object.geometry.dispose();
      level.object.material.dispose();
      level.object.children.forEach((child) => {
        child.geometry.dispose();
        child.material.dispose();
      });
    });
    this.additionalLayers = [];
  }

  getObjectConfig() {
    return CELESTIAL_CONFIG.bodies[this.name] || this.findSatelliteConfig();
  }

  findSatelliteConfig() {
    for (const body of Object.values(CELESTIAL_CONFIG.bodies)) {
      if (body.satellites?.[this.name]) {
        return body.satellites[this.name];
      }
    }
    return null;
  }

  getTexturesForDistance(distance) {
    const config = this.getObjectConfig();
    const quality = this.getQualityForDistance(distance);
    const textures = {};
    if (config.textures) {
      Object.entries(config.textures).forEach(([type]) => {
        textures[type] = this.getTexture(type, quality);
      });
    }
    return textures;
  }

  getTexture(type, quality) {
    const textureKey = `${this.name}_${type}_${quality}`;
    return this.textures[textureKey] || null;
  }

  getQualityForDistance(distance) {
    const levels = Object.values(LOD_LEVELS).sort(
      (a, b) => a.distance - b.distance
    );

    for (const level of levels) {
      if (distance <= level.distance) {
        return this.getBestAvailableResolution(
          level.quality,
          this.getObjectConfig()
        );
      }
    }
    return '1k';
  }

  getBestAvailableResolution(target, config) {
    const qualityOrder = ['8k', '4k', '2k', '1k'];
    const startIndex = qualityOrder.indexOf(target);

    for (let i = startIndex; i < qualityOrder.length; i++) {
      const res = qualityOrder[i];
      if (this.hasResolutionAvailable(res, config)) {
        return res;
      }
    }
    return '1k';
  }

  hasResolutionAvailable(resolution, config) {
    if (!config.textureResolutions) return false;
    return Object.values(config.textureResolutions).some((resolutions) =>
      resolutions.includes(resolution)
    );
  }
}

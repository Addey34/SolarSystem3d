/**
 * @fileoverview Classe représentant un corps céleste (planète, lune, soleil).
 * Gère la création des meshes 3D multicouches, le chargement des textures avec LOD,
 * la rotation propre et le mouvement orbital.
 *
 * Architecture des couches (layers) pour les planètes complexes :
 * - surface : Mesh principal avec surface + normalMap + specular
 * - clouds : Mesh transparent légèrement plus grand (nuages)
 * - atmosphere : Mesh transparent pour l'atmosphère (Vénus)
 * - lights : Mesh shader jour/nuit pour lumières nocturnes (Terre)
 * - ring : Anneau pour Saturne
 */

import * as THREE from 'three';

import {
  createAtmosphereMaterial,
  createCloudsMaterial,
  createRingMaterial,
  createSphereGeometry,
  createSurfaceMaterial,
  configureShadows,
  RING_SEGMENTS,
} from '../../config/layerConfig.js';
import { RENDER_SETTINGS, SHADER_SETTINGS } from '../../config/settings.js';
import * as NightLightsShader from '../../shaders/NightLightsShader.js';
import Logger from '../../utils/Logger.js';

// ============================================================================
// CONSTANTES
// ============================================================================

/** Vitesse de rotation relative des nuages (10% plus lent que la surface) */
const CLOUDS_ROTATION_FACTOR = 0.1;

/** Types de textures appliquées à la couche surface */
const SURFACE_TEXTURE_TYPES = ['surface', 'normalMap', 'bump', 'spec', 'specularMap'];

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

/**
 * Représente un corps céleste dans le système solaire.
 * Supporte les meshes multicouches pour un rendu réaliste.
 */
export default class CelestialObject {
  /**
   * Crée un nouveau corps céleste.
   * @param {TextureSystem} textureSystem - Système de gestion des textures
   * @param {Object} config - Configuration du corps céleste
   * @param {string} name - Nom unique du corps céleste
   * @param {AnimationSystem} animationSystem - Système d'animation
   */
  constructor(textureSystem, config, name, animationSystem) {
    this.name = name;
    this.config = config;
    this.textureSystem = textureSystem;
    this.animationSystem = animationSystem;

    // Groupe Three.js contenant toutes les couches
    this.group = new THREE.Group();
    this.group.name = this.name;

    // Paramètres orbitaux
    this.orbitAngle = 0;
    this.orbitRadius = config.orbitalRadius ?? 0;
    this.rotationSpeed = config.rotationSpeed ?? 0;
    this.orbitSpeed = config.orbitSpeed ?? 0;

    // Cache des meshes par couche
    this.layers = new Map();

    // Distance pour le système LOD
    this.lastLODUpdateDistance = Infinity;

    // Initialisation
    this._createAllLayers();
    this._loadAllTextures();
    this._registerForUpdates();

    Logger.info(`[CelestialObject] Created "${this.name}"`);
  }

  // ==========================================================================
  // CRÉATION DES COUCHES
  // ==========================================================================

  /**
   * Crée toutes les couches de meshes selon la configuration.
   * @private
   */
  _createAllLayers() {
    const textures = this.config.textures || {};

    if (textures.surface) this._createSurfaceLayer();
    if (textures.clouds) this._createCloudsLayer();
    if (textures.atmosphere) this._createAtmosphereLayer();
    if (textures.lights) this._createLightsLayer();
    if (this.config.ring) this._createRingLayer();
  }

  /**
   * Crée la couche surface principale.
   * @private
   */
  _createSurfaceLayer() {
    const isSun = this.name === 'sun';
    const material = createSurfaceMaterial(isSun);
    const geometry = createSphereGeometry(this.config.radius, 'surface');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${this.name}_surface`;

    // Ombres (sauf pour le soleil)
    if (RENDER_SETTINGS.shadowMap.enabled && !isSun) {
      configureShadows(mesh, true, true);
    }

    this._addLayer('surface', mesh);
  }

  /**
   * Crée la couche nuages transparente.
   * @private
   */
  _createCloudsLayer() {
    const material = createCloudsMaterial();
    const geometry = createSphereGeometry(this.config.radius, 'clouds');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${this.name}_clouds`;

    if (RENDER_SETTINGS.shadowMap.enabled) {
      configureShadows(mesh, false, true);
    }

    this._addLayer('clouds', mesh);
  }

  /**
   * Crée la couche atmosphère (pour Vénus).
   * @private
   */
  _createAtmosphereLayer() {
    // La Terre n'utilise pas cette couche (elle a des nuages séparés)
    if (this.name === 'earth') return;

    const material = createAtmosphereMaterial();
    const geometry = createSphereGeometry(this.config.radius, 'atmosphere');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${this.name}_atmosphere`;

    this._addLayer('atmosphere', mesh);
  }

  /**
   * Crée la couche lumières nocturnes avec shader jour/nuit.
   * @private
   */
  _createLightsLayer() {
    const settings = SHADER_SETTINGS?.nightLights;
    const uniforms = NightLightsShader.createUniforms(settings);
    uniforms.sunPosition.value = new THREE.Vector3(0, 0, 0);

    const material = new THREE.ShaderMaterial({
      vertexShader: NightLightsShader.vertexShader,
      fragmentShader: NightLightsShader.fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    const geometry = createSphereGeometry(this.config.radius, 'lights');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${this.name}_lights`;

    this._addLayer('lights', mesh);
  }

  /**
   * Crée la couche anneau (pour Saturne).
   * @private
   */
  _createRingLayer() {
    const { innerRadius, outerRadius } = this.config.ring;
    const inner = this.config.radius * innerRadius;
    const outer = this.config.radius * outerRadius;

    const geometry = new THREE.RingGeometry(inner, outer, RING_SEGMENTS);
    this._correctRingUVs(geometry, inner, outer);

    const material = createRingMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${this.name}_ring`;
    mesh.rotation.x = Math.PI / 2;

    this._addLayer('ring', mesh);
    this._loadRingTexture();
  }

  /**
   * Corrige les UVs de l'anneau pour un mapping radial.
   * @private
   */
  _correctRingUVs(geometry, innerRadius, outerRadius) {
    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const u = (dist - innerRadius) / (outerRadius - innerRadius);
      uv.setXY(i, u, uv.getY(i));
    }
  }

  /**
   * Ajoute une couche au groupe et au cache.
   * @private
   */
  _addLayer(name, mesh) {
    this.layers.set(name, mesh);
    this.group.add(mesh);
  }

  // ==========================================================================
  // CHARGEMENT DES TEXTURES
  // ==========================================================================

  /**
   * Charge toutes les textures initiales.
   * @private
   */
  async _loadAllTextures() {
    const textures = this.config.textures || {};

    for (const textureKey of Object.keys(textures)) {
      try {
        const texture = await this.textureSystem.getLODTexture(this.name, textureKey, 100);
        this._applyTexture(textureKey, texture);
        Logger.debug(`[CelestialObject] Texture "${textureKey}" loaded for ${this.name}`);
      } catch (err) {
        Logger.warn(`[CelestialObject] Failed to load ${textureKey} for ${this.name}`);
      }
    }
  }

  /**
   * Charge la texture de l'anneau.
   * @private
   */
  async _loadRingTexture() {
    const ringConfig = this.config.ring;
    if (!ringConfig) return;

    try {
      const quality = ringConfig.textureResolutions[0];
      const texture = await this.textureSystem.loadTexture(ringConfig.textures, quality);

      const ringMesh = this.layers.get('ring');
      if (ringMesh) {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        ringMesh.material.map = texture;
        ringMesh.material.alphaMap = texture;
        ringMesh.material.needsUpdate = true;
        Logger.success(`[CelestialObject] Ring texture loaded for ${this.name}`);
      }
    } catch (err) {
      Logger.warn(`[CelestialObject] Ring texture failed for ${this.name}`);
    }
  }

  /**
   * Applique une texture à la couche appropriée.
   * @param {string} textureKey - Type de texture
   * @param {THREE.Texture} texture - Texture chargée
   * @private
   */
  _applyTexture(textureKey, texture) {
    // Textures de la couche surface
    if (SURFACE_TEXTURE_TYPES.includes(textureKey)) {
      this._applySurfaceTexture(textureKey, texture);
      return;
    }

    // Textures des autres couches
    const layerHandlers = {
      clouds: () => this._applyCloudsTexture(texture),
      atmosphere: () => this._applyAtmosphereTexture(texture),
      lights: () => this._applyLightsTexture(texture),
    };

    const handler = layerHandlers[textureKey];
    if (handler) {
      handler();
    } else {
      Logger.debug(`[CelestialObject] Unknown texture key: "${textureKey}"`);
    }
  }

  /**
   * Applique une texture à la couche surface.
   * @private
   */
  _applySurfaceTexture(textureKey, texture) {
    const mesh = this.layers.get('surface');
    if (!mesh) return;

    const { material } = mesh;

    switch (textureKey) {
      case 'surface':
        material.map = texture;
        break;

      case 'normalMap':
        if ('normalMap' in material) {
          material.normalMap = texture;
          material.normalScale = new THREE.Vector2(1, 1);
        }
        break;

      case 'bump':
        if ('bumpMap' in material) {
          material.bumpMap = texture;
          material.bumpScale = 0.05;
        }
        break;

      case 'spec':
      case 'specularMap':
        if ('roughnessMap' in material) {
          material.roughnessMap = texture;
          material.roughness = 1.0;
        }
        break;
    }

    material.needsUpdate = true;
  }

  /**
   * Applique la texture des nuages.
   * @private
   */
  _applyCloudsTexture(texture) {
    const mesh = this.layers.get('clouds');
    if (!mesh) return;

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    mesh.material.map = texture;
    mesh.material.alphaMap = texture;
    mesh.material.needsUpdate = true;
  }

  /**
   * Applique la texture d'atmosphère.
   * @private
   */
  _applyAtmosphereTexture(texture) {
    const mesh = this.layers.get('atmosphere');
    if (!mesh) return;

    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
  }

  /**
   * Applique la texture des lumières nocturnes.
   * @private
   */
  _applyLightsTexture(texture) {
    const mesh = this.layers.get('lights');
    if (!mesh?.material?.uniforms) return;

    mesh.material.uniforms.lightsMap.value = texture;
    mesh.material.needsUpdate = true;
  }

  // ==========================================================================
  // MISE À JOUR
  // ==========================================================================

  /**
   * Enregistre l'objet pour les mises à jour d'animation.
   * @private
   */
  _registerForUpdates() {
    if (this.animationSystem) {
      this.animationSystem.addUpdatable(this);
    }
  }

  /**
   * Met à jour les textures LOD selon la distance caméra.
   * @param {THREE.Camera} camera - Caméra active
   * @param {number} maxDistance - Distance max pour les mises à jour LOD
   * @param {number} threshold - Seuil de changement de distance
   */
  async updateLODTextures(camera, maxDistance = 200, threshold = 5) {
    if (!camera || !this.group) return;

    const worldPos = new THREE.Vector3();
    this.group.getWorldPosition(worldPos);
    const distance = camera.position.distanceTo(worldPos);

    // Skip si trop loin ou pas assez de changement
    if (distance > maxDistance) {
      this.lastLODUpdateDistance = distance;
      return;
    }

    if (Math.abs(distance - this.lastLODUpdateDistance) < threshold) return;

    this.lastLODUpdateDistance = distance;

    // Mise à jour de chaque texture
    const textures = this.config.textures || {};
    for (const textureKey of Object.keys(textures)) {
      try {
        const texture = await this.textureSystem.getLODTexture(this.name, textureKey, distance);
        this._applyTexture(textureKey, texture);
      } catch {
        // Silencieux pour éviter le spam
      }
    }
  }

  /**
   * Mise à jour appelée chaque frame.
   * @param {number} delta - Temps écoulé depuis la dernière frame
   * @param {THREE.Vector3} [sunWorldPosition] - Position du soleil
   */
  update(delta, sunWorldPosition) {
    // Rotation propre
    this.group.rotation.y += this.rotationSpeed * delta;

    // Rotation différentielle des nuages
    const clouds = this.layers.get('clouds');
    if (clouds) {
      clouds.rotation.y += this.rotationSpeed * delta * CLOUDS_ROTATION_FACTOR;
    }

    // Mise à jour du shader lumières nocturnes
    const lights = this.layers.get('lights');
    if (lights?.material?.uniforms && sunWorldPosition) {
      lights.material.uniforms.sunPosition.value.copy(sunWorldPosition);
    }

    // Mouvement orbital
    if (this.orbitRadius > 0 && this.orbitSpeed > 0) {
      this.orbitAngle += this.orbitSpeed * delta;
      this.group.position.set(
        Math.cos(this.orbitAngle) * this.orbitRadius,
        0,
        Math.sin(this.orbitAngle) * this.orbitRadius
      );
    }
  }

  // ==========================================================================
  // NETTOYAGE
  // ==========================================================================

  /**
   * Libère toutes les ressources GPU.
   */
  dispose() {
    this.layers.forEach((mesh) => {
      mesh.geometry?.dispose();

      if (mesh.material) {
        // Textures standard
        ['map', 'normalMap', 'bumpMap', 'roughnessMap', 'alphaMap'].forEach((prop) => {
          mesh.material[prop]?.dispose();
        });

        // Textures shader
        mesh.material.uniforms?.lightsMap?.value?.dispose();

        mesh.material.dispose();
      }
    });

    this.layers.clear();
    Logger.warn(`[CelestialObject] Disposed "${this.name}"`);
  }
}

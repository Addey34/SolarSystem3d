/**
 * @fileoverview Système de gestion de la scène Three.js.
 * Configure la scène, la caméra, le renderer, et organise les corps célestes
 * dans une hiérarchie de groupes orbitaux.
 */

import * as THREE from 'three';
import { CAMERA_SETTINGS, RENDER_SETTINGS } from '../../config/settings.js';
import Logger from '../../utils/Logger.js';
import { createStarfield } from '../celestial/Starfield.js';

/**
 * Système central gérant la scène Three.js.
 * Responsable de la configuration du renderer, de la caméra,
 * et de l'organisation hiérarchique des objets dans la scène.
 */
export class SceneSystem {
  /**
   * Crée une nouvelle instance du système de scène.
   * @param {Object} config - Configuration des corps célestes (CELESTIAL_CONFIG)
   * @param {TextureSystem} textureSystem - Système de gestion des textures
   */
  constructor(config, textureSystem) {
    /** @type {Object} Configuration des corps célestes */
    this.config = config;

    /** @type {TextureSystem} Référence au système de textures */
    this.textureSystem = textureSystem;

    /** @type {THREE.Scene} La scène Three.js principale */
    this.scene = new THREE.Scene();

    /** @type {Object} Groupes orbitaux pour chaque corps céleste */
    this.orbitGroups = {};

    /** @type {Function[]} Fonctions de nettoyage à appeler lors du dispose */
    this.disposeFunctions = [];

    /** @type {THREE.Object3D} Objet cible pour le suivi de la caméra */
    this.targetObject = new THREE.Object3D();
    this.targetObject.name = 'mainTarget';
    this.scene.add(this.targetObject);

    Logger.info('[SceneSystem] Scene instance created ✅');
  }

  init() {
    Logger.debug('[SceneSystem] Initializing scene...');
    this.setupCamera();
    this.setupRenderer();
    this.setupStarfield();
    this.setupEventListeners();
    return this;
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_SETTINGS.fov,
      window.innerWidth / window.innerHeight,
      CAMERA_SETTINGS.near,
      CAMERA_SETTINGS.far
    );
    this.camera.position.copy(CAMERA_SETTINGS.initialPosition);
    this.camera.lookAt(this.targetObject.position);
    Logger.debug('[SceneSystem] Camera configured');
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: RENDER_SETTINGS.antialias,
      powerPreference: 'high-performance',
    });
    const pixelRatio = Math.min(
      window.devicePixelRatio,
      RENDER_SETTINGS.maxPixelRatio
    );
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = RENDER_SETTINGS.shadowMap.enabled;
    this.renderer.shadowMap.type = RENDER_SETTINGS.shadowMap.type;
    this.renderer.toneMapping = RENDER_SETTINGS.toneMapping;
    this.renderer.physicallyCorrectLights =
      RENDER_SETTINGS.physicallyCorrectLights;
    document.body.appendChild(this.renderer.domElement);
    Logger.debug('[SceneSystem] Renderer initialized');
  }

  setupStarfield() {
    const texture = this.textureSystem.loadTexture('stars/starsSurface', '8k');
    texture
      .then((starTexture) => {
        const starfield = createStarfield(starTexture);
        this.scene.add(starfield);
        Logger.success('[SceneSystem] Starfield added to scene');
      })
      .catch((err) => {
        Logger.warn('[SceneSystem] Failed to load starfield texture', err);
      });
  }

  setupEventListeners() {
    const onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize, { passive: true });
    this.disposeFunctions.push(() =>
      window.removeEventListener('resize', onResize)
    );
    Logger.debug('[SceneSystem] Resize listener added');
  }

  setupCelestialBodies(celestialBodies) {
    Logger.info('[SceneSystem] Adding celestial bodies to scene');
    const addBody = (name, config, parentGroup = null) => {
      const body = celestialBodies[name];
      if (!body) {
        Logger.warn(
          `[SceneSystem] Body "${name}" not found in celestialBodies`
        );
        return;
      }
      body.group.updateMatrixWorld(true);
      body.group.position.set(config.orbitalRadius || 0, 0, 0);
      Logger.debug(`[SceneSystem] Adding ${name} to scene`);

      const orbitGroup = new THREE.Group();
      orbitGroup.name = `orbit_${name}`;
      orbitGroup.add(body.group);
      this.orbitGroups[name] = orbitGroup;

      const orbitVisual = this.createOrbitVisual(
        config.orbitalRadius,
        config.orbitalColor
      );
      orbitGroup.add(orbitVisual);
      if (parentGroup) {
        parentGroup.add(orbitGroup);
      } else {
        this.scene.add(orbitGroup);
      }
      if (config.satellites) {
        Object.entries(config.satellites).forEach(([satName, satConfig]) => {
          addBody(satName, satConfig, body.group);
        });
      }
    };
    addBody('sun', this.config.bodies.sun);
    Object.entries(this.config.bodies)
      .filter(([name]) => name !== 'sun')
      .forEach(([name, config]) => {
        addBody(name, config, celestialBodies.sun.group);
      });
    Logger.success('[SceneSystem] Celestial bodies added to scene');
  }

  createOrbitVisual(radius = 0, color) {
    const segments = 128;
    const points = Array.from({ length: segments + 1 }, (_, i) => {
      const theta = (i / segments) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(theta) * radius,
        0,
        Math.sin(theta) * radius
      );
    });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
    });
    const line = new THREE.Line(geometry, material);
    line.rotation.x = Math.PI;
    return line;
  }

  updateCameraTarget(position) {
    this.targetObject.position.copy(position);
  }

  getWorldPosition(bodyName, celestialBodies) {
    const body = celestialBodies[bodyName]?.group;
    if (!body) {
      Logger.warn(
        `[SceneSystem] getWorldPosition: Body "${bodyName}" not found`
      );
      return null;
    }
    body.updateMatrixWorld(true);
    const pos = new THREE.Vector3();
    body.getWorldPosition(pos);
    return pos;
  }

  dispose() {
    Logger.warn('[SceneSystem] Disposing scene...');
    this.disposeFunctions.forEach((fn) => fn());
    this.renderer.dispose();
    this.renderer.domElement.remove();
    Logger.success('[SceneSystem] Scene disposed');
  }
}

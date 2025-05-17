import * as THREE from 'three';
import { CAMERA_SETTINGS, RENDER_SETTINGS } from '../../config/settings.js';
import { createStarfield } from '../celestial/Starfield.js';

export class SceneSystem {
  constructor(config, textureSystem) {
    this.config = config;
    this.textureSystem = textureSystem;
    this.scene = new THREE.Scene();
    this.orbitGroups = {};
    this.disposeFunctions = [];
    this.targetObject = new THREE.Object3D();
    this.targetObject.name = 'mainTarget';
    this.scene.add(this.targetObject);
  }

  init() {
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
  }

  setupStarfield() {
    // Charger la texture des étoiles
    const texture = this.textureSystem.loadTexture('stars/starsSurface', '8k'); // Assurez-vous que cette texture existe dans le dossier

    texture
      .then((starTexture) => {
        const starfield = createStarfield(starTexture);
        this.scene.add(starfield); // Ajouter l'étoile à la scène
      })
      .catch((err) => {
        console.warn(
          'Erreur lors du chargement de la texture des étoiles',
          err
        );
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
  }

  setupCelestialBodies(celestialBodies) {
    const addBody = (name, config, parentGroup = null) => {
      const body = celestialBodies[name];
      if (!body) {
        console.warn(
          `[SceneSystem] Body "${name}" not found in celestialBodies`
        );
        return;
      }
      body.group.updateMatrixWorld(true);
      body.group.position.set(config.orbitalRadius || 0, 0, 0);
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
  }

  createOrbitVisual(radius = 0, color = 0xffffff) {
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
    this.camera.lookAt(this.targetObject.position);
  }

  getWorldPosition(bodyName, celestialBodies) {
    const body = celestialBodies[bodyName]?.group;
    if (!body) {
      console.warn(
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
    this.disposeFunctions.forEach((fn) => fn());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

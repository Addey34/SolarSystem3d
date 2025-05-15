import * as THREE from 'three';
import { CAMERA_SETTINGS, RENDER_SETTINGS } from '../../config/settings.js';
import { createStarfield } from '../celestial/bodies/Starfield.js';

export class SceneSystem {
  constructor(config) {
    this.config = config;
    this.scene = new THREE.Scene();
    this.orbitGroups = {};
    this.disposeFunctions = [];
    this.targetObject = new THREE.Object3D();
    this.targetObject.name = 'mainTarget';
    this.scene.add(this.targetObject);
  }

  init(textures) {
    this.setupCamera();
    this.setupRenderer();
    this.setupStarfield(textures);
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
    this.applyRendererSettings();
    document.body.appendChild(this.renderer.domElement);
  }

  applyRendererSettings() {
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
  }

  setupStarfield(textures) {
    const starTexture = textures['starsBackground'];
    this.starfield = createStarfield(starTexture);
    this.scene.add(this.starfield);
    this.scene.background = starTexture;
  }

  setupEventListeners() {
    const onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize, { passive: true });
    this.disposeFunctions.push(() => {
      window.removeEventListener('resize', onResize);
    });
  }

  setupCelestialBodies(celestialBodies) {
    const addBodyWithOrbit = (name, config, parentGroup) => {
      const body = celestialBodies[name];
      body.group.updateMatrixWorld(true);
      const orbitGroup = new THREE.Group();
      orbitGroup.name = `orbit_${name}`;
      body.group.position.set(config.orbitalRadius || 0, 0, 0);
      orbitGroup.add(body.group);
      if (parentGroup) {
        parentGroup.add(orbitGroup);
      } else {
        this.scene.add(orbitGroup);
      }
      this.orbitGroups[name] = orbitGroup;
      orbitGroup.updateMatrixWorld(true);
      const orbitVisual = this.createOrbitVisual(
        config.orbitalRadius,
        config.orbitalColor
      );
      orbitGroup.add(orbitVisual);
      if (config.satellites) {
        Object.entries(config.satellites).forEach(([satName, satConfig]) => {
          addBodyWithOrbit(satName, satConfig, body.group);
        });
      }
    };
    addBodyWithOrbit('sun', this.config.bodies.sun, null);
    Object.entries(this.config.bodies)
      .filter(([bodyName]) => bodyName !== 'sun')
      .forEach(([bodyName, config]) => {
        if (celestialBodies.sun?.group) {
          addBodyWithOrbit(bodyName, config, celestialBodies.sun.group);
        }
      });
  }

  createOrbitVisual(radius, color) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      linewidth: 1,
    });
    const vertices = [];
    const segments = 512;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      vertices.push(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
    }
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    const orbitLine = new THREE.Line(geometry, material);
    orbitLine.rotation.x = Math.PI;
    return orbitLine;
  }

  updateCameraTarget(position) {
    this.targetObject.position.copy(position);
    this.camera.lookAt(this.targetObject.position);
  }

  getWorldPosition(bodyName) {
    const body = this.celestialBody[bodyName]?.group;
    body.updateMatrixWorld(true);
    const position = new THREE.Vector3();
    body.getWorldPosition(position);
    return position;
  }

  dispose() {
    this.disposeFunctions.forEach((fn) => fn());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

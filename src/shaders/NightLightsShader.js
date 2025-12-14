/**
 * @fileoverview Shaders GLSL pour les lumières nocturnes des planètes.
 * Affiche les lumières (villes) uniquement sur le côté non éclairé par le soleil.
 */

/**
 * Vertex shader pour les lumières nocturnes.
 * Transmet la normale monde, la position monde et les UVs au fragment shader.
 */
export const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    // Calculer la normale en espace monde (pas juste view space)
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader pour les lumières nocturnes.
 * Calcule la visibilité des lumières basée sur l'angle avec le soleil.
 * Utilise une courbe de transition améliorée pour un effet plus réaliste.
 *
 * Uniforms:
 * - lightsMap: Texture des lumières nocturnes
 * - sunPosition: Position mondiale du soleil
 * - intensity: Intensité globale des lumières (0-1)
 * - threshold: Seuil de début de la nuit (-1 à 1, 0 = terminateur)
 * - smoothness: Largeur de la zone de transition
 */
export const fragmentShader = /* glsl */ `
  uniform sampler2D lightsMap;
  uniform vec3 sunPosition;
  uniform float intensity;
  uniform float threshold;
  uniform float smoothness;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    // Direction vers le soleil depuis ce fragment
    vec3 sunDir = normalize(sunPosition - vWorldPosition);

    // Normale normalisée
    vec3 normal = normalize(vNormal);

    // Calcul de l'éclairage solaire (dot product normal/direction soleil)
    // Résultat: 1.0 = face au soleil, -1.0 = opposé au soleil, 0.0 = terminateur
    float sunLight = dot(normal, sunDir);

    // Calcul du facteur nuit avec une transition plus douce
    // On veut: pleine lumière quand sunLight < -smoothness (nuit profonde)
    //          transition quand -smoothness < sunLight < threshold
    //          pas de lumière quand sunLight > threshold (jour)
    float nightStart = -smoothness;
    float nightEnd = threshold;

    // smoothstep pour une transition progressive
    float nightFactor = 1.0 - smoothstep(nightStart, nightEnd, sunLight);

    // Courbe de puissance pour un effet plus naturel (lumières plus visibles la nuit)
    nightFactor = pow(nightFactor, 1.5);

    // Lecture de la texture des lumières
    vec4 lightsColor = texture2D(lightsMap, vUv);

    // Boost de la luminosité des lumières (elles sont souvent trop sombres)
    vec3 boostedColor = lightsColor.rgb * 1.5;

    // Appliquer l'intensité et le facteur nuit
    float finalAlpha = lightsColor.a * nightFactor * intensity;

    // Ajouter un léger glow aux lumières
    vec3 finalColor = boostedColor * intensity * (1.0 + nightFactor * 0.5);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

/**
 * Configuration par défaut des uniforms du shader.
 * @param {Object} settings - Paramètres optionnels depuis SHADER_SETTINGS
 * @returns {Object} Uniforms Three.js initialisés
 */
export function createUniforms(settings = {}) {
  return {
    lightsMap: { value: null },
    sunPosition: { value: null },
    intensity: { value: settings.intensity ?? 1.0 },
    threshold: { value: settings.threshold ?? 0.1 },
    smoothness: { value: settings.smoothness ?? 0.3 },
  };
}

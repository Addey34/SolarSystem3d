/**
 * @fileoverview Compteur de FPS affiché à l'écran.
 * Calcule et affiche le nombre d'images par seconde en temps réel.
 */

/**
 * Compteur de FPS (Frames Per Second).
 * Affiche un overlay en bas à gauche de l'écran avec le FPS actuel.
 */
export class FPSCounter {
  /**
   * Crée une nouvelle instance du compteur FPS.
   */
  constructor() {
    /** @type {number} Nombre de frames depuis la dernière mise à jour */
    this.frameCount = 0;

    /** @type {number} Timestamp de la dernière mise à jour du FPS */
    this.lastFpsUpdate = 0;

    /** @type {number} Valeur actuelle du FPS */
    this.fps = 0;

    /** @type {HTMLElement|null} Élément DOM affichant le FPS */
    this.fpsCounter = null;
  }

  /**
   * Initialise et ajoute l'élément FPS au DOM.
   * Crée un div positionné en bas à gauche de l'écran.
   */
  init() {
    const element = document.createElement('div');
    element.id = 'fps-counter';

    // Style de l'overlay FPS
    Object.assign(element.style, {
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: '5px 10px',
      borderRadius: '3px',
      zIndex: '1000',
    });

    document.body.appendChild(element);
    this.fpsCounter = element;
  }

  update(now) {
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round(
        (this.frameCount * 1000) / (now - this.lastFpsUpdate)
      );
      this.fpsCounter.textContent = `FPS: ${this.fps}`;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  reset() {
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
  }

  dispose() {
    if (this.fpsCounter?.parentNode) {
      this.fpsCounter.parentNode.removeChild(this.fpsCounter);
    }
  }
}

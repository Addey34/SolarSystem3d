export class FPSCounter {
  constructor() {
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.fps = 0;
    this.fpsCounter = null;
  }

  // Initialise le compteur de FPS
  init() {
    const element = document.createElement('div');
    element.id = 'fps-counter';
    Object.assign(element.style, {
      position: 'absolute',
      top: '10px',
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

  // Met à jour le compteur de FPS
  update(now, renderer) {
    this.frameCount++;

    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round(
        (this.frameCount * 1000) / (now - this.lastFpsUpdate)
      );
      this.fpsCounter.textContent = `FPS: ${this.fps}`;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));

      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  // Réinitialise le compteur de FPS
  reset() {
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
  }

  // Nettoie les ressources
  dispose() {
    if (this.fpsCounter?.parentNode) {
      this.fpsCounter.parentNode.removeChild(this.fpsCounter);
    }
  }
}

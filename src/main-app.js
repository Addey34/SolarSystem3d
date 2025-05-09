import { main } from './main.js';

document.getElementById('fullscreen-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error('Fullscreen error:', err);
    });
  } else {
    document.exitFullscreen();
  }
});

const progressBar = document.getElementById('load-progress');
const loadStatus = document.getElementById('load-status');

function updateProgress(progress, message) {
  progressBar.style.width = `${progress}%`;
  loadStatus.textContent = message;
}

async function setupPlanetControls(cameraManager) {
  const buttons = document.querySelectorAll('.controls button');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const planetId = button.id.replace('orbit-', '');
      buttons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      if (cameraManager) {
        cameraManager.setTarget(planetId);
        setTimeout(() => {}, 100);
      } else {
        console.error('Camera manager is not available');
      }
    });
  });
}

async function loadApp() {
  try {
    updateProgress(10, 'Loading core components...');
    const { cameraManager } = await main(updateProgress);
    if (cameraManager) {
      await setupPlanetControls(cameraManager);
    }
    setTimeout(() => {
      document.getElementById('loader').style.opacity = '0';
      setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
      }, 500);
    }, 500);
  } catch (error) {
    console.error('Application Error:', error);
    document.getElementById('loader').innerHTML = `
      <div style="text-align: center;">
          <h2 style="color: red;">Application Error</h2>
          <p>${error.message}</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
              Retry
          </button>
      </div>
    `;
  }
}

loadApp();

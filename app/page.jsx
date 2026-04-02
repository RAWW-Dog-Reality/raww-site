'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Tongue cursor — load PNG asset
    const img = new Image();
    img.src = '/assets/cursor_tongue_short_sm.png';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 96;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 96, 96);
      const url = c.toDataURL();
      const rule = `url(${url}) 48 48, auto`;
      document.documentElement.style.cursor = rule;

      // Inject into each model-viewer shadow root so it overrides internal cursors
      document.querySelectorAll('model-viewer').forEach(mv => {
        mv.style.cursor = rule;
        const inject = () => {
          if (!mv.shadowRoot) return;
          const style = document.createElement('style');
          style.textContent = `* { cursor: url(${url}) 48 48, auto !important; }`;
          mv.shadowRoot.appendChild(style);
        };
        if (mv.shadowRoot) inject();
        else customElements.whenDefined('model-viewer').then(inject);
      });
    };

    // Camera-change reset timer for both model-viewers
    const timers = [];
    const listeners = [];

    document.querySelectorAll('model-viewer').forEach(mv => {
      const initialOrbit = mv.getAttribute('camera-orbit');
      let resetTimer = null;

      const handler = (e) => {
        if (e.detail.source === 'user-interaction') {
          clearTimeout(resetTimer);
          resetTimer = setTimeout(() => {
            mv.cameraOrbit = initialOrbit;
          }, 2000);
          timers.push(resetTimer);
        }
      };

      mv.addEventListener('camera-change', handler);
      listeners.push({ mv, handler });
    });

    return () => {
      timers.forEach(t => clearTimeout(t));
      listeners.forEach(({ mv, handler }) => {
        mv.removeEventListener('camera-change', handler);
      });
    };
  }, []);

  return (
    <>
      <div className="hero">
        <div className="models-row">
          {/* Loin chop */}
          <div className="model-wrap float-a">
            <model-viewer
              src="/assets/loinchop.glb"
              orientation="-29deg 0deg -86deg"
              camera-orbit="0deg 70deg auto"
              min-camera-orbit="-80deg 45deg auto"
              max-camera-orbit="80deg 100deg auto"
              camera-controls
              disable-zoom
              disable-pan
              interaction-prompt="none"
              shadow-intensity="0.4"
              exposure="0.75"
            ></model-viewer>
          </div>

          {/* Randy (chihuahua) */}
          <div className="model-wrap float-b" style={{ flex: 1.1 }}>
            <model-viewer
              src="/assets/randy.glb"
              camera-orbit="5deg 78deg auto"
              min-camera-orbit="-80deg 45deg auto"
              max-camera-orbit="80deg 130deg auto"
              camera-controls
              disable-zoom
              disable-pan
              interaction-prompt="none"
              shadow-intensity="0.4"
              exposure="0.75"
            ></model-viewer>
          </div>
        </div>
      </div>

      <div className="text-block">
        <div className="reality-text">REALITY</div>
        <div className="tagline-text">CHANGE THE GAME.</div>
      </div>

      <div className="qr-wrapper">
        <img src="/assets/qr.png" alt="QR code" />
      </div>
    </>
  );
}

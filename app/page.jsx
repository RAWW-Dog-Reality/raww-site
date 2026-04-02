'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function Home() {
  const [phase, setPhase] = useState(0); // 0 = intro, 2 = main
  const [introFading, setIntroFading] = useState(false);
  const [vis, setVis] = useState({
    logo: false, randy: false, reality: false, tagline: false,
  });
  const [randyOffset, setRandyOffset] = useState(null); // FLIP delta {dx, dy}
  const [randyFloating, setRandyFloating] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const randyPhase1Ref = useRef(null); // Randy container in phase 0 (used for FLIP measurement)
  const randyPhase2Ref = useRef(null); // Randy container in phase 2
  const logoMVRef    = useRef(null);   // logo model-viewer element
  const logoWrapRef  = useRef(null);   // logo-wrap div for FLIP

  // Track orientation for logo FOV
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)');
    setIsLandscape(mq.matches);
    const handler = (e) => setIsLandscape(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Show Randy only after logo model has finished loading, then 800ms later.
  // Save logo-wrap position just before triggering randy so we can FLIP it.
  useEffect(() => {
    if (phase !== 0) return;
    const mv = logoMVRef.current;
    if (!mv) return;
    let randyTimer = null;
    const handleLogoLoad = () => {
      randyTimer = setTimeout(() => {
        if (logoWrapRef.current) {
          logoWrapRef._savedTop = logoWrapRef.current.getBoundingClientRect().top;
        }
        setVis(v => ({ ...v, randy: true }));
      }, 800);
    };
    mv.addEventListener('load', handleLogoLoad);
    return () => {
      mv.removeEventListener('load', handleLogoLoad);
      clearTimeout(randyTimer);
    };
  }, [phase]);

  // FLIP: after Randy mounts and layout shifts, animate logo-wrap from its old position
  useLayoutEffect(() => {
    if (!vis.randy || !logoWrapRef.current || logoWrapRef._savedTop == null) return;
    const newTop = logoWrapRef.current.getBoundingClientRect().top;
    const dy = logoWrapRef._savedTop - newTop;
    if (Math.abs(dy) < 1) return; // no meaningful shift
    const el = logoWrapRef.current;
    el.style.transition = 'none';
    el.style.transform = `translateY(${dy}px)`;
    el.getBoundingClientRect(); // force reflow
    el.style.transition = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = 'translateY(0)';
    logoWrapRef._savedTop = null;
  }, [vis.randy]);

  // Once Randy is visible, cascade in the text
  useEffect(() => {
    if (!vis.randy || phase !== 0) return;
    const t1 = setTimeout(() => setVis(v => ({ ...v, reality: true })), 800);
    const t2 = setTimeout(() => setVis(v => ({ ...v, tagline: true })), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [vis.randy]);

  // Intro sequence
  useEffect(() => {
    const t = (ms, fn) => setTimeout(fn, ms);
    const timers = [
      t(300,  () => setVis(v => ({ ...v, logo: true }))),
      // randy triggered by logo load event; reality/tagline triggered after randy
      t(7500, () => setIntroFading(true)),
      t(9000, () => {
        // Capture Randy's center from its phase 0 container before React re-renders
        if (randyPhase1Ref.current) {
          const r = randyPhase1Ref.current.getBoundingClientRect();
          randyPhase1Ref._savedRect = { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        }
        setPhase(2);
      }),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // FLIP: once phase 2 mounts, measure Randy's new position and compute delta
  useLayoutEffect(() => {
    if (phase === 2 && randyPhase2Ref.current && randyPhase1Ref._savedRect) {
      const r = randyPhase2Ref.current.getBoundingClientRect();
      const cx2 = r.left + r.width / 2;
      const cy2 = r.top  + r.height / 2;
      setRandyOffset({
        dx: randyPhase1Ref._savedRect.cx - cx2,
        dy: randyPhase1Ref._savedRect.cy - cy2,
      });
    }
  }, [phase]);

  // After Randy's slide completes (~0.9s), switch to floating
  useEffect(() => {
    if (phase === 2) {
      const t = setTimeout(() => setRandyFloating(true), 1800);
      return () => clearTimeout(t);
    } else {
      setRandyFloating(false);
      setRandyOffset(null);
    }
  }, [phase]);

  // Cursor + camera-change reset
  useEffect(() => {
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

      document.querySelectorAll('model-viewer').forEach(mv => {
        mv.style.cursor = rule;
        const inject = () => {
          if (!mv.shadowRoot) return;
          const style = document.createElement('style');
          style.textContent = `* { cursor: url(${url}) 48 48, auto !important; outline: none !important; }`;
          mv.shadowRoot.appendChild(style);
        };
        if (mv.shadowRoot) inject();
        else customElements.whenDefined('model-viewer').then(inject);
      });
    };

    const timers = [];
    const listeners = [];
    document.querySelectorAll('model-viewer').forEach(mv => {
      const initialOrbit = mv.getAttribute('camera-orbit');
      let resetTimer = null;
      const handler = (e) => {
        if (e.detail.source === 'user-interaction') {
          clearTimeout(resetTimer);
          resetTimer = setTimeout(() => { mv.cameraOrbit = initialOrbit; }, 2000);
          timers.push(resetTimer);
        }
      };
      mv.addEventListener('camera-change', handler);
      listeners.push({ mv, handler });
    });

    return () => {
      timers.forEach(t => clearTimeout(t));
      listeners.forEach(({ mv, handler }) => mv.removeEventListener('camera-change', handler));
    };
  }, [phase]);

  const randyMV = (
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
      suppressHydrationWarning
    ></model-viewer>
  );

  return (
    <>
      {/* ── Phase 0: Intro ── */}
      {phase === 0 && (
        <div className="phase0-wrap">
          <div className="intro-container">
            <div ref={logoWrapRef} className={`logo-wrap${vis.logo ? ' anim-rise' : ' hidden'}${introFading ? ' fade-out' : ''}`}>
              <model-viewer
                ref={logoMVRef}
                src="/assets/logo.glb"
                camera-orbit={isLandscape ? "0deg 88deg 55%" : "0deg 88deg 75%"}
                min-camera-orbit={isLandscape ? "auto auto 55%" : "auto auto 75%"}
                max-camera-orbit={isLandscape ? "auto auto 55%" : "auto auto 75%"}
                shadow-intensity="0"
                exposure="1"
                suppressHydrationWarning
              ></model-viewer>
            </div>
            {/* Placeholder always reserves Randy's space; model fades in once loaded */}
            <div ref={randyPhase1Ref} className={`intro-randy float-b${vis.randy ? ' anim-fade' : ''}`}>
              {vis.randy && randyMV}
            </div>
          </div>
          <div className={`text-block intro-text-block${introFading ? ' fade-out' : ''}`}>
            <div className={`reality-text${vis.reality ? ' anim-fade' : ' hidden'}`}>REALITY</div>
            <div className="tagline-text">
              {'CHANGE THE GAME.'.split('').map((ch, i) => (
                <span
                  key={i}
                  className={vis.tagline ? 'letter-in' : 'hidden'}
                  style={{ animationDelay: `${i * 75}ms` }}
                >{ch === ' ' ? '\u00a0' : ch}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 2: Main ── */}
      {phase === 2 && (
        <div className="hero">
          <div className="models-row">
            <div className="model-wrap float-a anim-fade" style={{ animationDelay: '0.1s' }}>
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
                suppressHydrationWarning
              ></model-viewer>
            </div>
            <div
              ref={randyPhase2Ref}
              className={`model-wrap ${randyFloating ? 'float-b' : ''}`}
              style={{
                flex: 1.1,
                ...(randyOffset && !randyFloating ? {
                  '--randy-dx': `${randyOffset.dx}px`,
                  '--randy-dy': `${randyOffset.dy}px`,
                  animation: 'randyFLIP 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.8s both',
                } : {}),
              }}
            >
              {randyMV}
            </div>
          </div>
        </div>
      )}

      {/* ── Text ── */}
      {phase === 2 && (
        <div className="text-block">
          <div className="reality-text anim-fade" style={{ animationDelay: '1.5s' }}>REALITY</div>
          <div className="tagline-text anim-fade" style={{ animationDelay: '1.8s' }}>CHANGE THE GAME.<sup className="tagline-tm">™</sup></div>
        </div>
      )}

      {/* ── QR: phase 2 only, slides up from off-screen ── */}
      {phase === 2 && (
        <div className="qr-wrapper anim-slide-up" style={{ animationDelay: '2.0s' }}>
          <img src="/assets/qr.png" alt="QR code" />
        </div>
      )}
    </>
  );
}

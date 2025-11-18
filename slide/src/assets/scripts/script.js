
  import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
  
  !(function () {
    const viewport = document.querySelector('meta[name="viewport"]');
    function switchViewport() {
      const value =
        window.outerWidth > 506
          ? 'width=device-width,initial-scale=1'
          : 'width=506';
      if (viewport.getAttribute('content') !== value) {
        viewport.setAttribute('content', value);
      }
    }
    addEventListener('resize', switchViewport, false);
    switchViewport();
  })();

  !(function () {
  const rowSection = document.querySelector('.p-slide-section--row');
  const panelsWrap = document.querySelector('.panels-wrap');

  if (!rowSection || !panelsWrap) return;

  // 状態管理
  let isAnimating = false;
  let moveTween = null;
  let wheelDelta = 0;
  let verticalScrollDelta = 0;

  // 定数
  const HORIZONTAL_SCROLL_THRESHOLD = 40;
  const VERTICAL_SCROLL_THRESHOLD = 200; // 前後のセクションへの自動移動までの閾値

  gsap.set(panelsWrap, { x: 0 });

  // ユーティリティ関数
  const getPanelWidth = () => {
    const firstPanel = panelsWrap.querySelector('.panel');
    return firstPanel ? firstPanel.offsetWidth : 506;
  };

  const getPanelCount = () => {
    return panelsWrap.querySelectorAll('.panel').length;
  };

  const getMaxScrollX = () => {
    return -(getPanelWidth() * (getPanelCount() - 1));
  };

  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  // 縦スクロール処理（前後のセクションへの移動）
  const handleVerticalScroll = (e, currentX, maxLeftX) => {
    const isAtStart = currentX === 0 && e.deltaY < 0;
    const isAtEnd = currentX <= maxLeftX && e.deltaY > 0;

    if (!isAtStart && !isAtEnd) {
      verticalScrollDelta = 0; // 横スクロール処理に移る場合はリセット
      return false;
    }

    verticalScrollDelta += Math.abs(e.deltaY);
    
    if (verticalScrollDelta >= VERTICAL_SCROLL_THRESHOLD) {
      verticalScrollDelta = 0;
      return true; // 閾値に達したら通常スクロール許可
    }

    e.preventDefault(); // 閾値に達するまではスクロールを止める
    return false;
  };

  
  // 横スクロール処理（panel間の移動）
  const handleHorizontalScroll = (e, currentX, maxLeftX) => {
    e.preventDefault();

    if (isAnimating) return;

    wheelDelta += e.deltaY;
    if (Math.abs(wheelDelta) < HORIZONTAL_SCROLL_THRESHOLD) return;

    const moveValue = wheelDelta > 0 ? -getPanelWidth() : getPanelWidth();
    wheelDelta = 0;

    let targetX = clamp(currentX + moveValue, maxLeftX, 0);
    isAnimating = true;

    moveTween = gsap.to(panelsWrap, {
      x: targetX,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        isAnimating = false;
      }
    });
  };

  // メインのイベントハンドラ
  rowSection.addEventListener(
    "wheel",
    (e) => {
      const rect = rowSection.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (!isInViewport) return;

      const maxLeftX = getMaxScrollX();
      const currentX = gsap.getProperty(panelsWrap, "x");

      // 縦スクロール処理（前後のセクションへの移動）
      const shouldAllowVerticalScroll = handleVerticalScroll(e, currentX, maxLeftX);
      if (shouldAllowVerticalScroll) return;

      // 横スクロール処理（panel間の移動）
      handleHorizontalScroll(e, currentX, maxLeftX);
    },
    { passive: false }
  );
})();





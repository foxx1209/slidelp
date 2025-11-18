
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

  // ===== 定数 =====
  const CONFIG = {
    HORIZONTAL_SCROLL_THRESHOLD: 40,
    VERTICAL_SCROLL_THRESHOLD_PC: 200,
    TOUCH_SENSITIVITY: 1.5,
    ANIMATION_DURATION: 0.5,
    ANIMATION_EASE: "power2.out",
    DEFAULT_PANEL_WIDTH: 506,
  };

  // ===== 状態管理 =====
  const state = {
    isAnimating: false,
    wheelDelta: 0,
    verticalScrollDelta: 0,
    touchStartY: 0,
    lastTouchY: 0,
    currentTween: null,
  };

  // ===== 初期化 =====
  gsap.set(panelsWrap, { x: 0 });

  // ===== ユーティリティ関数 =====
  const utils = {
    getPanelWidth: () => {
      const firstPanel = panelsWrap.querySelector('.panel');
      return firstPanel ? firstPanel.offsetWidth : CONFIG.DEFAULT_PANEL_WIDTH;
    },

    getPanelCount: () => {
      return panelsWrap.querySelectorAll('.panel').length;
    },

    getMaxScrollX: () => {
      return -(utils.getPanelWidth() * (utils.getPanelCount() - 1));
    },

    clamp: (num, min, max) => Math.min(Math.max(num, min), max),

    isInViewport: (element) => {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },

    getCurrentX: () => gsap.getProperty(panelsWrap, "x"),
  };

  // ===== アニメーション処理 =====
  const slidePanel = (direction) => {
    if (state.isAnimating) return;

    const currentX = utils.getCurrentX();
    const maxLeftX = utils.getMaxScrollX();
    const panelWidth = utils.getPanelWidth();
    const moveValue = direction === 1 ? -panelWidth : panelWidth;
    const targetX = utils.clamp(currentX + moveValue, maxLeftX, 0);

    // 移動できない場合は終了
    if (currentX === targetX) return;

    state.isAnimating = true;

    // 既存のアニメーションを停止
    if (state.currentTween) {
      state.currentTween.kill();
    }

    state.currentTween = gsap.to(panelsWrap, {
      x: targetX,
      duration: CONFIG.ANIMATION_DURATION,
      ease: CONFIG.ANIMATION_EASE,
      onComplete: () => {
        state.isAnimating = false;
        state.currentTween = null;
      },
    });
  };

  // ===== 端判定処理 =====
  const isAtBoundary = (currentX, deltaY, maxLeftX) => {
    const isAtStart = currentX >= 0 && deltaY < 0;
    const isAtEnd = currentX <= maxLeftX && deltaY > 0;
    return { isAtStart, isAtEnd, isAtBoundary: isAtStart || isAtEnd };
  };

  // ===== PC: ホイールイベント処理 =====
  const handleWheel = (e) => {
    if (!utils.isInViewport(rowSection)) return;

    const currentX = utils.getCurrentX();
    const maxLeftX = utils.getMaxScrollX();
    const { isAtStart, isAtEnd, isAtBoundary: atBoundary } = isAtBoundary(
      currentX,
      e.deltaY,
      maxLeftX
    );

    // 端にいて外側に行こうとしている場合の処理
    if (atBoundary) {
      state.verticalScrollDelta += Math.abs(e.deltaY);
      if (state.verticalScrollDelta >= CONFIG.VERTICAL_SCROLL_THRESHOLD_PC) {
        state.verticalScrollDelta = 0;
        return; // ページスクロールを許可
      }
    } else {
      state.verticalScrollDelta = 0;
    }

    // 横スライド処理
    e.preventDefault();
    if (state.isAnimating) return;

    state.wheelDelta += e.deltaY;
    if (Math.abs(state.wheelDelta) < CONFIG.HORIZONTAL_SCROLL_THRESHOLD) return;

    slidePanel(state.wheelDelta > 0 ? 1 : -1);
    state.wheelDelta = 0;
  };

  // ===== SP: タッチイベント処理 =====
  const handleTouchStart = (e) => {
    state.touchStartY = e.touches[0].clientY;
    state.lastTouchY = state.touchStartY;
    state.wheelDelta = 0;
  };

  const handleTouchMove = (e) => {
    const currentTouchY = e.touches[0].clientY;
    const deltaY =
      (state.lastTouchY - currentTouchY) * CONFIG.TOUCH_SENSITIVITY;
    state.lastTouchY = currentTouchY;

    const currentX = utils.getCurrentX();
    const maxLeftX = utils.getMaxScrollX();
    const { isAtBoundary: atBoundary } = isAtBoundary(
      currentX,
      deltaY,
      maxLeftX
    );

    // 端にいて外側に行こうとしている場合はページスクロールを許可
    if (atBoundary) return;

    // 横スライド処理
    if (e.cancelable) e.preventDefault();
    if (state.isAnimating) return;

    state.wheelDelta += deltaY;
    if (Math.abs(state.wheelDelta) < CONFIG.HORIZONTAL_SCROLL_THRESHOLD)
      return;

    slidePanel(state.wheelDelta > 0 ? 1 : -1);
    state.wheelDelta = 0;
  };

  // ===== イベントリスナー登録 =====
  rowSection.addEventListener("wheel", handleWheel, { passive: false });
  rowSection.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  rowSection.addEventListener("touchmove", handleTouchMove, {
    passive: false,
  });
})();




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

  // タッチ操作用の変数
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoveX = 0;
  let touchMoveY = 0;

  // 定数
  const HORIZONTAL_SCROLL_THRESHOLD = 40;
  const VERTICAL_SCROLL_THRESHOLD = 200; // PC用：前後のセクションへの自動移動までの閾値
  const SWIPE_THRESHOLD = 50; // スマホ用：スワイプ判定の最小距離

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

  // --- 共通アニメーション処理 ---
  // 方向(direction): 1 = 次へ(左へ移動), -1 = 前へ(右へ移動)
  const slidePanel = (direction) => {
    if (isAnimating) return;

    const currentX = gsap.getProperty(panelsWrap, "x");
    const maxLeftX = getMaxScrollX();
    const moveValue = direction === 1 ? -getPanelWidth() : getPanelWidth(); // 1なら左へ移動（xはマイナス）

    // 移動先が範囲外ならアニメーションしない
    let targetX = clamp(currentX + moveValue, maxLeftX, 0);
    
    // すでに端にいる場合は何もしない（PCのwheelイベント側で縦スクロール制御するため）
    if (currentX === targetX) return;

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


  // --- PC: 縦スクロール処理（前後のセクションへの移動判定） ---
  const handleVerticalScroll = (e, currentX, maxLeftX) => {
    const isAtStart = currentX === 0 && e.deltaY < 0;
    const isAtEnd = currentX <= maxLeftX && e.deltaY > 0;

    if (!isAtStart && !isAtEnd) {
      verticalScrollDelta = 0;
      return false;
    }

    verticalScrollDelta += Math.abs(e.deltaY);
    
    if (verticalScrollDelta >= VERTICAL_SCROLL_THRESHOLD) {
      verticalScrollDelta = 0;
      return true; // 閾値に達したら通常スクロール許可
    }

    e.preventDefault();
    return false;
  };

  
  // --- PC: ホイールイベント ---
  rowSection.addEventListener(
    "wheel",
    (e) => {
      const rect = rowSection.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (!isInViewport) return;

      const maxLeftX = getMaxScrollX();
      const currentX = gsap.getProperty(panelsWrap, "x");

      // 縦スクロール処理
      const shouldAllowVerticalScroll = handleVerticalScroll(e, currentX, maxLeftX);
      if (shouldAllowVerticalScroll) return;

      // 横スクロール処理
      e.preventDefault();
      if (isAnimating) return;

      wheelDelta += e.deltaY;
      if (Math.abs(wheelDelta) < HORIZONTAL_SCROLL_THRESHOLD) return;

      // deltaY > 0 は下にスクロール（＝次へ進む＝direction 1）
      slidePanel(wheelDelta > 0 ? 1 : -1);
      
      wheelDelta = 0;
    },
    { passive: false }
  );


  // --- SP: タッチイベント処理 ---

  // 1. タッチ開始
  rowSection.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchMoveX = touchStartX;
    touchMoveY = touchStartY;
  }, { passive: false });

  // 2. タッチ移動（縦スクロールをブロックして横スワイプを優先させる判定）
  rowSection.addEventListener("touchmove", (e) => {
    touchMoveX = e.touches[0].clientX;
    touchMoveY = e.touches[0].clientY;

    const diffX = touchStartX - touchMoveX;
    const diffY = touchStartY - touchMoveY;

    // 横移動の方が縦移動より大きい場合、横スワイプとみなして画面スクロールを止める
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (e.cancelable) {
         e.preventDefault(); 
      }
    }
  }, { passive: false });

  // 3. タッチ終了（スライド実行判定）
  rowSection.addEventListener("touchend", (e) => {
    const diffX = touchStartX - touchMoveX;
    
    // 移動量が閾値を超えていない場合は無視
    if (Math.abs(diffX) < SWIPE_THRESHOLD) return;

    // diffX > 0 は指を左に動かした（＝次へ進む＝direction 1）
    const direction = diffX > 0 ? 1 : -1;
    
    slidePanel(direction);

    // リセット
    touchStartX = 0;
    touchStartY = 0;
  });

})();



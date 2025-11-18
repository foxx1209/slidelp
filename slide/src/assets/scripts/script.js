
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
  let wheelDelta = 0;
  let verticalScrollDelta = 0; // PC用の閾値管理

  // タッチ操作用の変数
  let touchStartY = 0;
  let lastTouchY = 0;

  // 定数
  const HORIZONTAL_SCROLL_THRESHOLD = 40;
  const VERTICAL_SCROLL_THRESHOLD_PC = 200; // PCは誤動作防止のため閾値を設ける
  const TOUCH_SENSITIVITY = 1.5; // スマホの感度

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
  const slidePanel = (direction) => {
    if (isAnimating) return;

    const currentX = gsap.getProperty(panelsWrap, "x");
    const maxLeftX = getMaxScrollX();
    const moveValue = direction === 1 ? -getPanelWidth() : getPanelWidth();

    let targetX = clamp(currentX + moveValue, maxLeftX, 0);
    
    if (currentX === targetX) return; // 移動できない場合は終了

    isAnimating = true;

    gsap.to(panelsWrap, {
      x: targetX,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        isAnimating = false;
      }
    });
  };

  // --- PC: ホイールイベント ---
  rowSection.addEventListener(
    "wheel",
    (e) => {
      // PCの場合、画面内に入っているかチェック
      const rect = rowSection.getBoundingClientRect();
      if (rect.top >= window.innerHeight || rect.bottom <= 0) return;

      const maxLeftX = getMaxScrollX();
      const currentX = gsap.getProperty(panelsWrap, "x");

      // PC用の閾値判定ロジック
      const isAtStart = currentX === 0 && e.deltaY < 0;
      const isAtEnd = currentX <= maxLeftX && e.deltaY > 0;

      // 端にいて、さらに外に行こうとしている時だけページスクロールを許可（閾値あり）
      if (isAtStart || isAtEnd) {
        verticalScrollDelta += Math.abs(e.deltaY);
        if (verticalScrollDelta >= VERTICAL_SCROLL_THRESHOLD_PC) {
          verticalScrollDelta = 0;
          return; // preventDefaultせず、ページスクロールさせる
        }
      } else {
        verticalScrollDelta = 0; // 端でなければリセット
      }

      // ここに来たら「横スライド」として処理
      e.preventDefault();
      if (isAnimating) return;

      wheelDelta += e.deltaY;
      if (Math.abs(wheelDelta) < HORIZONTAL_SCROLL_THRESHOLD) return;

      slidePanel(wheelDelta > 0 ? 1 : -1);
      wheelDelta = 0;
    },
    { passive: false }
  );


  // --- SP: タッチイベント処理 ---
  
  rowSection.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
    lastTouchY = touchStartY;
    wheelDelta = 0;
    // PC用のverticalScrollDeltaはスマホでは使わない（即時反応させるため）
  }, { passive: false });

  rowSection.addEventListener("touchmove", (e) => {
    const currentTouchY = e.touches[0].clientY;
    
    // 指を上に動かす(currentが小さい) = 下にスクロールしたい = プラス
    // 指を下に動かす(currentが大きい) = 上にスクロールしたい = マイナス
    let deltaY = (lastTouchY - currentTouchY) * TOUCH_SENSITIVITY;
    lastTouchY = currentTouchY;

    const maxLeftX = getMaxScrollX();
    const currentX = gsap.getProperty(panelsWrap, "x");

    // --- 重要: 端っこ判定 ---
    // 1. 「最初のパネル」で「上にスクロール（前のセクションに戻る動き）」をしているか？
    const isTryingToGoPrev = currentX >= 0 && deltaY < 0;
    
    // 2. 「最後のパネル」で「下にスクロール（次のセクションに進む動き）」をしているか？
    // ※ 少数の誤差を許容するため currentX <= maxLeftX + 1 程度で判定しても良いが、GSAP管理なら厳密でOK
    const isTryingToGoNext = currentX <= maxLeftX && deltaY > 0;

    // 端にいて外側に行こうとしているなら、絶対に preventDefault してはいけない
    if (isTryingToGoPrev || isTryingToGoNext) {
      return; // ここで処理を抜け、ブラウザ標準のスクロールに任せる
    }

    // --- 横スライド処理 ---
    // 端ではない、または端だけど内側に戻ろうとしている場合は画面をロックしてスライド
    if (e.cancelable) e.preventDefault();
    
    if (isAnimating) return;

    wheelDelta += deltaY;

    if (Math.abs(wheelDelta) < HORIZONTAL_SCROLL_THRESHOLD) return;

    slidePanel(wheelDelta > 0 ? 1 : -1);
    wheelDelta = 0;

  }, { passive: false });

})();



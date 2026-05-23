(() => {
  const FILES = [
    "jungle.jpg",
    "forest.jpg",
    "river.jpg",
    "lake.jpg",
    "mountains.jpg",
    "meadow.jpg",
    "village.jpg",
    "coast.jpg",
  ];

  const ROTATE_MS = 45000;

  const layerA = document.getElementById("bg-a");
  const layerB = document.getElementById("bg-b");
  if (!layerA || !layerB) return;

  const BACKGROUNDS = FILES.map((f) => assetUrl(`assets/backgrounds/${f}`));

  let index = startIndex();
  let showingA = true;

  function startIndex() {
    const hour = new Date().getHours();
    return Math.floor((hour / 24) * BACKGROUNDS.length) % BACKGROUNDS.length;
  }

  function preload(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error("bg load failed"));
      img.src = src;
    });
  }

  function showLayer(el, src) {
    el.src = src;
    el.classList.add("visible");
  }

  function hideLayer(el) {
    el.classList.remove("visible");
  }

  function transitionTo(nextIndex) {
    const src = BACKGROUNDS[nextIndex];
    const showEl = showingA ? layerB : layerA;
    const hideEl = showingA ? layerA : layerB;

    preload(src)
      .then(() => {
        showLayer(showEl, src);
        hideLayer(hideEl);
        showingA = !showingA;
        index = nextIndex;
      })
      .catch(() => {});
  }

  function next() {
    transitionTo((index + 1) % BACKGROUNDS.length);
  }

  layerA.src = BACKGROUNDS[index];
  layerA.classList.add("visible");
  hideLayer(layerB);
  setInterval(next, ROTATE_MS);
})();

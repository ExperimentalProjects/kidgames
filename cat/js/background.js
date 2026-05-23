(() => {
  const BACKGROUNDS = [
    "assets/backgrounds/jungle.jpg",
    "assets/backgrounds/forest.jpg",
    "assets/backgrounds/river.jpg",
    "assets/backgrounds/lake.jpg",
    "assets/backgrounds/mountains.jpg",
    "assets/backgrounds/meadow.jpg",
    "assets/backgrounds/village.jpg",
    "assets/backgrounds/coast.jpg",
  ];

  const ROTATE_MS = 45000;

  const layerA = document.getElementById("bg-a");
  const layerB = document.getElementById("bg-b");
  if (!layerA || !layerB) return;

  let index = startIndex();
  let showingA = true;

  function startIndex() {
    const hour = new Date().getHours();
    return Math.floor((hour / 24) * BACKGROUNDS.length) % BACKGROUNDS.length;
  }

  function setLayer(el, src) {
    el.style.backgroundImage = `url("${src}")`;
  }

  function show(index) {
    const src = BACKGROUNDS[index];
    const showEl = showingA ? layerA : layerB;
    const hideEl = showingA ? layerB : layerA;
    setLayer(showEl, src);
    showEl.classList.add("visible");
    hideEl.classList.remove("visible");
    showingA = !showingA;
  }

  function next() {
    index = (index + 1) % BACKGROUNDS.length;
    show(index);
  }

  setLayer(layerA, BACKGROUNDS[index]);
  layerA.classList.add("visible");

  setInterval(next, ROTATE_MS);
})();

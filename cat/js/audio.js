/**
 * Real cat & dog sounds — only one plays at a time.
 */
const PetAudio = (() => {
  const SOUNDS = {
    meow: ["sounds/meow1.mp3", "sounds/meow2.mp3", "sounds/meow3.mp3", "sounds/meow4.mp3"],
    purr: ["sounds/purr.mp3"],
    bark: ["sounds/bark3.mp3", "sounds/bark4.mp3", "sounds/bark1.mp3", "sounds/bark2.mp3"],
    whine: ["sounds/whine.mp3"],
  };

  let current = null;
  let stopTimer = null;

  function stop() {
    clearTimeout(stopTimer);
    stopTimer = null;
    if (!current) return;
    current.pause();
    current.currentTime = 0;
    current = null;
  }

  function playFile(src, maxSeconds = 2.5, volume = 0.8) {
    stop();
    const audio = new Audio(src);
    audio.volume = volume;
    current = audio;
    const cleanup = () => {
      if (current === audio) current = null;
      clearTimeout(stopTimer);
      stopTimer = null;
    };
    audio.addEventListener("ended", cleanup);
    audio.play().catch(cleanup);
    stopTimer = setTimeout(() => {
      if (current === audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      cleanup();
    }, maxSeconds * 1000);
  }

  function play(category, variant = 0, maxSeconds = 2.5) {
    const list = SOUNDS[category];
    if (!list?.length) return;
    playFile(list[Math.abs(variant) % list.length], maxSeconds);
  }

  function wake() {
    const a = new Audio(SOUNDS.meow[0]);
    a.volume = 0.01;
    a.play().then(() => {
      a.pause();
      a.currentTime = 0;
    }).catch(() => {});
  }

  return {
    wake,
    stop,
    meow: (v) => play("meow", v, 2),
    purr: () => play("purr", 0, 2.2),
    bark: (v) => play("bark", v, 2),
    whine: () => play("whine", 0, 2),
    hiss: () => play("meow", 2, 1.2),
    yawn: () => play("meow", 1, 2),
    trill: () => play("meow", 0, 0.9),
    yap: (v) => play("bark", v, 1.2),
    growl: () => play("bark", 2, 1.5),
    laugh: () => playFile("sounds/laugh.mp3", 5, 0.88),
  };
})();

/**
 * One sound at a time — plays to the end, then 0.1s pause before the next.
 */
const PetAudio = (() => {
  const SOUNDS = {
    meow: ["sounds/meow1.mp3", "sounds/meow2.mp3", "sounds/meow3.mp3", "sounds/meow4.mp3"],
    purr: ["sounds/purr.mp3"],
    bark: ["sounds/bark3.mp3", "sounds/bark4.mp3", "sounds/bark1.mp3", "sounds/bark2.mp3"],
    whine: ["sounds/whine.mp3"],
  };

  const COOLDOWN_MS = 100;

  let current = null;
  let locked = false;

  function soundUrl(relative) {
    return typeof assetUrl === "function" ? assetUrl(relative) : relative;
  }

  function release() {
    current = null;
    setTimeout(() => {
      locked = false;
    }, COOLDOWN_MS);
  }

  function playFile(relativeSrc, volume = 0.8) {
    if (locked) return false;

    locked = true;
    const audio = new Audio(soundUrl(relativeSrc));
    audio.volume = volume;
    current = audio;

    const done = () => {
      if (current !== audio) return;
      audio.removeEventListener("ended", done);
      audio.removeEventListener("error", done);
      release();
    };

    audio.addEventListener("ended", done);
    audio.addEventListener("error", done);
    audio.play().catch(done);
    return true;
  }

  function play(category, variant = 0) {
    const list = SOUNDS[category];
    if (!list?.length) return false;
    return playFile(list[Math.abs(variant) % list.length]);
  }

  function wake() {
    if (locked) return;
    const a = new Audio(soundUrl(SOUNDS.meow[0]));
    a.volume = 0.01;
    a.play().then(() => {
      a.pause();
      a.currentTime = 0;
    }).catch(() => {});
  }

  return {
    wake,
    meow: (v) => play("meow", v),
    purr: () => play("purr", 0),
    bark: (v) => play("bark", v),
    whine: () => play("whine", 0),
    hiss: () => play("meow", 2),
    yawn: () => play("meow", 1),
    trill: () => play("meow", 0),
    yap: (v) => play("bark", v),
    growl: () => play("bark", 2),
    laugh: () => playFile("sounds/laugh.mp3", 0.88),
  };
})();

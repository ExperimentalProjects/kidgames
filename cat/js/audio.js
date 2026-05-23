/**
 * One sound at a time — 5s clip, random start (except first sound from the beginning).
 * New sound only after 5s or clip ends, then 0.1s pause.
 */
const PetAudio = (() => {
  const SOUNDS = {
    meow: ["sounds/meow1.mp3", "sounds/meow2.mp3", "sounds/meow3.mp3", "sounds/meow4.mp3"],
    bark: ["sounds/bark1.mp3", "sounds/bark2.mp3", "sounds/bark3.mp3", "sounds/bark4.mp3"],
    laugh: ["sounds/laugh.mp3"],
  };

  const SEGMENT_SEC = 5;
  const COOLDOWN_MS = 100;

  let current = null;
  let playing = false;
  let inCooldown = false;
  let segmentTimer = null;
  let cooldownTimer = null;
  let playStartedAt = 0;
  let firstSoundPlayed = false;

  function soundUrl(relative) {
    return typeof assetUrl === "function" ? assetUrl(relative) : relative;
  }

  function clearTimers() {
    clearTimeout(segmentTimer);
    clearTimeout(cooldownTimer);
    segmentTimer = null;
    cooldownTimer = null;
  }

  function stopCurrent() {
    clearTimers();
    if (current) {
      current.pause();
      current.removeAttribute("src");
      current.load();
      current = null;
    }
  }

  function scheduleCooldown() {
    inCooldown = true;
    cooldownTimer = setTimeout(() => {
      inCooldown = false;
    }, COOLDOWN_MS);
  }

  function finishSegment(audio) {
    if (current !== audio) return;
    stopCurrent();
    playing = false;
    scheduleCooldown();
  }

  function canTakeNewSound() {
    if (inCooldown) return false;
    if (!playing) return true;
    return Date.now() - playStartedAt >= SEGMENT_SEC * 1000;
  }

  function playFile(relativeSrc, volume = 0.8) {
    if (!canTakeNewSound()) return false;

    stopCurrent();
    playing = true;
    playStartedAt = Date.now();

    const audio = new Audio();
    audio.volume = volume;
    current = audio;

    const fromStart = !firstSoundPlayed;
    firstSoundPlayed = true;

    const startPlayback = () => {
      if (current !== audio) return;

      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        if (fromStart) {
          audio.currentTime = 0;
        } else if (dur > SEGMENT_SEC + 0.25) {
          const maxStart = dur - SEGMENT_SEC - 0.1;
          audio.currentTime = Math.random() * maxStart;
        } else {
          audio.currentTime = Math.random() * Math.max(0, dur - 0.15);
        }
      } else {
        audio.currentTime = 0;
      }

      audio.play().catch(() => finishSegment(audio));
    };

    audio.addEventListener("ended", () => finishSegment(audio));
    audio.addEventListener("error", () => finishSegment(audio));
    audio.addEventListener("loadedmetadata", startPlayback, { once: true });
    audio.src = soundUrl(relativeSrc);

    segmentTimer = setTimeout(() => finishSegment(audio), SEGMENT_SEC * 1000);
    return true;
  }

  function play(category, variant = 0) {
    const list = SOUNDS[category];
    if (!list?.length) return false;
    return playFile(list[Math.abs(variant) % list.length]);
  }

  function wake() {
    if (playing || inCooldown) return;
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
    purr: () => play("meow", 1),
    bark: (v) => play("bark", v),
    whine: () => play("bark", 3),
    hiss: () => play("meow", 2),
    yawn: () => play("meow", 0),
    trill: () => play("meow", 3),
    yap: (v) => play("bark", v),
    growl: () => play("bark", 2),
    laugh: () => playFile(SOUNDS.laugh[0], 0.88),
  };
})();

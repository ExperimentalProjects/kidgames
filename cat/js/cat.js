(() => {
  const CAT_IMAGES = [
    "assets/cat-sitting.png",
    "assets/cat-sit-web.jpg",
    "assets/cat-look-web.jpg",
    "assets/cat-orange-web.jpg",
    "assets/cat-play-web.jpg",
    "assets/cat-stretch.png",
    "assets/cat-sleep.png",
    "assets/cat-sleep-web.jpg",
    "assets/cat-extra.jpg",
  ];

  const DOG_IMAGES = [
    "assets/dog-1.jpg",
    "assets/dog-2.jpg",
    "assets/dog-3.jpg",
    "assets/dog-4.jpg",
  ];

  const POOLS = {
    cat: { sit: CAT_IMAGES, stretch: ["assets/cat-stretch.png", "assets/cat-stretch-web.jpg", "assets/cat-yawn-web.jpg"], sleep: ["assets/cat-sleep.png", "assets/cat-sleep-web.jpg"], play: CAT_IMAGES },
    dog: { sit: DOG_IMAGES, stretch: DOG_IMAGES, sleep: DOG_IMAGES, play: DOG_IMAGES },
  };

  const REACTIONS = [
    { class: "react-look-left", cat: (v) => PetAudio.meow(v), dog: (v) => PetAudio.bark(v), pose: "sit", duration: 700 },
    { class: "react-look-right", cat: (v) => PetAudio.meow(v), dog: (v) => PetAudio.bark(v), pose: "sit", duration: 700 },
    { class: "react-hop", cat: () => PetAudio.trill(), dog: () => PetAudio.yap(1), pose: "play", duration: 600 },
    { class: "react-wiggle", cat: () => PetAudio.trill(), dog: () => PetAudio.yap(2), pose: "sit", duration: 550 },
    { class: "react-pounce", cat: (v) => PetAudio.meow(v), dog: (v) => PetAudio.bark(v), pose: "play", duration: 700 },
    { class: "react-lean-back", cat: () => PetAudio.purr(), dog: () => PetAudio.whine(), pose: "sleep", duration: 1200 },
    { class: "react-lean-forward", cat: (v) => PetAudio.meow(v), dog: (v) => PetAudio.bark(v), pose: "sit", duration: 650 },
    { class: "react-spin", cat: () => PetAudio.trill(), dog: () => PetAudio.growl(), pose: "play", duration: 750 },
    { class: "react-shake-head", cat: () => PetAudio.hiss(), dog: () => PetAudio.growl(), pose: "sit", duration: 500 },
    { class: "react-blink", cat: () => {}, dog: () => {}, pose: "sit", duration: 400 },
    { class: "react-purr-glow", cat: () => PetAudio.purr(), dog: () => PetAudio.whine(), pose: "sleep", duration: 1300 },
    { class: "pose-stretch", cat: () => PetAudio.yawn(), dog: (v) => PetAudio.bark(v), pose: "stretch", duration: 1100 },
    { class: "pose-sleep", cat: () => PetAudio.purr(), dog: () => PetAudio.whine(), pose: "sleep", duration: 1800 },
  ];

  const PET_DEFS = [
    { kind: "cat", slot: 0 },
    { kind: "cat", slot: 1 },
    { kind: "cat", slot: 2 },
    { kind: "cat", slot: 3 },
    { kind: "dog", slot: 0 },
    { kind: "dog", slot: 1 },
    { kind: "dog", slot: 2 },
  ];

  const MAX_SPEED = 3.2;
  const FRICTION = 0.9992;
  const BOUNDS_PAD = 12;

  const stage = document.getElementById("pets-stage");
  const petsRow = document.getElementById("pets-row");
  const prints = document.getElementById("prints");
  const hint = document.getElementById("hint");
  const room = document.getElementById("room");

  const pets = [];
  let lastKey = "A";
  let stageW = 0;
  let stageH = 0;
  let scatterBusy = false;
  let scatterCheckId = null;
  let scatterFallbackId = null;

  const reactionClasses = REACTIONS.map((r) => r.class).concat(["pose-stretch", "pose-sleep"]);

  function hash(key, salt = 0) {
    const code = key.length === 1 ? key.toUpperCase().charCodeAt(0) : key.length + 50;
    return code + salt * 17;
  }

  function petSize(kind) {
    const base = Math.min(stageW, stageH) * 0.16;
    return kind === "dog" ? base * 1.08 : base;
  }

  function pickImage(kind, pose, key, slot) {
    const pool = POOLS[kind][pose] || POOLS[kind].sit;
    return pool[(hash(key, slot) + slot * 11) % pool.length];
  }

  function pickReaction(key, index) {
    if (key === "Enter") return REACTIONS.find((r) => r.class === "react-pounce");
    if (key === "ArrowLeft") return REACTIONS.find((r) => r.class === "react-look-left");
    if (key === "ArrowRight") return REACTIONS.find((r) => r.class === "react-look-right");
    if (key === "ArrowUp") return REACTIONS.find((r) => r.class === "react-hop");
    if (key === "ArrowDown") return REACTIONS.find((r) => r.class === "react-lean-forward");
    const idx = (hash(key, index) * 17 + key.length * 3) % REACTIONS.length;
    return REACTIONS[idx];
  }

  function clampSpeed(pet) {
    const sp = Math.hypot(pet.vx, pet.vy);
    if (sp > MAX_SPEED) {
      pet.vx = (pet.vx / sp) * MAX_SPEED;
      pet.vy = (pet.vy / sp) * MAX_SPEED;
    }
  }

  function initMotion(pet, index) {
    pet.size = petSize(pet.kind);
    pet.el.style.width = `${pet.size}px`;
    pet.el.style.height = `${pet.size}px`;

    const maxX = Math.max(BOUNDS_PAD, stageW - pet.size - BOUNDS_PAD);
    const maxY = Math.max(BOUNDS_PAD, stageH - pet.size - BOUNDS_PAD);
    pet.x = BOUNDS_PAD + Math.random() * maxX;
    pet.y = BOUNDS_PAD + Math.random() * maxY;

    const angle = (index / PET_DEFS.length) * Math.PI * 2 + Math.random() * 0.6;
    const speed = 0.6 + Math.random() * 0.9;
    pet.vx = Math.cos(angle) * speed;
    pet.vy = Math.sin(angle) * speed;
    clampSpeed(pet);
  }

  /** Random movement effect per pet for each key — accelerate, slow, reverse, etc. */
  function applyKeyMotion(pet, key, index) {
    const seed = hash(key, pet.slot * 5 + index * 11);
    const effect = seed % 9;
    const angle = ((seed * 37) % 360) * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const now = performance.now();

    switch (effect) {
      case 0: // rocket boost
        pet.vx += cos * (2.2 + Math.random() * 1.8);
        pet.vy += sin * (2.2 + Math.random() * 1.8);
        pet.boostUntil = now + 600;
        break;
      case 1: // hard brake
        pet.vx *= 0.2;
        pet.vy *= 0.2;
        pet.dragUntil = now + 900;
        break;
      case 2: // flip direction
        pet.vx *= -1.15;
        pet.vy *= -1.15;
        break;
      case 3: { // speed up where already going
        const sp = Math.hypot(pet.vx, pet.vy) || 0.5;
        pet.vx = (pet.vx / sp) * (sp + 2.5);
        pet.vy = (pet.vy / sp) * (sp + 2.5);
        pet.boostUntil = now + 450;
        break;
      }
      case 4: // gentle slow
        pet.vx *= 0.45;
        pet.vy *= 0.45;
        pet.dragUntil = now + 700;
        break;
      case 5: // sideways shove
        pet.vx += -sin * 2.8;
        pet.vy += cos * 2.8;
        break;
      case 6: // nearly stop, tiny drift
        pet.vx = cos * 0.25;
        pet.vy = sin * 0.25;
        pet.dragUntil = now + 500;
        break;
      case 7: // chaotic nudge
        pet.vx += (Math.random() - 0.5) * 5;
        pet.vy += (Math.random() - 0.5) * 5;
        break;
      case 8: { // push toward or away from screen center
        const cx = stageW * 0.5;
        const cy = stageH * 0.5;
        const px = pet.x + pet.size * 0.5;
        const py = pet.y + pet.size * 0.5;
        const toCenter = Math.atan2(cy - py, cx - px);
        const dir = seed % 2 === 0 ? 1 : -1;
        pet.vx += Math.cos(toCenter) * dir * 2.5;
        pet.vy += Math.sin(toCenter) * dir * 2.5;
        break;
      }
      default:
        break;
    }
    clampSpeed(pet);
  }

  function collidePair(a, b) {
    const ax = a.x + a.size * 0.5;
    const ay = a.y + a.size * 0.5;
    const bx = b.x + b.size * 0.5;
    const by = b.y + b.size * 0.5;
    let dx = bx - ax;
    let dy = by - ay;
    const dist = Math.hypot(dx, dy) || 0.001;
    const minDist = (a.size + b.size) * 0.42;

    if (dist >= minDist) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;

    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const dot = dvx * nx + dvy * ny;
    if (dot >= 0) return;

    a.vx -= dot * nx;
    a.vy -= dot * ny;
    b.vx += dot * nx;
    b.vy += dot * ny;
  }

  function fleeDirection(pet) {
    const cx = pet.x + pet.size * 0.5;
    const cy = pet.y + pet.size * 0.5;
    const dists = [
      { dx: -1, dy: 0, d: cx },
      { dx: 1, dy: 0, d: stageW - cx },
      { dx: 0, dy: -1, d: cy },
      { dx: 0, dy: 1, d: stageH - cy },
    ];
    dists.sort((a, b) => a.d - b.d);
    const best = dists[0];
    return {
      dx: best.dx + (Math.random() - 0.5) * 0.35,
      dy: best.dy + (Math.random() - 0.5) * 0.35,
    };
  }

  function clearScatterTimers() {
    if (scatterCheckId) clearInterval(scatterCheckId);
    if (scatterFallbackId) clearTimeout(scatterFallbackId);
    scatterCheckId = null;
    scatterFallbackId = null;
  }

  function returnPets() {
    if (!scatterBusy) return;
    pets.forEach((pet, i) => {
      clearTimeout(pet.timer);
      const maxX = Math.max(BOUNDS_PAD, stageW - pet.size - BOUNDS_PAD);
      const maxY = Math.max(BOUNDS_PAD, stageH - pet.size - BOUNDS_PAD);
      pet.x = BOUNDS_PAD + Math.random() * maxX;
      pet.y = BOUNDS_PAD + Math.random() * maxY;
      pet.away = false;
      pet.fleeing = false;
      pet.el.style.opacity = "1";
      pet.inner.className = "pet-inner idle-breath return-pop";
      const angle = (i / pets.length) * Math.PI * 2 + Math.random() * 0.5;
      pet.vx = Math.cos(angle) * (1.2 + Math.random() * 0.8);
      pet.vy = Math.sin(angle) * (1.2 + Math.random() * 0.8);
      clampSpeed(pet);
      setTimeout(() => pet.inner.classList.remove("return-pop"), 900);
    });
    scatterBusy = false;
  }

  function forceAllAway() {
    pets.forEach((pet) => {
      pet.away = true;
      pet.fleeing = false;
      pet.vx = 0;
      pet.vy = 0;
      pet.el.style.opacity = "0";
    });
  }

  function spaceScatter() {
    if (scatterBusy) return;
    scatterBusy = true;
    hint.classList.add("hidden");
    clearScatterTimers();
    PetAudio.laugh();

    pets.forEach((pet) => {
      clearTimeout(pet.timer);
      pet.away = false;
      pet.fleeing = true;
      pet.el.style.opacity = "1";
      const { dx, dy } = fleeDirection(pet);
      const len = Math.hypot(dx, dy) || 1;
      const speed = 10 + Math.random() * 4;
      pet.vx = (dx / len) * speed;
      pet.vy = (dy / len) * speed;
      pet.inner.classList.remove(...reactionClasses, "return-pop");
      pet.inner.classList.add("react-hop");
    });

    scatterCheckId = setInterval(() => {
      let allAway = true;
      for (const pet of pets) {
        if (pet.away) continue;
        const off =
          pet.x + pet.size < -30 ||
          pet.x > stageW + 30 ||
          pet.y + pet.size < -30 ||
          pet.y > stageH + 30;
        if (off) {
          pet.away = true;
          pet.fleeing = false;
          pet.vx = 0;
          pet.vy = 0;
          pet.el.style.opacity = "0";
        } else {
          allAway = false;
        }
      }
      if (allAway) {
        clearScatterTimers();
        scatterFallbackId = setTimeout(returnPets, 700);
      }
    }, 60);

    scatterFallbackId = setTimeout(() => {
      clearScatterTimers();
      forceAllAway();
      returnPets();
    }, 2400);
  }

  function updatePhysics() {
    const now = performance.now();
    for (const pet of pets) {
      if (pet.away) continue;

      if (pet.fleeing) {
        pet.x += pet.vx;
        pet.y += pet.vy;
        pet.el.style.transform = `translate3d(${pet.x}px, ${pet.y}px, 0)`;
        continue;
      }

      if (pet.dragUntil > now) {
        pet.vx *= 0.94;
        pet.vy *= 0.94;
      } else if (pet.boostUntil > now) {
        const sp = Math.hypot(pet.vx, pet.vy) || 0.5;
        pet.vx += (pet.vx / sp) * 0.08;
        pet.vy += (pet.vy / sp) * 0.08;
      }

      pet.vx *= FRICTION;
      pet.vy *= FRICTION;
      if (Math.abs(pet.vx) < 0.05 && Math.abs(pet.vy) < 0.05) {
        const drift = Math.random() * Math.PI * 2;
        pet.vx = Math.cos(drift) * 0.45;
        pet.vy = Math.sin(drift) * 0.45;
      }

      pet.x += pet.vx;
      pet.y += pet.vy;

      const maxX = stageW - pet.size - BOUNDS_PAD;
      const maxY = stageH - pet.size - BOUNDS_PAD;

      if (pet.x < BOUNDS_PAD) {
        pet.x = BOUNDS_PAD;
        pet.vx = Math.abs(pet.vx) * 0.95;
      } else if (pet.x > maxX) {
        pet.x = maxX;
        pet.vx = -Math.abs(pet.vx) * 0.95;
      }

      if (pet.y < BOUNDS_PAD) {
        pet.y = BOUNDS_PAD;
        pet.vy = Math.abs(pet.vy) * 0.95;
      } else if (pet.y > maxY) {
        pet.y = maxY;
        pet.vy = -Math.abs(pet.vy) * 0.95;
      }

      pet.el.style.transform = `translate3d(${pet.x}px, ${pet.y}px, 0)`;
    }

    const active = pets.filter((p) => !p.away && !p.fleeing);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        collidePair(active[i], active[j]);
      }
    }
  }

  function measureStage() {
    stageW = stage.clientWidth;
    stageH = stage.clientHeight;
  }

  function setPetImage(pet, pose, key) {
    const src = pickImage(pet.kind, pose, key, pet.slot);
    if (pet.img.src.endsWith(src)) return;
    pet.img.classList.add("swapping");
    const loader = new Image();
    loader.onload = () => {
      pet.img.src = src;
      pet.img.classList.remove("swapping");
    };
    loader.onerror = () => {
      pet.img.src = POOLS[pet.kind].sit[0];
      pet.img.classList.remove("swapping");
    };
    loader.src = src;
  }

  function resetPet(pet) {
    pet.inner.className = "pet-inner idle-breath";
    pet.inner.classList.remove(...reactionClasses);
    setPetImage(pet, "sit", lastKey);
  }

  function spawnPrint(pet) {
    const el = document.createElement("span");
    el.className = "print";
    el.textContent = pet.kind === "dog" ? "🐕" : "🐾";
    el.style.left = `${pet.x + pet.size * 0.35}px`;
    el.style.top = `${pet.y + pet.size * 0.2}px`;
    el.style.setProperty("--rot", `${-30 + Math.random() * 60}deg`);
    prints.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  function reactPet(pet, key, reaction) {
    clearTimeout(pet.timer);
    pet.inner.classList.remove("idle-breath", ...reactionClasses);
    setPetImage(pet, reaction.pose, key);
    pet.inner.classList.add(reaction.class);
    if (reaction.pose === "stretch") pet.inner.classList.add("pose-stretch");
    if (reaction.pose === "sleep") pet.inner.classList.add("pose-sleep");
    spawnPrint(pet);
    pet.timer = setTimeout(() => resetPet(pet), reaction.duration);
  }

  function reactAll(key) {
    hint.classList.add("hidden");
    const variant = hash(key) % 5;
    const baseReaction = pickReaction(key, 0);
    const useDogSound = hash(key, 7) % 2 === 0;
    const playSound = useDogSound ? baseReaction.dog : baseReaction.cat;
    playSound(variant);

    pets.forEach((pet, i) => applyKeyMotion(pet, key, i));

    pets.forEach((pet, i) => {
      const reaction = pickReaction(key, i + (pet.kind === "dog" ? 3 : 0));
      setTimeout(() => reactPet(pet, key, reaction), i * 40);
    });
  }

  function buildPet(def, index) {
    const el = document.createElement("div");
    el.className = `pet pet-${def.kind}`;
    const inner = document.createElement("div");
    inner.className = "pet-inner idle-breath";
    inner.style.setProperty("--i", index);

    const img = document.createElement("img");
    img.className = "pet-img";
    img.draggable = false;
    img.alt = "";
    img.src = POOLS[def.kind].sit[def.slot % POOLS[def.kind].sit.length];

    const shadow = document.createElement("div");
    shadow.className = "pet-shadow";

    inner.append(img, shadow);
    el.append(inner);
    petsRow.appendChild(el);

    const pet = {
      kind: def.kind,
      slot: def.slot,
      el,
      inner,
      img,
      timer: null,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 100,
      dragUntil: 0,
      boostUntil: 0,
      fleeing: false,
      away: false,
    };
    initMotion(pet, index);
    return pet;
  }

  function tick() {
    updatePhysics();
    requestAnimationFrame(tick);
  }

  function onKeyDown(e) {
    if (e.repeat) return;
    e.preventDefault();
    lastKey = e.key;
    PetAudio.wake();
    if (e.key === " ") {
      spaceScatter();
      return;
    }
    if (scatterBusy) return;
    reactAll(e.key);
  }

  function onPointerDown() {
    PetAudio.wake();
  }

  function onResize() {
    measureStage();
    pets.forEach((pet, i) => {
      const maxX = Math.max(BOUNDS_PAD, stageW - pet.size - BOUNDS_PAD);
      const maxY = Math.max(BOUNDS_PAD, stageH - pet.size - BOUNDS_PAD);
      pet.x = Math.min(pet.x, maxX);
      pet.y = Math.min(pet.y, maxY);
      pet.size = petSize(pet.kind);
      pet.el.style.width = `${pet.size}px`;
      pet.el.style.height = `${pet.size}px`;
    });
  }

  PET_DEFS.forEach((def, i) => pets.push(buildPet(def, i)));
  measureStage();
  window.addEventListener("resize", onResize);
  document.addEventListener("keydown", onKeyDown);
  room.addEventListener("pointerdown", onPointerDown);
  requestAnimationFrame(tick);

  window.addEventListener("load", () => {
    measureStage();
    onResize();
    window.focus();
    document.body.setAttribute("tabindex", "-1");
    document.body.focus();
  });
})();

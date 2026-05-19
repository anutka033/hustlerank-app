const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  document.addEventListener("click", async () => {
    try {
      await tg.requestFullscreen?.();
    } catch (e) {
      console.log("Fullscreen error:", e);
    }
  }, { once: true });
}

const SUPABASE_URL = "https://yxwsgvsejgmzocgnuukn.supabase.co";
const SUPABASE_KEY = "sb_publishable_CAb0_OQcsJmBLymP1qmAvA_OWW_bJED";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

const state = {
  xp: safeNumber(localStorage.getItem("xp"), 0),
  playerId: localStorage.getItem("playerId") || Math.floor(100000000 + Math.random() * 900000000).toString(),
  maxXp: Math.max(100, safeNumber(localStorage.getItem("maxXp"), 100)),
  level: Math.max(1, safeNumber(localStorage.getItem("level"), 1)),
  coins: safeNumber(localStorage.getItem("coins"), 0),
  stars: safeNumber(localStorage.getItem("stars"), 0),
  crystals: safeNumber(localStorage.getItem("crystals"), 0), // Додано поле crystals
  vip: localStorage.getItem("vip") === "true",
  vipUntil: Number(localStorage.getItem("vipUntil")) || 0,
  bonusTaken: localStorage.getItem("bonusTaken") === "true",
  inventory: JSON.parse(localStorage.getItem("inventory") || "[]"),
  boughtCards: JSON.parse(localStorage.getItem("boughtCards") || "[]"),
  cards: JSON.parse(localStorage.getItem("cards") || "{}"),
  lastLoginDate: localStorage.getItem("lastLoginDate") || "",
  dailyStreak: safeNumber(localStorage.getItem("dailyStreak"), 0),
  lastTreasuryClaim: safeNumber(localStorage.getItem("lastTreasuryClaim"), Date.now())
};

if (state.vip && !state.vipUntil) {
  state.vipUntil = Date.now() + (30 * 24 * 60 * 60 * 1000);
}

let vipFreeDropClaimed = localStorage.getItem("vipFreeDropClaimed") === "true";
localStorage.setItem("playerId", state.playerId);

const playerIdEl = document.getElementById("playerId");
if (playerIdEl) playerIdEl.textContent = "ID: " + state.playerId;

const cardsData = [
  { id: "novice", price: 10 },
  { id: "focus", price: 25 },
  { id: "leader", price: 75 },
  { id: "voidking", price: 150 },
  { id: "stormpaw", price: 650 },
  { id: "voidmage", price: 955 },
  { id: "shadowkeeper", price: 30 },
  { id: "hopeseed", price: 30 },
  { id: "willshard", price: 30 },
  { id: "voidemperor", price: 250 },
  { id: "solaremperor", price: 5000 },
  { id: "common01", price: 10 },
  { id: "common02", price: 10 },
  { id: "common03", price: 10 },
  { id: "rare01", price: 35 },
  { id: "rare02", price: 40 },
  { id: "rare03", price: 45 },
  { id: "epic02", price: 90 },
  { id: "legendary01", price: 950 },
  { id: "mythic01", price: 2500 },
  { id: "limited01", price: 9000 },
];

const modalCards = [
  {
    id: "novice",
    name: "Новичок",
    rarity: "ЭПИЧЕСКАЯ",
    status: "Статус: Первый шаг",
    price: 10,
    quote: "Каждый король когда-то был никем. Важно не где ты начал, а сколько раз ты не остановился.",
    img: "images/epic-smile.png"
  },
  {
    id: "focus",
    name: "Фокус",
    rarity: "РЕДКАЯ",
    status: "Статус: Концентрация",
    price: 25,
    quote: "Шум забирает слабых. Тишина собирает тех, кто знает, зачем он идёт.",
    img: "images/focus-mind.png"
  },
  {
    id: "leader",
    name: "Лидер",
    rarity: "ЛЕГЕНДАРНАЯ",
    status: "Статус: Контроль",
    price: 75,
    quote: "Лидер — это тот, кто идёт первым, даже когда остальные боятся сделать шаг.",
    img: "images/leader-core.png"
  },
  {
    id: "voidking",
    name: "Void King",
    rarity: "ЛЕГЕНДАРНАЯ",
    status: "Статус: Повелитель пустоты",
    price: 150,
    quote: "Пока остальные искали свет — он научился видеть в темноте.",
    img: "images/void-king.png"
  },
  {
    id: "stormpaw",
    name: "Storm Paw",
    rarity: "МИФИЧЕСКАЯ",
    status: "Статус: Повелитель бури",
    price: 650,
    quote: "Те, кто управляют молнией, сначала научились управлять собой.",
    img: "images/mystic-stormpaw.png"
  },
  {
    id: "voidmage",
    name: "Void Mage",
    rarity: "МИФИЧЕСКАЯ",
    status: "Статус: Архимаг пустоты",
    price: 955,
    quote: "Истинная сила приходит тогда, когда страх перестаёт управлять тобой.",
    img: "images/voidmage.png"
  },
  {
    id: "shadowkeeper",
    name: "Хранитель Тени",
    rarity: "ОБЫЧНАЯ",
    status: "Статус: Тихий разум",
    price: 30,
    quote: "Спокойствие сильнее шума.",
    img: "images/shadow-keeper.png"
  },
  {
    id: "hopeseed",
    name: "Семя Надежды",
    rarity: "ОБЫЧНАЯ",
    status: "Статус: Первый рост",
    price: 30,
    quote: "Даже слабый свет ведёт вперёд.",
    img: "images/hope-seed.png"
  },
  {
    id: "willshard",
    name: "Осколок Воли",
    rarity: "ОБЫЧНАЯ",
    status: "Статус: Внутренняя сила",
    price: 30,
    quote: "Сила рождается внутри.",
    img: "images/will-shard.png"
  },
  {
    id: "voidemperor",
    name: "Император Пустоты",
    rarity: "ЛЕГЕНДАРНАЯ",
    status: "Статус: Власть тишины",
    price: 250,
    quote: "Мир склоняется перед тем, кто владеет собой.",
    img: "images/void-emperor.png"
  },
  {
    id: "solaremperor",
    name: "Solar Emperor",
    rarity: "LIMITED",
    status: "Статус: Абсолютный свет",
    price: 5000,
    quote: "Даже звёзды склоняются перед вечностью.",
    img: "images/solar-emperor.png",
    specialGlow: true
  },
  {
    id: "common01",
    name: "Common One",
    rarity: "ОБЫЧНАЯ",
    status: "Статус: Базовая карта",
    price: 10,
    quote: "Каждый путь начинается с первого шага.",
    img: "images/common-01.png"
  },
  {
    id: "common02",
    name: "Common Two",
    rarity: "ОБЫЧНАЯ",
    status: "Статус: Начало силы",
    price: 10,
    quote: "Слабый сегодня — сильный завтра.",
    img: "images/common-02.png"
  },
  {
    id: "common03",
    name: "Common Three",
    rarity: "ОБЫЧНАЯ",
    status: "Статус: Первый опыт",
    price: 10,
    quote: "Опыт приходит через действия.",
    img: "images/common-03.png"
  },
  {
    id: "rare01",
    name: "Rare One",
    rarity: "РЕДКАЯ",
    status: "Статус: Редкая энергия",
    price: 35,
    quote: "Редкость рождает ценность.",
    img: "images/rare-01.png"
  },
  {
    id: "rare02",
    name: "Rare Two",
    rarity: "РЕДКАЯ",
    status: "Статус: Контроль",
    price: 40,
    quote: "Тишина сильнее шума.",
    img: "images/rare-02.png"
  },
  {
    id: "rare03",
    name: "Rare Three",
    rarity: "РЕДКАЯ",
    status: "Статус: Стабильность",
    price: 45,
    quote: "Стабильность побеждает хаос.",
    img: "images/rare-03.png"
  },
  {
    id: "epic02",
    name: "Epic Two",
    rarity: "ЭПИЧЕСКАЯ",
    status: "Статус: Высокий уровень",
    price: 90,
    quote: "Настоящая сила раскрывается со временем.",
    img: "images/epic-02.png"
  },
  {
    id: "legendary01",
    name: "Legendary",
    rarity: "ЛЕГЕНДАРНАЯ",
    status: "Статус: Легенда",
    price: 950,
    quote: "Легендами становятся через испытания.",
    img: "images/legendary-01.png"
  },
  {
    id: "mythic01",
    name: "Mythic",
    rarity: "МИФИЧЕСКАЯ",
    status: "Статус: Абсолют",
    price: 2500,
    quote: "Мифы создают те, кто не сдаются.",
    img: "images/mythic-01.png"
  },
  {
    id: "limited01",
    name: "Limited",
    rarity: "LIMITED",
    status: "Статус: Эксклюзив",
    price: 9000,
    quote: "Редкость определяет ценность.",
    img: "images/limited-01.png",
    specialGlow: true
  },
];

const tasks = [
  {
    id: "tg_channel",
    title: "Підписка на канал",
    desc: "Приєднуйся до нашої спільноти",
    icon: "📢",
    reward: { xp: 500, crystals: 20, stars: 0 },
    link: "https://t.me/hustlerank", 
    type: "social"
  },
  {
    id: "daily_checkin",
    title: "Щоденний бонус",
    desc: "Заходь у гру кожен день",
    icon: "📅",
    reward: { xp: 200, crystals: 5, stars: 1 },
    type: "daily"
  },
  {
    id: "card_collector",
    title: "Колекціонер",
    desc: "Збери 5 будь-яких карт",
    icon: "🃏",
    reward: { xp: 1000, crystals: 50, stars: 5 },
    type: "achievement",
    check: ( ) => Object.keys(state.cards).filter(id => state.cards[id].unlocked).length >= 5
  },
  {
    id: "invite_friends",
    title: "Запроси друга",
    desc: "Грай разом з друзями",
    icon: "👥",
    reward: { xp: 1500, crystals: 100, stars: 10 },
    link: "https://t.me/HustleRank033Bot", 
    type: "social"
  }
];

const levelEl = document.getElementById("level");
const rankName = document.getElementById("rankName");
const xpText = document.getElementById("xpText");
const xpFill = document.getElementById("xpFill");
const coinsEl = document.getElementById("coins");
const starsEl = document.getElementById("stars");
const ratingEl = document.getElementById("rating");
const incomePerHourEl = document.getElementById("incomePerHour");
const avatarEl = document.querySelector(".avatar");
const avatarImg = document.querySelector(".avatar img");
const earnBtn = document.getElementById("earnBtn");
const earnText = document.getElementById("earnText");
const bonusBtn = document.getElementById("bonusBtn");
const bonusTitle = document.getElementById("bonusTitle");
const bonusText = document.getElementById("bonusText");
const addCoinsBtn = document.getElementById("addCoinsBtn");
const toast = document.getElementById("toast");
const cardStars = document.getElementById("cardStars");

const screens = {
  home: document.getElementById("homeScreen"),
  tasks: document.getElementById("tasksScreen"),
  drops: document.getElementById("dropsScreen"),
  friends: document.getElementById("friendsScreen"),
  cards: document.getElementById("cardsScreen")
};

const navButtons = document.querySelectorAll(".bottom-nav button");

function save() {
  localStorage.setItem("xp", state.xp);
  localStorage.setItem("maxXp", state.maxXp);
  localStorage.setItem("level", state.level);
  localStorage.setItem("coins", state.coins);
  localStorage.setItem("stars", state.stars);
  localStorage.setItem("crystals", state.crystals);
  localStorage.setItem("vip", state.vip);
  localStorage.setItem("vipUntil", state.vipUntil);
  localStorage.setItem("bonusTaken", state.bonusTaken);
  localStorage.setItem("cards", JSON.stringify(state.cards));
  localStorage.setItem("inventory", JSON.stringify(state.inventory || []));
  localStorage.setItem("boughtCards", JSON.stringify(state.boughtCards || []));
  localStorage.setItem("lastLoginDate", state.lastLoginDate);
  localStorage.setItem("dailyStreak", state.dailyStreak);
  localStorage.setItem("lastTreasuryClaim", state.lastTreasuryClaim);
}

function rankByLevel(level) {
  if (level >= 25) return "Void King";
  if (level >= 16) return "Legend";
  if (level >= 10) return "Diamond";
  if (level >= 7) return "Pro Hustler";
  if (level >= 4) return "Hustler";
  if (level >= 2) return "Rookie";
  return "Новичок";
}

function xpPerClick() {
  if (state.level >= 10) return 150;
  if (state.level >= 7) return 90;
  if (state.level >= 4) return 35;
  if (state.level >= 2) return 10;
  return 5;
}

function isVipActive() {
  return state.vip && state.vipUntil > Date.now();
}

function addXp(amount) {
  const finalXp = isVipActive() ? Math.floor(amount * 1.25) : amount;
  state.xp += finalXp;
  return finalXp;
}

function showToast(text) {
    showPush("Сповіщення", text, "✨");
}


function checkLevelUp() {
  let leveledUp = false;
  while (state.maxXp > 0 && state.xp >= state.maxXp) {
    state.xp -= state.maxXp;
    state.level += 1;
    state.maxXp = Math.floor(state.maxXp * 2);
    if (!state.maxXp || state.maxXp < 1) {
      state.maxXp = 100;
    }
    leveledUp = true;
  }

  if (leveledUp && avatarEl) {
    avatarEl.classList.remove("level-up-flash");
    void avatarEl.offsetWidth;
    avatarEl.classList.add("level-up-flash");
    setTimeout(function () {
      avatarEl.classList.remove("level-up-flash");
    }, 900);
    showToast("🎉 Level " + state.level + "!");
  }
}

function updateAvatar() {
  if (!avatarEl || !avatarImg) return;
  avatarEl.classList.remove("avatar-11", "avatar-14", "avatar-17", "avatar-110");

  if (state.level >= 25) {
    avatarEl.classList.add("avatar-110");
    avatarImg.src = "images/avatar-voidking.png";
  } else if (state.level >= 16) {
    avatarEl.classList.add("avatar-110");
    avatarImg.src = "images/avatar-gold.png";
  } else if (state.level >= 10) {
    avatarEl.classList.add("avatar-17");
    avatarImg.src = "images/avatar-diamond.png";
  } else if (state.level >= 7) {
    avatarEl.classList.add("avatar-17");
    avatarImg.src = "images/avatar-red.png";
  } else if (state.level >= 4) {
    avatarEl.classList.add("avatar-14");
    avatarImg.src = "images/avatar-red.png";
  } else {
    avatarEl.classList.add("avatar-11");
    avatarImg.src = "images/avatar.png";
  }
}

function updateBonus() {
  if (!bonusBtn || !bonusTitle || !bonusText) return;
  if (state.bonusTaken) {
    bonusTitle.textContent = "Бонус уже забран";
    bonusText.textContent = "Возвращайся позже за новой наградой.";
    bonusBtn.textContent = "Получено";
    bonusBtn.disabled = true;
  } else {
    bonusTitle.textContent = "Ежедневный бонус";
    bonusText.textContent = "Забери 50 XP и 1 Gem каждый день";
    bonusBtn.textContent = "Забрать";
    bonusBtn.disabled = false;
  }
}

function updateDrops() {
  document.querySelectorAll(".drop").forEach(function (drop) {
    const need = Number(drop.dataset.level);
    const lock = drop.querySelector(".lock");
    if (!lock) return;
    if (state.level >= need) {
      drop.classList.add("open");
      lock.textContent = "✅ Доступ открыт";
    } else {
      drop.classList.remove("open");
      lock.textContent = "🔒 Доступ с Level " + need;
    }
  });
}

function updateCards() {
  const rankCards = document.querySelectorAll(".rank-card");
  if (cardStars) {
    cardStars.textContent = state.stars.toLocaleString("ru-RU");
  }

  rankCards.forEach(function(card) {
    const cardId = card.dataset.cardId;
    const data = cardsData.find(c => c.id === cardId);
    if (!data) return;

    const button = card.querySelector(".unlock-btn, .locked-btn");
    const unlocked = state.cards[data.id] && state.cards[data.id].unlocked;

    card.classList.toggle("card-owned", unlocked);
    card.classList.toggle("card-can-buy", !unlocked && state.stars >= data.price);

    if (!button) return;
    const enoughStars = state.stars >= data.price;
    card.classList.toggle("not-enough", !unlocked && !enoughStars);

    if (unlocked) {
      button.textContent = "Куплена";
      button.disabled = true;
    } else {
      button.textContent = "⭐ " + data.price;
      button.disabled = false;
    }
  });
}

function updateUI() {
  checkLevelUp();
  const percent = Math.min(100, Math.floor((state.xp / state.maxXp) * 100));
  const avatar = document.querySelector(".avatar");
  if (avatar) {
    avatar.classList.toggle("vip-avatar", isVipActive());
    const deg = percent * 3.6;
    avatar.style.setProperty("--xpDeg", deg + "deg");
  }

  if (levelEl) levelEl.textContent = state.level;
  if (rankName) rankName.textContent = rankByLevel(state.level);
  if (xpText) xpText.textContent = state.xp + " / " + state.maxXp + " XP";
  if (xpFill) xpFill.style.width = percent + "%";
  if (coinsEl) coinsEl.textContent = state.crystals.toLocaleString("ru-RU");
  if (starsEl) starsEl.textContent = state.stars.toLocaleString("ru-RU");
  if (ratingEl) ratingEl.textContent = state.level >= 2 ? "#" + (900 - state.level * 37) : "#---";
  if (incomePerHourEl) incomePerHourEl.textContent = "+0/час";
  if (earnText) earnText.textContent = "Перейти к заданиям";

  updateAvatar();
  updateBonus();
  updateDrops();
  updateCards();

  const vipBadge = document.getElementById("vipBadge");
  if (vipBadge) {
    vipBadge.style.display = isVipActive() ? "inline-flex" : "none";
  }

  const vipBtn = document.getElementById("vipBtn");
  if (vipBtn) {
    if (isVipActive()) {
      vipBtn.classList.add("disabled");
    } else {
      vipBtn.classList.remove("disabled");
    }
    vipBtn.innerHTML = "<span>👑</span> VIP";
  }
  save();
}

function openScreen(name) {
  // 1. Ховаємо всі екрани
  Object.values(screens).forEach(function (screen) {
    if (screen) screen.classList.remove("active-screen");
  });

  // 2. Знімаємо активність з усіх кнопок навігації
  navButtons.forEach(function (button) {
    button.classList.remove("active");
  });

  // 3. Показуємо потрібний екран
  if (screens[name]) {
    screens[name].classList.add("active-screen");
    if (name === "tasks") renderTasks();
  }

  // --- КЕРУВАННЯ ВИДИМІСТЮ СКАРБНИЦІ ---
  const treasury = document.getElementById("treasuryWidget");
  const sideMenu = document.getElementById("sideMenu");

  if (name === "home") {
    if (treasury) treasury.style.display = "flex";
    if (sideMenu) sideMenu.style.display = "flex";
  } else {
    if (treasury) treasury.style.display = "none";
    if (sideMenu) sideMenu.style.display = "none";
  }
}


navButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const screen = button.dataset.screen;
    openScreen(screen);
    button.classList.add("active");
  });
});

document.querySelectorAll("[data-open]").forEach(function (button) {
  button.addEventListener("click", function () {
    const screen = button.dataset.open;
    openScreen(screen);
    navButtons.forEach(function (navButton) {
      navButton.classList.remove("active");
      if (navButton.dataset.screen === screen) {
        navButton.classList.add("active");
      }
    });
  });
});

if (earnBtn) {
  earnBtn.addEventListener("click", function () {
    const tasksBtn = document.querySelector('[data-screen="tasks"]');
    if (tasksBtn) tasksBtn.click();
  });
}

if (bonusBtn) {
  bonusBtn.addEventListener("click", function () {
    if (state.bonusTaken) return;
    state.xp += 50;
    state.stars += 1;
    state.bonusTaken = true;
    updateUI();
    showToast("+50 XP и +1 Gem");
  });
}

if (addCoinsBtn) {
  addCoinsBtn.addEventListener("click", function () {
    state.stars += 100;
    updateUI();
    showToast("+100 ⭐");
  });
}

let cardsTab = "shop";
const cardsTabs = document.querySelectorAll(".tab-btn");
const marketScreen = document.getElementById("marketScreen");
const cardsGrid = document.querySelector(".new-cards-grid");

if (marketScreen) marketScreen.style.display = "none";
if (cardsGrid) cardsGrid.style.display = "grid";

cardsTabs.forEach(function(btn){
  btn.addEventListener("click", function(){
    cardsTabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    cardsTab = btn.dataset.cardsTab;

    if (cardsTab === "market") {
      if (marketScreen) marketScreen.style.display = "block";
      if (cardsGrid) cardsGrid.style.display = "none";
    } else {
      if (marketScreen) marketScreen.style.display = "none";
      if (cardsGrid) cardsGrid.style.display = "grid";
    }
    updateCardsView();
  });
});

function updateCardsView(){
  const grid = document.querySelector(".new-cards-grid");
  if(!grid) return;

  document.querySelectorAll(".case-owned-card").forEach(card => card.remove());

  const htmlCards = document.querySelectorAll(".rank-card:not(.case-owned-card)");
  htmlCards.forEach(function(card){
    const cardId = card.dataset.cardId;
    const data = modalCards.find(c => c.id === cardId);
    const isOwned = data && state.cards[data.id] && state.cards[data.id].unlocked;

    if(cardsTab === "inventory"){
      card.style.display = "none";
    } else {
      card.style.display = isOwned ? "none" : "";
    }
  });

  if(cardsTab !== "inventory") return;

  let ownedFullCards = [];
  modalCards.forEach(function(card){
    if(state.cards[card.id] && state.cards[card.id].unlocked){
      ownedFullCards.push(card);
    }
  });

  if(state.boughtCards){
    state.boughtCards.forEach(function(card){
      if(!card || !card.id) return;
      const fullCard = modalCards.find(item => item.id === card.id);
      if(fullCard && !ownedFullCards.some(item => item.id === fullCard.id)){
        ownedFullCards.push(fullCard);
      }
    });
  }

  ownedFullCards.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));

  ownedFullCards.forEach(function(cardData){
    const card = document.createElement("div");
    card.className = "rank-card case-owned-card";
    if(cardData.specialGlow){
      card.classList.add("inventory-premium");
    }
    const rarity = (cardData.rarity || "").toLowerCase();
    if(rarity.includes("обы")) card.classList.add("common");
    if(rarity.includes("ред")) card.classList.add("rare");
    if(rarity.includes("эпи")) card.classList.add("epic");
    if(rarity.includes("леген")) card.classList.add("legendary");
    if(rarity.includes("миф")) card.classList.add("mythic");
    if(rarity.includes("limit")) card.classList.add("limited-card");

    card.innerHTML = `
      <div class="rank-top">
        <span class="rarity">${cardData.rarity}</span>
      </div>
      <img src="${cardData.img}" alt="${cardData.name}">
      <button class="unlock-btn" disabled>🏆 В коллекции</button>
    `;

    card.addEventListener("click", function(){
      const cardModal = document.getElementById("cardModal");
      const modalCardImg = document.getElementById("modalCardImg");
      const modalCardName = document.getElementById("modalCardName");
      const modalName = document.getElementById("modalName");
      const modalRarity = document.getElementById("modalRarity");
      const modalStatus = document.getElementById("modalStatus");
      const modalPrice = document.getElementById("modalPrice");
      const modalQuote = document.getElementById("modalQuote");
      const modalActionBtn = document.getElementById("modalActionBtn");

      if (modalCardImg) modalCardImg.src = cardData.img;
      if (modalCardName) modalCardName.textContent = cardData.name;
      if (modalName) modalName.textContent = cardData.name;
      if (modalRarity) modalRarity.textContent = cardData.rarity;
      if (modalStatus) modalStatus.textContent = cardData.status;
      if (modalPrice) modalPrice.textContent = cardData.price;
      if (modalQuote) modalQuote.textContent = cardData.quote;

      if (modalActionBtn) {
        modalActionBtn.innerHTML = "🎁 Подарить карту";
        modalActionBtn.onclick = function () {
          selectedGiftCard = cardData;
          const giftModal = document.getElementById("giftModal");
          if (giftModal) giftModal.classList.add("show");
        };
      }

      if (cardModal) {
        cardModal.classList.add("show");
        cardModal.classList.remove("view-front");
      }
      const viewCardBtn = document.getElementById("viewCardBtn");
      if (viewCardBtn) viewCardBtn.textContent = "👁 Смотреть карту";
      const nav = document.querySelector(".bottom-nav");
      if (nav) nav.classList.add("hide-nav");
    });

    grid.appendChild(card);
  });
}

document.querySelectorAll(".rank-card").forEach(function (card) {
  card.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (button) return;

    const cardId = card.dataset.cardId;
    const data = modalCards.find(c => c.id === cardId);
    if (!data) return;

    const current = state.cards[data.id] || { unlocked: false, level: 0 };
    
    if (current.unlocked) {
      showToast("Карта уже куплена");
    }
    updateUI();
  });
});

const cardModal = document.getElementById("cardModal");
const cardModalBg = document.getElementById("cardModalBg");
const modalClose = document.getElementById("modalClose");
const viewCardBtn = document.getElementById("viewCardBtn");
const flipBackBtn = document.getElementById("flipBackBtn");

if (flipBackBtn) {
  flipBackBtn.addEventListener("click", function () {
    if (cardModal) cardModal.classList.toggle("view-front");
  });
}

document.querySelectorAll(".rank-card").forEach(function(card){
  card.addEventListener("click", function(event){
    const button = event.target.closest("button");
    const isInventoryOpen = document.querySelector('[data-cards-tab="inventory"]')?.classList.contains("active");
    const isBuyButton = !isInventoryOpen && card.closest("#cardsScreen") && card.querySelector(".unlock-btn");

    const cardId = card.dataset.cardId;
    const data = modalCards.find(c => c.id === cardId);
    if (!data) return;

    const cardModal = document.getElementById("cardModal");
    const modalCardImg = document.getElementById("modalCardImg");
    const modalCardName = document.getElementById("modalCardName");
    const modalName = document.getElementById("modalName");
    const modalRarity = document.getElementById("modalRarity");
    const modalStatus = document.getElementById("modalStatus");
    const modalPrice = document.getElementById("modalPrice");
    const modalQuote = document.getElementById("modalQuote");
    const actionBtn = document.getElementById("modalActionBtn");

    if (modalCardImg) modalCardImg.src = data.img;
    if (modalCardName) modalCardName.textContent = data.name;
    if (modalName) modalName.textContent = data.name;
    if (modalRarity) modalRarity.textContent = data.rarity;
    if (modalStatus) modalStatus.textContent = data.status;
    if (modalPrice) modalPrice.textContent = data.price;
    if (modalQuote) modalQuote.textContent = data.quote;

    if (actionBtn) {
      if (isBuyButton) {
        actionBtn.innerHTML = "🛒 Купить карту";
        actionBtn.onclick = function () {
          selectedCard = data;
          const buyConfirmPrice = document.getElementById("buyConfirmPrice");
          const buyConfirmModal = document.getElementById("buyConfirmModal");
          if (buyConfirmPrice) buyConfirmPrice.textContent = data.price;
          if (buyConfirmModal) buyConfirmModal.classList.add("show");
        };
      } else {
        actionBtn.innerHTML = "🎁 Подарить карту";
        actionBtn.onclick = function () {
          const giftModal = document.getElementById("giftModal");
          if (giftModal) giftModal.classList.add("show");
          selectedGiftCard = data;
        };
      }
    }
    
    if (cardModal) {
      if (data.id === "limited01") cardModal.classList.add("limited-aura");
      else cardModal.classList.remove("limited-aura");
      cardModal.classList.add("show");
      cardModal.classList.remove("view-front");
    }
    const viewCardBtn = document.getElementById("viewCardBtn");
    if (viewCardBtn) viewCardBtn.textContent = "👁 Смотреть карту";
    const nav = document.querySelector(".bottom-nav");
    if (nav) nav.classList.add("hide-nav");
  });
});

function closeCardModal(){
  if (cardModal) cardModal.classList.remove("show");
  const nav = document.querySelector(".bottom-nav");
  if (nav) nav.classList.remove("hide-nav");
}

if (modalClose) modalClose.addEventListener("click", closeCardModal);
if (cardModalBg) cardModalBg.addEventListener("click", closeCardModal);

const openShopBtn = document.getElementById("openShopBtn");
const shopModal = document.getElementById("shopModal");
const shopBg = document.getElementById("shopBg");
const shopClose = document.getElementById("shopClose");
const buyConfirmModal = document.getElementById("buyConfirmModal");
const confirmBuyBtn = document.getElementById("confirmBuyBtn");
const cancelBuyBtn = document.getElementById("cancelBuyBtn");

let selectedCard = null;
let selectedGiftCard = null;

if (confirmBuyBtn) {
  confirmBuyBtn.addEventListener("click", function () {
    if (!selectedCard) return;
    if (state.stars < selectedCard.price) {
      showToast("Недостаточно звёзд");
      if (buyConfirmModal) buyConfirmModal.classList.remove("show");
      return;
    }

    state.stars -= selectedCard.price;
    if (!state.cards[selectedCard.id]) {
      state.cards[selectedCard.id] = { unlocked: false, level: 0 };
    }
    state.cards[selectedCard.id].unlocked = true;
    state.cards[selectedCard.id].level = 1;
    
    if (!state.boughtCards) state.boughtCards = [];
    state.boughtCards.push(selectedCard);

    updateUI();
    updateCardsView();
    if (buyConfirmModal) buyConfirmModal.classList.remove("show");
    showToast("Карта куплена");
  });
}

if (cancelBuyBtn) {
  cancelBuyBtn.addEventListener("click", function () {
    if (buyConfirmModal) buyConfirmModal.classList.remove("show");
  });
}

function openShop(){
  if (shopModal) {
    shopModal.classList.add("show");
    const nav = document.querySelector(".bottom-nav");
    if (nav) nav.classList.add("hide-nav");
  }
}

function closeShop(){
  if (shopModal) {
    shopModal.classList.remove("show");
    const nav = document.querySelector(".bottom-nav");
    if (nav) nav.classList.remove("hide-nav");
  }
}

if (openShopBtn) openShopBtn.addEventListener("click", openShop);
if (shopBg) shopBg.addEventListener("click", closeShop);
if (shopClose) shopClose.addEventListener("click", closeShop);

const starPrices = { 150: 5, 500: 15, 1200: 30, 3500: 80, 12000: 250 };

document.querySelectorAll(".shop-pack").forEach((pack) => {
  pack.addEventListener("click", async () => {
    const starsAmount = Number(pack.dataset.stars);
    const priceStars = starPrices[starsAmount];
    try {
      const response = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: state.playerId, starsAmount, priceStars })
      });
      const data = await response.json();
      if (data.invoiceLink) {
        tg.openInvoice(data.invoiceLink, (status) => {
          if (status === "paid") {
            state.stars += starsAmount;
            save();
            updateUI();
            showToast("Покупка успешно завершена!");
          }
        });
      } else {
        alert("Ошибка invoice: " + JSON.stringify(data));
      }
    } catch (err) {
      console.log(err);
      alert("Ошибка покупки: " + err.message);
    }
  });
});

document.querySelectorAll(".rank-card").forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 12;
    const rotateX = ((y / rect.height) - 0.5) * -12;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

document.addEventListener("input", function (event) {
  if (event.target.id === "giftUserId") {
    const sendBtn = document.getElementById("sendGiftBtn");
    const value = event.target.value.trim();
    if (sendBtn) {
      sendBtn.disabled = value.length !== 9;
      sendBtn.style.opacity = value.length === 9 ? "1" : ".5";
      sendBtn.style.cursor = value.length === 9 ? "pointer" : "not-allowed";
    }
  }
});

document.addEventListener("click", async function (event) {
  if (event.target.closest("#cancelGiftBtn")) {
    const giftModal = document.getElementById("giftModal");
    if (giftModal) giftModal.classList.remove("show");
    selectedGiftCard = null;
    const giftUserId = document.getElementById("giftUserId");
    if (giftUserId) giftUserId.value = "";
    return;
  }
  if (event.target.closest("#sendGiftBtn")) {
    const giftUserIdEl = document.getElementById("giftUserId");
    const receiverId = giftUserIdEl ? giftUserIdEl.value.trim() : "";

    if (receiverId.length !== 9) {
      alert("ID должен быть ровно 9 цифр");
      return;
    }
    if (!selectedGiftCard) {
      alert("Сначала выбери карту");
      return;
    }
    if (receiverId === state.playerId) {
      alert("Нельзя отправить карту самому себе");
      return;
    }

    const { error } = await supabaseClient
      .from("trades")
      .insert({
        sender_id: state.playerId,
        receiver_id: receiverId,
        card_id: selectedGiftCard.id,
        status: "sent"
      });

    if (error) {
      alert("Ошибка отправки: " + error.message);
      return;
    }

    state.boughtCards = state.boughtCards.filter(card => card.id !== selectedGiftCard.id);
    if (state.cards[selectedGiftCard.id]) {
      state.cards[selectedGiftCard.id].unlocked = false;
    }
    save();
    updateCardsView();
    selectedGiftCard = null;
    const giftModal = document.getElementById("giftModal");
    if (giftModal) giftModal.classList.remove("show");
    alert("🎁 Карта отправлена игроку ID: " + receiverId);
  }
});

const REF_BASE_URL = "https://hustlerank-app.vercel.app/";
const referralLink = `https://t.me/HustleRank033Bot?startapp=ref_${state.playerId}`;
const urlParams = new URLSearchParams(window.location.search);
let referrerId = urlParams.get("ref");

if (tg) {
  const startParam = tg.initDataUnsafe?.start_param;
  if (startParam && startParam.startsWith("ref_")) {
    referrerId = startParam.replace("ref_", "");
  }
}

async function registerReferral() {
  if (!referrerId || referrerId === state.playerId || localStorage.getItem("referralRegistered")) return;
  const { data: existingReferral } = await supabaseClient.from("referrals").select("*").eq("invited_id", state.playerId).maybeSingle();
  if (existingReferral) return;

  await supabaseClient.from("referrals").insert({
    referrer_id: referrerId,
    invited_id: state.playerId,
    invited_level: state.level || 1,
    reward_claimed: false
  });
  localStorage.setItem("referralRegistered", "true");
  showToast("🎉 Вы зарегистрированы как приглашённый друг!");
}

registerReferral();

const inviteFriendBtn = document.getElementById("inviteFriendBtn");
const copyRefBtn = document.getElementById("copyRefBtn");

if (inviteFriendBtn) {
  inviteFriendBtn.addEventListener("click", async function () {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: state.playerId })
    });
    const data = await response.json();
    if (data.preparedMessageId && tg?.shareMessage) {
      tg.shareMessage(data.preparedMessageId);
      return;
    }
    const fallbackUrl = `https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent(data.text)}`;
    window.open(fallbackUrl, "_blank");
  });
}

if (copyRefBtn) {
  copyRefBtn.addEventListener("click", function () {
    navigator.clipboard.writeText(referralLink);
    copyRefBtn.textContent = "✅";
    setTimeout(() => copyRefBtn.textContent = "📋", 1500);
  });
}

const invitedFriends = [];
const friendsContainer = document.getElementById("friendsContainer");
const friendEmpty = document.getElementById("friendEmpty");

function renderFriends() {
  if (!friendsContainer) return;
  friendsContainer.innerHTML = "";
  const friendsCountEl = document.getElementById("friendsCount");
  if (friendsCountEl) friendsCountEl.textContent = invitedFriends.length;

  if (invitedFriends.length === 0) {
    if (friendEmpty) friendEmpty.style.display = "block";
    return;
  }
  if (friendEmpty) friendEmpty.style.display = "none";

  invitedFriends.forEach(function(friend) {
    friendsContainer.innerHTML += `
      <div class="friend-item">
        <div class="friend-left">
          <div class="friend-avatar">${friend.name[0]}</div>
          <div>
            <div class="friend-top">
              <span class="friend-level">${friend.level || 1} lvl</span>
              <span class="friend-name">${friend.name}</span>
            </div>
            <div class="friend-income">Доход в час: ${friend.income || 0}</div>
          </div>
        </div>
        <div class="friend-reward">${friend.reward || 0}</div>
      </div>
    `;
  });
}

async function loadReferrals() {
  const { data, error } = await supabaseClient.from("referrals").select("*").eq("referrer_id", state.playerId);
  if (error) {
    console.log(error);
    return;
  }
  invitedFriends.length = 0;
  let availableStars = 0;
  let availableCrystals = 0;

  data.forEach(function(ref) {
    invitedFriends.push({
      name: "Игрок",
      level: ref.invited_level,
      income: 0,
      reward: ref.reward_claimed ? "✅" : "🎁"
    });
    if (ref.invited_level >= 3 && !ref.reward_claimed) {
      availableStars += 250;
      availableCrystals += 500;
    }
  });

  const friendsCountEl = document.getElementById("friendsCount");
  if (friendsCountEl) friendsCountEl.textContent = data.length;
  const claimStarsEl = document.getElementById("claimStars");
  if (claimStarsEl) claimStarsEl.textContent = availableStars;
  const claimCrystalsEl = document.getElementById("claimCrystals");
  if (claimCrystalsEl) claimCrystalsEl.textContent = availableCrystals;

  renderFriends();
}

const claimRefBtn = document.getElementById("claimRefBtn");
if (claimRefBtn) {
  claimRefBtn.addEventListener("click", async function () {
    const { data } = await supabaseClient.from("referrals").select("*").eq("referrer_id", state.playerId);
    let rewardCount = 0;
    for (const ref of data) {
      if (ref.invited_level >= 3 && !ref.reward_claimed) {
        rewardCount++;
        await supabaseClient.from("referrals").update({ reward_claimed: true }).eq("id", ref.id);
      }
    }
    if (rewardCount <= 0) {
      alert("Нет наград");
      return;
    }
    state.stars += rewardCount * 250;
    state.crystals += rewardCount * 500;
    save();
    updateUI();
    alert("🎉 Награда получена!");
    loadReferrals();
  });
}

const openDropBtn = document.getElementById("openDropBtn");
const dropModal = document.getElementById("dropModal");
const closeDropModal = document.getElementById("closeDropModal");
let lastDropCard = null;
let isDropRolling = false;

if (closeDropModal) {
  closeDropModal.addEventListener("click", function () {
    if (!lastDropCard) return;
    if (!state.cards[lastDropCard.id]) {
      state.cards[lastDropCard.id] = { unlocked: false, level: 0 };
    }
    state.cards[lastDropCard.id].unlocked = true;
    state.cards[lastDropCard.id].level = 1;
    if (!state.boughtCards) state.boughtCards = [];
    
    const fullCard = modalCards.find(card => card.id === lastDropCard.id);
    if (fullCard && !state.boughtCards.some(card => card.id === fullCard.id)) {
      state.boughtCards.push({
        id: fullCard.id,
        name: fullCard.name,
        img: fullCard.img,
        rarity: fullCard.rarity,
        price: fullCard.price || 0
      });
    }
    save();
    updateUI();
    updateCardsView();
    showToast("Карта добавлена в инвентарь");
    lastDropCard = null;
    if (dropModal) dropModal.classList.remove("show");
    closeDropModal.style.display = "none";
  });
}

const caseCards = [
  { id: "common01", name: "Common One", img: "images/common-01.png", rarity: "common" },
  { id: "common02", name: "Common Two", img: "images/common-02.png", rarity: "common" },
  { id: "common03", name: "Common Three", img: "images/common-03.png", rarity: "common" },
  { id: "rare01", name: "Rare One", img: "images/rare-01.png", rarity: "rare" },
  { id: "rare02", name: "Rare Two", img: "images/rare-02.png", rarity: "rare" },
  { id: "rare03", name: "Rare Three", img: "images/rare-03.png", rarity: "rare" },
  { id: "epic02", name: "Epic Two", img: "images/epic-02.png", rarity: "epic" },
  { id: "legendary01", name: "Legendary", img: "images/legendary-01.png", rarity: "legendary" },
  { id: "mythic01", name: "Mythic", img: "images/mythic-01.png", rarity: "mythic" },
  { id: "limited01", name: "Limited", img: "images/limited-01.png", rarity: "limited" }
];

if (openDropBtn) {
  openDropBtn.addEventListener("click", function () {
    if (isDropRolling) return;
    let freeVipDrop = false;
    if (isVipActive() && !vipFreeDropClaimed) {
      freeVipDrop = true;
      vipFreeDropClaimed = true;
      localStorage.setItem("vipFreeDropClaimed", "true");
    }

    if (!freeVipDrop) {
      if (state.stars < 100) {
        showToast("Недостаточно ⭐ для дропа");
        return;
      }
      state.stars -= 100;
      save();
      updateUI();
    } else {
      showToast("🎁 VIP бесплатный дроп");
    }

    isDropRolling = true;
    lastDropCard = null;
    if (closeDropModal) closeDropModal.style.display = "none";
    if (dropModal) dropModal.classList.add("show");

    const roulette = document.getElementById("caseRoulette");
    const rouletteTrack = document.getElementById("rouletteTrack");
    if (roulette) roulette.style.display = "flex";
    if (rouletteTrack) {
      rouletteTrack.innerHTML = "";
      const items = [];
      for(let i = 0; i < 40; i++){
        const random = caseCards[Math.floor(Math.random() * caseCards.length)];
        items.push(random);
        rouletteTrack.innerHTML += `
          <div class="roulette-card rarity-${random.rarity}">
            <img src="${random.img}">
          </div>
        `;
      }
      const winner = caseCards[Math.floor(Math.random() * caseCards.length)];
      lastDropCard = winner;
      items[34] = winner;
      rouletteTrack.children[34].outerHTML = `
        <div class="roulette-card rarity-${winner.rarity}">
          <img src="${winner.img}">
        </div>
      `;
      rouletteTrack.style.transition = "none";
      rouletteTrack.style.transform = "translateX(0px)";
      setTimeout(() => {
        rouletteTrack.style.transition = "transform 5s cubic-bezier(.08,.6,0,1)";
        const offset = (34 * 134) - 1300;
        rouletteTrack.style.transform = `translateX(-${offset}px)`;
      }, 100);
      setTimeout(() => {
        isDropRolling = false;
        if (closeDropModal) closeDropModal.style.display = "block";
      }, 5200);
    }
  });
}

function updateDailyDropVisibility() {
  const dailyDropWidget = document.querySelector(".daily-drop");
  const homeScreen = document.getElementById("homeScreen");
  if (!dailyDropWidget || !homeScreen) return;
  const isHome = homeScreen.classList.contains("active-screen") || homeScreen.classList.contains("active");
  dailyDropWidget.style.display = isHome ? "flex" : "none";
}

function updateSideActionsVisibility() {
  const leftPanel = document.querySelector(".left-actions");
  const rightPanel = document.querySelector(".right-actions");
  const homeScreen = document.getElementById("homeScreen");
  if (!leftPanel || !rightPanel || !homeScreen) return;
  const isHome = homeScreen.classList.contains("active-screen") || homeScreen.classList.contains("active");
  leftPanel.style.display = isHome ? "flex" : "none";
  rightPanel.style.display = isHome ? "flex" : "none";
}

const telegramTaskBtn = document.getElementById("telegramTaskBtn");
const claimTelegramTaskBtn = document.getElementById("claimTelegramTaskBtn");
const telegramTaskCard = document.querySelector(".telegram-task");
let telegramTaskOpened = false;
let telegramTaskClaimed = false;

if (telegramTaskBtn) {
  telegramTaskBtn.addEventListener("click", function () {
    if (telegramTaskClaimed) return;
    if (!telegramTaskOpened) {
      telegramTaskOpened = true;
      telegramTaskBtn.textContent = "Проверить";
      window.open("https://t.me/hustlerank", "_blank");
      return;
    }
    if (claimTelegramTaskBtn) claimTelegramTaskBtn.classList.remove("hidden");
    telegramTaskBtn.textContent = "Проверено";
    telegramTaskBtn.disabled = true;
  });
}

if (claimTelegramTaskBtn) {
  claimTelegramTaskBtn.addEventListener("click", function () {
    if (telegramTaskClaimed) return;
    const gainedStars = isVipActive() ? 100 : 50;
    const gainedCoins = isVipActive() ? 1000 : 500;
    state.stars += gainedStars;
    state.coins += gainedCoins;
    const gainedXp = addXp(1500);
    telegramTaskClaimed = true;
    claimTelegramTaskBtn.classList.add("hidden");
    telegramTaskBtn.textContent = "Выполнено";
    telegramTaskBtn.disabled = true;
    if (telegramTaskCard) telegramTaskCard.classList.add("completed");
    updateUI();
    showToast("+" + gainedStars + " ⭐ + " + gainedCoins + " 💎 +" + gainedXp + " XP");
  });
}

const dailyClaimBtn = document.getElementById("dailyClaimBtn");
const dailyDropTimer = document.getElementById("dailyDropTimer");
let dailyDropEndTime = Number(localStorage.getItem("dailyDropEndTime")) || 0;

function updateDailyTimer() {
  if (!dailyClaimBtn || !dailyDropTimer) return;
  const now = Date.now();
  const left = dailyDropEndTime - now;
  const claimDailyBtn = document.getElementById("claimDailyBtn");

  if (left <= 0) {
    dailyClaimBtn.style.display = "block";
    dailyClaimBtn.disabled = false;
    dailyClaimBtn.style.pointerEvents = "auto";
    dailyClaimBtn.style.opacity = "1";
    dailyDropTimer.textContent = "Готово";
    dailyClaimBtn.textContent = "Забрать";
    if (claimDailyBtn) {
      claimDailyBtn.disabled = false;
      claimDailyBtn.textContent = "Забрать";
      claimDailyBtn.style.background = "";
      claimDailyBtn.style.color = "";
      claimDailyBtn.style.cursor = "pointer";
      claimDailyBtn.style.boxShadow = "";
    }
    return;
  }

  dailyClaimBtn.style.display = "block";
  dailyClaimBtn.disabled = true;
  if (claimDailyBtn) {
    claimDailyBtn.disabled = true;
    claimDailyBtn.textContent = "Уже забрано";
    claimDailyBtn.style.background = "#5f6475";
    claimDailyBtn.style.color = "#cfd3df";
    claimDailyBtn.style.cursor = "not-allowed";
    claimDailyBtn.style.boxShadow = "none";
  }
  const totalSeconds = Math.floor(left / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const timerText = String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  dailyClaimBtn.textContent = timerText;
  dailyClaimBtn.style.pointerEvents = "none";
  dailyClaimBtn.style.opacity = "0.7";
}

if (dailyClaimBtn) {
  dailyClaimBtn.addEventListener("click", function () {
    if (dailyDropEndTime > Date.now()) return;
    const gainedStars = isVipActive() ? 100 : 50;
    state.stars += gainedStars;
    const gainedXp = addXp(500);
    updateUI();
    dailyDropEndTime = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("dailyDropEndTime", dailyDropEndTime);
    updateDailyTimer();
    showToast("+" + gainedStars + " ⭐ и +" + gainedXp + " XP");
  });
}

async function loadIncomingCards() {
  const { data, error } = await supabaseClient.from("trades").select("*").eq("receiver_id", state.playerId).eq("status", "sent");
  if (error || !data) return;
  let received = false;
  data.forEach(function (trade) {
    const alreadyExists = state.boughtCards.some(card => card.id === trade.card_id);
    if (!alreadyExists) {
      const foundCard = modalCards.find(card => card.id === trade.card_id);
      if (foundCard) {
        state.boughtCards.push(foundCard);
        received = true;
      }
    }
  });
  if (received) {
    save();
    updateCardsView();
    alert("🎁 Вам пришла новая карта!");
  }
}

supabaseClient.channel("incoming-trades-" + state.playerId).on("postgres_changes", { event: "INSERT", schema: "public", table: "trades", filter: "receiver_id=eq." + state.playerId }, () => loadIncomingCards()).subscribe();

const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
if (menuToggle && sideMenu) {
  menuToggle.addEventListener("click", () => {
    sideMenu.classList.toggle("open");
    menuToggle.textContent = sideMenu.classList.contains("open") ? "❮" : "❯";
  });
}

const vipMenuBtn = document.getElementById("vipBtn");
const vipModal = document.getElementById("vipModal");
const vipCancelBtn = document.getElementById("vipCancelBtn");
const vipBuyBtn = document.getElementById("vipBuyBtn");

if (vipMenuBtn && vipModal && vipCancelBtn && vipBuyBtn) {
  vipMenuBtn.addEventListener("click", () => {
    if (isVipActive()) {
      showToast("👑 VIP уже активен");
      return;
    }
    vipModal.classList.add("show");
  });
  vipCancelBtn.addEventListener("click", () => vipModal.classList.remove("show"));
  vipBuyBtn.addEventListener("click", async () => {
    if (isVipActive()) {
      showToast("👑 VIP уже активен");
      vipModal.classList.remove("show");
      return;
    }
    try {
      const response = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: state.playerId, starsAmount: 1, priceStars: 150, vipPurchase: true })
      });
      const data = await response.json();
      if (data.invoiceLink) {
        tg.openInvoice(data.invoiceLink, (status) => {
          if (status === "paid") {
            state.vip = true;
            state.vipUntil = Date.now() + (30 * 24 * 60 * 60 * 1000);
            vipFreeDropClaimed = false;
            localStorage.setItem("vipFreeDropClaimed", "false");
            save();
            vipModal.classList.remove("show");
            showToast("👑 VIP активирован!");
            updateUI();
          }
        });
      }
    } catch (err) {
      console.log(err);
      alert("Ошибка VIP");
    }
  });
}

// Ініціалізація
openScreen("home");
if (navButtons[0]) navButtons[0].classList.add("active");
updateUI();
updateCardsView();
updateDailyTimer();
loadReferrals();
loadIncomingCards();
setInterval(updateDailyTimer, 1000);
// --- ЛОГІКА СИСТЕМИ ЗАВДАНЬ ---

// 1. Функція, яка малює список завдань на екрані
function renderTasks() {
  const tasksContainer = document.querySelector("#tasksScreen .tasks-list");
  if (!tasksContainer) return;
  
  tasksContainer.innerHTML = ""; // Очищуємо список перед малюванням

  tasks.forEach(task => {
    const isCompleted = localStorage.getItem(`task_${task.id}_completed`) === "true";
    
    const taskCard = document.createElement("div");
    taskCard.className = `task-card ${isCompleted ? "completed" : ""}`;
    taskCard.innerHTML = `
      <div class="task-left">
        <div class="task-icon">${task.icon}</div>
        <div class="task-info">
          <h3>${task.title}</h3>
          <p>${task.desc}</p>
          <div class="task-rewards">
            ${task.reward.xp ? `<span>+${task.reward.xp} XP</span>` : ""}
            ${task.reward.crystals ? `<span>+${task.reward.crystals} 💎</span>` : ""}
            ${task.reward.stars ? `<span>+${task.reward.stars} ⭐</span>` : ""}
          </div>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-btn" id="btn_${task.id}" ${isCompleted ? "disabled" : ""}>
          ${isCompleted ? "Виконано" : "Виконати"}
        </button>
      </div>
    `;

    const btn = taskCard.querySelector(`#btn_${task.id}`);
    btn.addEventListener("click", () => handleTaskAction(task));

    tasksContainer.appendChild(taskCard);
  });
}

// 2. Функція, яка обробляє натискання на кнопку завдання
function handleTaskAction(task) {
  if (localStorage.getItem(`task_${task.id}_completed`) === "true") return;

  if (task.link) {
    window.open(task.link, "_blank");
    // Змінюємо кнопку на "Перевірити" після переходу
    const btn = document.getElementById(`btn_${task.id}`);
    if (btn) {
        btn.textContent = "Перевірити";
        btn.onclick = (e) => {
            e.stopPropagation();
            completeTask(task);
        };
    }
  } else if (task.check) {
    // Якщо є спеціальна перевірка (наприклад, на кількість карт)
    if (task.check()) {
      completeTask(task);
    } else {
      showToast("Умова ще не виконана!");
    }
  } else {
    // Якщо це просте завдання (як щоденний бонус)
    completeTask(task);
  }
}

// 3. Функція нарахування нагороди
function completeTask(task) {
  state.xp += task.reward.xp || 0;
  state.crystals += task.reward.crystals || 0;
  state.stars += task.reward.stars || 0;
  
  localStorage.setItem(`task_${task.id}_completed`, "true");
  showToast(`Нагорода отримана!`);
  updateUI(); // Оновлюємо цифри на екрані
  renderTasks(); // Оновлюємо список завдань
}
// --- ОСТАТОЧНА ЛОГІКА СКАРБНИЦІ ---
const TREASURY_CONFIG = { perHour: 60, max: 100 };

function updateTreasuryUI() {
    const now = Date.now();
    if (!state.lastTreasuryClaim) state.lastTreasuryClaim = now;
    const hours = (now - state.lastTreasuryClaim) / (1000 * 60 * 60);
    let count = Math.floor(hours * TREASURY_CONFIG.perHour);
    if (count > TREASURY_CONFIG.max) count = TREASURY_CONFIG.max;
    const el = document.getElementById("treasuryAmount");
    if (el) el.textContent = count + " 💎";
    return count;
}

// Прив'язка кліку безпосередньо до елементів
document.addEventListener("click", function(e) {
    // Натискання на сундучок
    if (e.target.closest("#treasuryWidget")) {
        const amount = updateTreasuryUI();
        const modal = document.getElementById("treasuryModal");
        const modalAmount = document.getElementById("modalTreasuryAmount");
        if (modalAmount) modalAmount.textContent = amount;
        if (modal) {
            modal.style.display = "flex";
            setTimeout(() => modal.classList.add("active"), 10);
        }
    }
    
    // Натискання на кнопку "Забрати"
    if (e.target.closest("#confirmTreasuryBtn")) {
        const amount = updateTreasuryUI();
        if (amount > 0) {
            state.crystals += amount;
            state.lastTreasuryClaim = Date.now();
            updateUI(); 
            showToast("Забрано " + amount + " 💎");
        }
        const modal = document.getElementById("treasuryModal");
        if (modal) {
            modal.classList.remove("active");
            setTimeout(() => modal.style.display = "none", 300);
        }
    }

    // Закриття модалки
    if (e.target.closest("#closeTreasuryModal") || e.target.id === "treasuryModal") {
        const modal = document.getElementById("treasuryModal");
        if (modal) {
            modal.classList.remove("active");
            setTimeout(() => modal.style.display = "none", 300);
        }
    }
});

// Запуск таймера оновлення
setInterval(updateTreasuryUI, 60000);
updateTreasuryUI();
checkDailyStreak(); // Перевірка щоденного входу
function showPush(title, message, icon = "🎁") {
    const push = document.getElementById("customPush");
    const titleEl = document.getElementById("pushTitle");
    const messageEl = document.getElementById("pushMessage");
    const iconEl = document.querySelector(".push-icon");

    if (!push || !titleEl || !messageEl) return;

    titleEl.textContent = title;
    messageEl.textContent = message;
    if (iconEl) iconEl.textContent = icon;

    push.classList.add("active");

    setTimeout(() => {
        push.classList.remove("active");
    }, 3000);
}

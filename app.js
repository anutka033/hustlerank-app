function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

const state = {
  xp: safeNumber(localStorage.getItem("xp"), 0),
  maxXp: safeNumber(localStorage.getItem("maxXp"), 100),
  level: safeNumber(localStorage.getItem("level"), 1),
  coins: safeNumber(localStorage.getItem("coins"), 0),
  stars: safeNumber(localStorage.getItem("stars"), 0),
  bonusTaken: localStorage.getItem("bonusTaken") === "true",
  cards: JSON.parse(localStorage.getItem("cards") || "{}")
};

const cardsData = [
  { id: "novice", price: 10 },
  { id: "focus", price: 25 },
  { id: "leader", price: 75 },
  { id: "voidking", price: 150 }
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
  localStorage.setItem("bonusTaken", state.bonusTaken);
  localStorage.setItem("cards", JSON.stringify(state.cards));
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

function showToast(text) {
  if (!toast) return;

  toast.textContent = text;
  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 1300);
}

function checkLevelUp() {
  let leveledUp = false;

  while (state.xp >= state.maxXp) {
    state.xp -= state.maxXp;
    state.level += 1;
    state.maxXp = Math.floor(state.maxXp * 1.45);
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
    avatarImg.src = "images/avatar-bronze.png";
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

  rankCards.forEach(function (card, index) {
    const data = cardsData[index];
    if (!data) return;

    const button = card.querySelector(".unlock-btn, .locked-btn");
    const unlocked = state.cards[data.id] && state.cards[data.id].unlocked;
    const level = state.cards[data.id] ? state.cards[data.id].level : 0;

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

  if (levelEl) levelEl.textContent = state.level;
  if (rankName) rankName.textContent = rankByLevel(state.level);
  if (xpText) xpText.textContent = state.xp + " / " + state.maxXp + " XP";
  if (xpFill) xpFill.style.width = percent + "%";
  if (coinsEl) coinsEl.textContent = state.coins.toLocaleString("ru-RU");
  if (starsEl) starsEl.textContent = state.stars.toLocaleString("ru-RU");
  if (ratingEl) ratingEl.textContent = state.level >= 2 ? "#" + (900 - state.level * 37) : "#---";
  if (incomePerHourEl) incomePerHourEl.textContent = "+0/час";
  if (earnText) earnText.textContent = xpPerClick() + " XP за нажатие";

  updateAvatar();
  updateBonus();
  updateDrops();
  updateCards();
  save();
}

function openScreen(name) {
  Object.values(screens).forEach(function (screen) {
    if (screen) screen.classList.remove("active-screen");
  });

  navButtons.forEach(function (button) {
    button.classList.remove("active");
  });

  if (screens[name]) {
    screens[name].classList.add("active-screen");
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
    const gain = xpPerClick();

    state.xp += gain;
    state.coins += 5;

    updateUI();
    showToast("+" + gain + " XP");
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

let ownedCards = JSON.parse(
  localStorage.getItem("ownedCards") || "[]"
);

const cardsTabs = document.querySelectorAll(".cards-tab");

cardsTabs.forEach(function(btn){

  btn.addEventListener("click", function(){

    cardsTabs.forEach(function(b){
      b.classList.remove("active");
    });

    btn.classList.add("active");

    cardsTab = btn.dataset.cardsTab;

    updateCardsView();

  });

});

function updateCardsView(){

  document
    .querySelectorAll(".rank-card")
    .forEach(function(card, index){

      const isOwned = ownedCards.includes(index);

      if(cardsTab === "inventory"){

  card.style.display = isOwned
    ? ""
    : "none";

} else {

  card.style.display = isOwned
    ? "none"
    : "";

}

      const button = card.querySelector("button");

      if(button){

        if(isOwned){

          button.textContent = "В коллекции";

          button.disabled = true;

          card.classList.add("bought");

        }

      }

    });

}
document.querySelectorAll(".rank-card").forEach(function (card, index) {
  card.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;

    const data = cardsData[index];
    if (!data) return;

    const current = state.cards[data.id] || {
      unlocked: false,
      level: 0
    };

    if (!current.unlocked) {
      if (state.stars < data.price) {
        showToast("Не хватает ⭐");
        return;
      }

      state.stars -= data.price;
      current.unlocked = true;
      current.level = 1;
      state.cards[data.id] = current;
if(!ownedCards.includes(index)){

  ownedCards.push(index);

  localStorage.setItem(
    "ownedCards",
    JSON.stringify(ownedCards)
  );

}
      card.classList.add("card-pop");
      setTimeout(function () {
        card.classList.remove("card-pop");
      }, 600);

      showToast("Карта открыта!");
      updateUI();
      return;
    }

    showToast("Карта уже куплена");
updateUI();
  });
});

openScreen("home");

if (navButtons[0]) {
  navButtons[0].classList.add("active");
}
const cardModal = document.getElementById("cardModal");
const cardModalBg = document.getElementById("cardModalBg");
const modalClose = document.getElementById("modalClose");

const modalCardImg = document.getElementById("modalCardImg");
const modalCardName = document.getElementById("modalCardName");
const modalName = document.getElementById("modalName");
const modalRarity = document.getElementById("modalRarity");
const modalStatus = document.getElementById("modalStatus");
const modalPrice = document.getElementById("modalPrice");

const modalCards = [
  {
    name: "Новичок",
    rarity: "ЭПИЧЕСКАЯ",
    status: "Статус: Первый шаг",
    price: 10,
   quote: "Каждый король когда-то был никем. Важно не где ты начал, а сколько раз ты не остановился.",
    img: "images/epic-smile.png"
  },
  {
  name: "Фокус",
  rarity: "РЕДКАЯ",
  status: "Статус: Концентрация",
  price: 25,
  quote: "Шум забирает слабых. Тишина собирает тех, кто знает, зачем он идёт.",
  img: "images/focus-mind.png"
},
  {
  name: "Лидер",
  rarity: "ЛЕГЕНДАРНАЯ",
  status: "Статус: Контроль",
  price: 75,
  quote: "Лидер — это тот, кто идёт первым, даже когда остальные боятся сделать шаг.",
  img: "images/leader-core.png"
},
  {
  name: "Void King",
  rarity: "ЛЕГЕНДАРНАЯ",
  status: "Статус: Повелитель пустоты",
  price: 150,
  quote: "Пока остальные искали свет — он научился видеть в темноте.",
  img: "images/void-king.png"
},
];

document.querySelectorAll(".rank-card").forEach(function(card, index){
  card.addEventListener("click", function(event){
    if (event.target.tagName === "BUTTON") return;

    const data = modalCards[index];
    if (!data) return;

    modalCardImg.src = data.img;
    modalCardName.textContent = data.name;
    modalName.textContent = data.name;
    modalRarity.textContent = data.rarity;
    modalStatus.textContent = data.status;
    modalPrice.textContent = data.price;
    document.getElementById("modalQuote").textContent = data.quote;
    

    cardModal.classList.add("show");
  });
});

function closeCardModal(){
  cardModal.classList.remove("show");
}

if (modalClose) modalClose.addEventListener("click", closeCardModal);
if (cardModalBg) cardModalBg.addEventListener("click", closeCardModal);
const openShopBtn = document.getElementById("openShopBtn");
const shopModal = document.getElementById("shopModal");
const shopBg = document.getElementById("shopBg");
const shopClose = document.getElementById("shopClose");

function openShop(){
  if (shopModal) {
    shopModal.classList.add("show");
  }
}

function closeShop(){
  if (shopModal) {
    shopModal.classList.remove("show");
  }
}

if (openShopBtn) {
  openShopBtn.addEventListener("click", openShop);
}

if (shopBg) {
  shopBg.addEventListener("click", closeShop);
}

if (shopClose) {
  shopClose.addEventListener("click", closeShop);
}

document.querySelectorAll(".shop-pack").forEach(function(pack){
  pack.addEventListener("click", function(){
    const amount = Number(pack.dataset.stars);

    state.stars += amount;
    updateUI();
    closeShop();
    showToast("+" + amount + " ⭐");
  });
});
updateUI();
document.querySelectorAll(".rank-card").forEach(card => {

  card.addEventListener("mousemove", (e) => {

    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 12;
    const rotateX = ((y / rect.height) - 0.5) * -12;

    card.style.transform =
      `perspective(1000px)
       rotateX(${rotateX}deg)
       rotateY(${rotateY}deg)
       scale(1.03)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });

});
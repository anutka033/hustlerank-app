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
  inventory: JSON.parse(localStorage.getItem("inventory") || "[]"),
boughtCards: JSON.parse(localStorage.getItem("boughtCards") || "[]"),
  cards: JSON.parse(localStorage.getItem("cards") || "{}")
};

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
  localStorage.setItem("inventory", JSON.stringify(state.inventory || []));
  localStorage.setItem("boughtCards", JSON.stringify(state.boughtCards || []));
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
const avatar = document.querySelector(".avatar");
const deg = percent * 3.6;

if (avatar) {
  avatar.style.setProperty("--xpDeg", deg + "deg");
}
  if (levelEl) levelEl.textContent = state.level;
  if (rankName) rankName.textContent = rankByLevel(state.level);
  if (xpText) xpText.textContent = state.xp + " / " + state.maxXp + " XP";
  if (xpFill) xpFill.style.width = percent + "%";
  if (coinsEl) coinsEl.textContent = state.coins.toLocaleString("ru-RU");
  if (starsEl) starsEl.textContent = state.stars.toLocaleString("ru-RU");
  if (ratingEl) ratingEl.textContent = state.level >= 2 ? "#" + (900 - state.level * 37) : "#---";
  if (incomePerHourEl) incomePerHourEl.textContent = "+0/час";
  if (earnText) earnText.textContent = "Перейти к заданиям";

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
  updateSideActionsVisibility();
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
const dailyDropWidget = document.querySelector(".daily-drop");

if (dailyDropWidget) {
  dailyDropWidget.style.display =
    screen === "home" ? "flex" : "none";
}
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

let ownedCards = JSON.parse(
  localStorage.getItem("ownedCards") || "[]"
);

const cardsTabs = document.querySelectorAll(".tab-btn");
const marketScreen = document.getElementById("marketScreen");
const cardsGrid = document.querySelector(".new-cards-grid");
marketScreen.style.display = "none";
cardsGrid.style.display = "grid";
cardsTabs.forEach(function(btn){

  btn.addEventListener("click", function(){

    cardsTabs.forEach(function(b){
      b.classList.remove("active");
    });

    btn.classList.add("active");

    cardsTab = btn.dataset.cardsTab;

if (cardsTab === "market") {
  marketScreen.style.display = "block";
  cardsGrid.style.display = "none";
} else {
  marketScreen.style.display = "none";
  cardsGrid.style.display = "grid";
}

    updateCardsView();
  });

});

function updateCardsView(){

  document
    .querySelectorAll(".rank-card")
    .forEach(function(card, index){

      const data = cardsData[index];
const isOwned =
  ownedCards.includes(index) ||
  (data &&
   state.cards[data.id] &&
   state.cards[data.id].unlocked) ||
  (state.inventory &&
   state.inventory.some(function(cardItem) {
     return cardItem.img === data.img;
   }));

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
    if (button) return;

    const data = cardsData[index];
    if (!data) return;

    const current = state.cards[data.id] || {
      unlocked: false,
      level: 0
    };
 

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
const viewCardBtn = document.getElementById("viewCardBtn");
const flipBackBtn = document.getElementById("flipBackBtn");
const flipInner = document.getElementById("flipInner");
const modalCardImg = document.getElementById("modalCardImg");
const modalCardName = document.getElementById("modalCardName");
const modalName = document.getElementById("modalName");
const modalRarity = document.getElementById("modalRarity");
const modalStatus = document.getElementById("modalStatus");
const modalPrice = document.getElementById("modalPrice");

const marketTab = document.getElementById("marketTab");

if (flipBackBtn) {
  flipBackBtn.addEventListener("click", function () {
    cardModal.classList.toggle("view-front");
  });
}



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
{
  name: "Storm Paw",
  rarity: "МИФИЧЕСКАЯ",
  status: "Статус: Повелитель бури",
  price: 650,
  quote: "Те, кто управляют молнией, сначала научились управлять собой.",
  img: "images/mystic-stormpaw.png"
},

{
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
  img: "images/solar-emperor.png"
},
];

document.querySelectorAll(".rank-card").forEach(function(card, index){
  card.addEventListener("click", function(event){
    
    const isInventoryOpen =
  document.querySelector('[data-cards-tab="inventory"]')?.classList.contains("active");

const isBuyButton =
  !isInventoryOpen && card.closest("#cardsScreen") && card.querySelector(".unlock-btn");

    const data = modalCards[index];
    if (!data) return;

    modalCardImg.src = data.img;
    modalCardName.textContent = data.name;
    modalName.textContent = data.name;
    modalRarity.textContent = data.rarity;
    modalStatus.textContent = data.status;
    modalPrice.textContent = data.price;
    document.getElementById("modalQuote").textContent = data.quote;
    const actionBtn = document.getElementById("modalActionBtn");

if (isBuyButton) {
  modalActionBtn.innerHTML = "🛒 Купить карту";

  modalActionBtn.onclick = function () {
    selectedCard = data;

    buyConfirmPrice.textContent = data.price;

    buyConfirmModal.classList.add("show");
  };
}
else {
  modalActionBtn.innerHTML = "🎁 Подарить карту";

  modalActionBtn.onclick = function () {
    giftModal.classList.add("show");
  };
}
    

    cardModal.classList.add("show");
    cardModal.classList.remove("view-front");
viewCardBtn.textContent = "👁 Смотреть карту";
    document.querySelector(".bottom-nav").classList.add("hide-nav");
  });
});

function closeCardModal(){
  cardModal.classList.remove("show");
  document.querySelector(".bottom-nav").classList.remove("hide-nav");
}

if (modalClose) modalClose.addEventListener("click", closeCardModal);
if (cardModalBg) cardModalBg.addEventListener("click", closeCardModal);
const openShopBtn = document.getElementById("openShopBtn");
const shopModal = document.getElementById("shopModal");
const shopBg = document.getElementById("shopBg");
const shopClose = document.getElementById("shopClose");
const buyConfirmModal = document.getElementById("buyConfirmModal");
const buyConfirmPrice = document.getElementById("buyConfirmPrice");
const confirmBuyBtn = document.getElementById("confirmBuyBtn");
const cancelBuyBtn = document.getElementById("cancelBuyBtn");

let selectedCard = null;
if (confirmBuyBtn) {
  confirmBuyBtn.addEventListener("click", function () {

    if (!selectedCard) return;

    if (state.stars < selectedCard.price) {
      showToast("Недостаточно звёзд");
      buyConfirmModal.classList.remove("show");
      return;
    }

    state.stars -= selectedCard.price;

 if (!state.cards[selectedCard.id]) {
  state.cards[selectedCard.id] = {
    unlocked: false,
    level: 0
  };
}

state.cards[selectedCard.id].unlocked = true;
state.cards[selectedCard.id].level = 1;

save();

if (!state.boughtCards) {
  state.boughtCards = [];
}

state.boughtCards.push(selectedCard.img);

document.querySelectorAll(".rank-card").forEach(function(card) {
  const img = card.querySelector("img");

  if (img && img.getAttribute("src").includes(selectedCard.img.replace("images/", ""))) {
    card.remove();
  }
});

    updateUI();
    updateCardsView();

    buyConfirmModal.classList.remove("show");

    showToast("Карта куплена");
  });
}

if (cancelBuyBtn) {
  cancelBuyBtn.addEventListener("click", function () {
    buyConfirmModal.classList.remove("show");
  });
}

function openShop(){
  if (shopModal) {
    shopModal.classList.add("show");
    document.querySelector(".bottom-nav").classList.add("hide-nav");
  }
}

function closeShop(){
  if (shopModal) {
    shopModal.classList.remove("show");
    document.querySelector(".bottom-nav").classList.remove("hide-nav");
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
updateUI();
updateCardsView();
document.addEventListener("input", function (event) {
  if (event.target.id === "giftUserId") {
    const sendBtn = document.getElementById("sendGiftBtn");
    const value = event.target.value.trim();

    sendBtn.disabled = value.length !== 5;
    sendBtn.style.opacity = value.length === 5 ? "1" : ".5";
    sendBtn.style.cursor = value.length === 5 ? "pointer" : "not-allowed";
  }
});

document.addEventListener("click", function (event) {
  if (event.target.closest("#giftCardBtn")) {
    const input = document.getElementById("giftUserId");
    const sendBtn = document.getElementById("sendGiftBtn");

    input.value = "";
    sendBtn.disabled = true;
    sendBtn.style.opacity = ".5";
    sendBtn.style.cursor = "not-allowed";

    document.getElementById("giftModal").classList.add("show");
  }

  if (event.target.closest("#cancelGiftBtn")) {
    document.getElementById("giftModal").classList.remove("show");
  }

  if (event.target.closest("#sendGiftBtn")) {
    const userId = document.getElementById("giftUserId").value.trim();

    if (userId.length !== 5) {
      alert("ID должен быть ровно 5 символов");
      return;
    }

    alert("🎁 Карта отправлена игроку #" + userId);
    document.getElementById("giftModal").classList.remove("show");
  }
});
const invitedFriends = [];

const friendsContainer =
  document.getElementById("friendsContainer");

const friendEmpty =
  document.getElementById("friendEmpty");

function renderFriends(){

  friendsContainer.innerHTML = "";

  if(invitedFriends.length === 0){
    friendEmpty.style.display = "block";
    return;
  }

  friendEmpty.style.display = "none";

  invitedFriends.forEach(friend => {
    friendsContainer.innerHTML += `
      <div class="friend-item">
        <div class="friend-left">
          <div class="friend-avatar">${friend.name[0]}</div>
          <div class="friend-name">${friend.name}</div>
        </div>

        <div class="friend-reward">
          +25 ⭐ +500 💎
        </div>
      </div>
    `;
  });
}

renderFriends();
const dropCards = [
  {
    name: "Новичок",
    rarity: "ЭПИЧЕСКАЯ",
    img: "images/epic-smile.png"
  },
  {
    name: "Фокус",
    rarity: "РЕДКАЯ",
    img: "images/focus-mind.png"
  },
  {
    name: "Лидер",
    rarity: "ЛЕГЕНДАРНАЯ",
    img: "images/leader-core.png"
  },
  {
    name: "Void King",
    rarity: "ЛЕГЕНДАРНАЯ",
    img: "images/void-king.png"
  },
  {
    name: "Storm Paw",
    rarity: "МИФИЧЕСКАЯ",
    img: "images/mystic-stormpaw.png"
  },
  {
    name: "Void Mage",
    rarity: "МИФИЧЕСКАЯ",
    img: "images/mystic-voidmage.png"
  }
];

const openDropBtn = document.getElementById("openDropBtn");
console.log(openDropBtn);
const dropModal = document.getElementById("dropModal");
const closeDropModal = document.getElementById("closeDropModal");
closeDropModal.addEventListener("click", function () {

  const img = dropResultImg.cloneNode(true);

  const cardsTab =
    document.querySelector('[data-screen="cards"]');

  img.classList.add("fly-card");

  document.body.appendChild(img);

  const imgRect =
    dropResultImg.getBoundingClientRect();

  const targetRect =
    cardsTab.getBoundingClientRect();

  img.style.left = imgRect.left + "px";
  img.style.top = imgRect.top + "px";

  img.style.width = imgRect.width + "px";
  img.style.height = imgRect.height + "px";

  setTimeout(() => {

    img.style.left =
      targetRect.left +
      targetRect.width / 2 + "px";

    img.style.top =
      targetRect.top +
      targetRect.height / 2 + "px";

    img.style.width = "30px";
    img.style.height = "40px";

    img.style.opacity = "0";

    img.style.transform =
      "rotate(18deg) scale(.3)";
dropModal.classList.remove("show");
  }, 50);

  setTimeout(() => {

    img.remove();

  }, 850);

});

const dropResultRarity = document.getElementById("dropResultRarity");
const dropResultImg = document.getElementById("dropResultImg");
const dropResultName = document.getElementById("dropResultName");

openDropBtn.addEventListener("click", function () {

  const randomCard =
    dropCards[Math.floor(Math.random() * dropCards.length)];

  const modalBox =
    document.querySelector(".drop-modal-box");

  const loading =
    document.getElementById("dropLoading");

  dropModal.classList.add("show");

  modalBox.classList.add("opening");

  loading.classList.add("show");

  modalBox.classList.remove(
    "result-mythic",
    "result-legendary",
    "result-epic",
    "result-rare"
  );

  setTimeout(() => {

    loading.classList.remove("show");

    modalBox.classList.remove("opening");

    dropResultRarity.textContent =
      randomCard.rarity;

    dropResultImg.src =
      randomCard.img;

    dropResultName.textContent =
      randomCard.name;

    if(randomCard.rarity === "МИФИЧЕСКАЯ"){

      modalBox.classList.add("result-mythic");

    } else if(randomCard.rarity === "ЛЕГЕНДАРНАЯ"){

      modalBox.classList.add("result-legendary");

    } else if(randomCard.rarity === "ЭПИЧЕСКАЯ"){

      modalBox.classList.add("result-epic");

    } else {

      modalBox.classList.add("result-rare");

    }

  }, 4500);

});
const dailyDrop = document.getElementById("dailyDrop");
const dailyModal = document.getElementById("dailyModal");
const claimDailyBtn = document.getElementById("claimDailyBtn");

const dailyCloseBtn =
  document.getElementById("dailyCloseBtn");

if (dailyDrop) {
  dailyDrop.addEventListener("click", function () {
    dailyModal.classList.add("active");
  });
}
if (dailyCloseBtn) {
  dailyCloseBtn.addEventListener("click", function () {
    dailyModal.classList.remove("active");
  });
}
function updateDailyDropVisibility() {
  const dailyDropWidget = document.querySelector(".daily-drop");
  const homeScreen = document.getElementById("homeScreen");

  if (!dailyDropWidget || !homeScreen) return;

  dailyDropWidget.style.display =
    homeScreen.classList.contains("active-screen") ||
    homeScreen.classList.contains("active")
      ? "flex"
      : "none";
}
function updateSideActionsVisibility() {
  const leftPanel = document.querySelector(".left-actions");
  const rightPanel = document.querySelector(".right-actions");
  const homeScreen = document.getElementById("homeScreen");

  if (!leftPanel || !rightPanel || !homeScreen) return;

  const isHome =
    homeScreen.classList.contains("active-screen") ||
    homeScreen.classList.contains("active");

  leftPanel.style.display = isHome ? "flex" : "none";
  rightPanel.style.display = isHome ? "flex" : "none";
}
updateDailyDropVisibility();
updateSideActionsVisibility();

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

claimTelegramTaskBtn.classList.remove("hidden");
telegramTaskBtn.textContent = "Проверено";
telegramTaskBtn.disabled = true;
  });
}

if (claimTelegramTaskBtn) {
  claimTelegramTaskBtn.addEventListener("click", function () {
    if (telegramTaskClaimed) return;

    state.stars += 50;
    state.coins += 500;
    state.xp += 1500;

    telegramTaskClaimed = true;

    claimTelegramTaskBtn.classList.add("hidden");
    telegramTaskBtn.textContent = "Выполнено";
    telegramTaskBtn.disabled = true;

    if (telegramTaskCard) {
      telegramTaskCard.classList.add("completed");
    }

    updateUI();
    showToast("+50 ⭐ +500 💎 +1500 XP");
  });
}
const dailyClaimBtn = document.getElementById("dailyClaimBtn");
const dailyDropTimer = document.getElementById("dailyDropTimer");

let dailyDropEndTime =
  Number(localStorage.getItem("dailyDropEndTime")) || 0;

function updateDailyTimer() {
  if (!dailyClaimBtn || !dailyDropTimer) return;

  const now = Date.now();
  const left = dailyDropEndTime - now;

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
dailyClaimBtn.classList.add("timer-mode");
dailyClaimBtn.textContent =
  dailyDropTimer.textContent;

  const totalSeconds = Math.floor(left / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const timerText =
  String(hours).padStart(2, "0") + ":" +
  String(minutes).padStart(2, "0") + ":" +
  String(seconds).padStart(2, "0");

dailyDropTimer.textContent = "";
dailyClaimBtn.textContent = timerText;
dailyClaimBtn.disabled = true;
dailyClaimBtn.style.pointerEvents = "none";
dailyClaimBtn.style.opacity = "0.7";
}

if (dailyClaimBtn) {
  dailyClaimBtn.addEventListener("click", function () {
if (dailyDropEndTime > Date.now()) {
  return;
}
    state.stars += 50;
    state.xp += 500;

    updateUI();

    dailyDropEndTime =
      Date.now() + 24 * 60 * 60 * 1000;

    localStorage.setItem(
      "dailyDropEndTime",
      dailyDropEndTime
    );

    updateDailyTimer();

    showToast("+50 ⭐ и +500 XP");
  });
}

updateDailyTimer();

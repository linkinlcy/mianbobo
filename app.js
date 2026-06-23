const STORAGE_KEY = "fatLossTrackerMvp.v1";

const TARGETS = {
  low: { label: "低碳日", calories: 1800, carbs: 100, protein: 160, fat: 75 },
  mid: { label: "中碳日", calories: 2050, carbs: 190, protein: 160, fat: 65 },
  high: { label: "高碳日", calories: 2300, carbs: 280, protein: 160, fat: 60 },
};

const MEALS = [
  { key: "breakfast", label: "早餐" },
  { key: "lunch", label: "午餐" },
  { key: "dinner", label: "晚餐" },
  { key: "snack", label: "加餐" },
];

const state = {
  activeDate: formatDate(new Date()),
  activeMeal: "breakfast",
  records: loadRecords(),
};

const $ = (id) => document.getElementById(id);

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function getDay(date = state.activeDate) {
  if (!state.records[date]) {
    state.records[date] = {
      dayType: "low",
      meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
      training: { type: "休息", exercises: [] },
    };
  }
  return state.records[date];
}

function getTotals(day = getDay()) {
  return MEALS.reduce(
    (sum, meal) => {
      day.meals[meal.key].forEach((item) => {
        sum.calories += item.calories;
        sum.carbs += item.carbs;
        sum.protein += item.protein;
        sum.fat += item.fat;
      });
      return sum;
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function metricLabel(key) {
  return {
    calories: "热量",
    carbs: "碳水",
    protein: "蛋白",
    fat: "脂肪",
  }[key];
}

function unitFor(key) {
  return key === "calories" ? "kcal" : "g";
}

function render() {
  const day = getDay();
  $("activeDate").value = state.activeDate;
  $("dayTypeSelect").value = day.dayType;
  $("trainingType").value = day.training.type;
  renderHome(day);
  renderFood(day);
  renderTraining(day);
  renderDashboard();
  saveRecords();
}

function renderHome(day) {
  const totals = getTotals(day);
  const target = TARGETS[day.dayType];
  $("homeDayType").textContent = target.label;
  $("homeFoodTotal").textContent = `${round(totals.calories)} kcal`;
  $("homeTrainingType").textContent =
    day.training.type === "休息" && day.training.exercises.length === 0
      ? "未记录"
      : day.training.type;
  $("homeGapHint").textContent = `${round(totals.calories)} / ${target.calories} kcal`;

  $("homeSummary").innerHTML = ["calories", "carbs", "protein", "fat"]
    .map((key) => {
      const value = round(totals[key]);
      return `
        <div class="metric-card">
          <span>${metricLabel(key)}</span>
          <strong>${value}${unitFor(key)}</strong>
          <small>目标 ${target[key]}${unitFor(key)}</small>
        </div>
      `;
    })
    .join("");

  $("homeGaps").innerHTML = ["calories", "carbs", "protein", "fat"]
    .map((key) => {
      const value = round(totals[key]);
      const gap = round(target[key] - value);
      const pct = target[key] ? Math.min(100, Math.round((value / target[key]) * 100)) : 0;
      const gapText = gap >= 0 ? `差 ${gap}` : `超 ${Math.abs(gap)}`;
      return `
        <div class="gap-row">
          <span>${metricLabel(key)}</span>
          <div class="progress" aria-label="${metricLabel(key)}进度">
            <i style="--pct:${pct}%"></i>
          </div>
          <strong>${gapText}${unitFor(key)}</strong>
        </div>
      `;
    })
    .join("");
}

function renderFood(day) {
  const totals = getTotals(day);
  $("foodTotalHint").textContent = `${round(totals.calories)} kcal`;
  $("mealTabs").innerHTML = MEALS.map(
    (meal) =>
      `<button class="meal-tab ${meal.key === state.activeMeal ? "active" : ""}" data-meal="${meal.key}" type="button">${meal.label}</button>`
  ).join("");

  $("mealLists").innerHTML = MEALS.map((meal) => {
    const items = day.meals[meal.key];
    const rows = items.length
      ? items
          .map(
            (item) => `
              <div class="record-item">
                <div class="record-head">
                  <strong>${escapeHtml(item.name)}</strong>
                  <button class="danger-btn" data-delete-food="${item.id}" data-meal-key="${meal.key}" type="button">删</button>
                </div>
                <div class="record-meta">
                  ${round(item.calories)} kcal · 碳 ${round(item.carbs)}g · 蛋白 ${round(item.protein)}g · 脂肪 ${round(item.fat)}g
                </div>
              </div>
            `
          )
          .join("")
      : `<p class="empty">还没有记录</p>`;
    return `
      <div class="meal-block">
        <h3>${meal.label}</h3>
        <div class="record-list">${rows}</div>
      </div>
    `;
  }).join("");
}

function renderTraining(day) {
  const exercises = day.training.exercises;
  $("exerciseCountHint").textContent = `${exercises.length} 个动作`;
  $("exerciseList").innerHTML = exercises.length
    ? exercises
        .map(
          (item) => `
            <div class="record-item">
              <div class="record-head">
                <strong>${escapeHtml(item.name)}</strong>
                <button class="danger-btn" data-delete-exercise="${item.id}" type="button">删</button>
              </div>
              <div class="record-meta">
                ${round(item.weight)}kg · ${round(item.reps)}次 · ${round(item.sets)}组${item.note ? ` · ${escapeHtml(item.note)}` : ""}
              </div>
            </div>
          `
        )
        .join("")
    : `<p class="empty">今天还没有添加动作</p>`;

  const history = Object.keys(state.records)
    .sort((a, b) => b.localeCompare(a))
    .filter((date) => {
      const training = state.records[date].training;
      return training && (training.type !== "休息" || training.exercises.length > 0);
    })
    .slice(0, 12);

  $("trainingHistory").innerHTML = history.length
    ? history
        .map((date) => {
          const training = state.records[date].training;
          return `
            <button class="history-item" data-open-date="${date}" type="button">
              <div class="record-head">
                <strong>${date}</strong>
                <span class="record-meta">${training.type}</span>
              </div>
              <div class="record-meta">${training.exercises.length} 个动作</div>
            </button>
          `;
        })
        .join("")
    : `<p class="empty">暂无历史训练记录</p>`;
}

function renderDashboard() {
  const dates = lastSevenDates();
  const totals = dates.map((date) => getTotals(getDay(date)));
  const trainingCount = dates.filter((date) => {
    const training = getDay(date).training;
    return training.type !== "休息" || training.exercises.length > 0;
  }).length;

  const avg = (key) => round(totals.reduce((sum, item) => sum + item[key], 0) / dates.length);
  $("dashboardRange").textContent = `${dates[0].slice(5)} 至 ${dates[6].slice(5)}`;
  $("dashboardCards").innerHTML = [
    ["平均热量", `${avg("calories")} kcal`],
    ["平均碳水", `${avg("carbs")} g`],
    ["平均蛋白质", `${avg("protein")} g`],
    ["平均脂肪", `${avg("fat")} g`],
    ["训练次数", `${trainingCount} 次`],
  ]
    .map(([label, value]) => `<div class="dash-card"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function lastSevenDates() {
  const base = new Date(`${state.activeDate}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() - (6 - index));
    return formatDate(date);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function setView(name) {
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  $(`view-${name}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === name);
  });
  $("pageTitle").textContent = { home: "今日", food: "饮食", training: "训练", dashboard: "看板" }[name];
}

function bindEvents() {
  $("activeDate").addEventListener("change", (event) => {
    state.activeDate = event.target.value || formatDate(new Date());
    render();
  });

  $("dayTypeSelect").addEventListener("change", (event) => {
    getDay().dayType = event.target.value;
    render();
  });

  $("trainingType").addEventListener("change", (event) => {
    getDay().training.type = event.target.value;
    render();
  });

  document.body.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav]");
    if (nav) setView(nav.dataset.nav);

    const meal = event.target.closest("[data-meal]");
    if (meal) {
      state.activeMeal = meal.dataset.meal;
      render();
    }

    const foodDelete = event.target.closest("[data-delete-food]");
    if (foodDelete) {
      const day = getDay();
      const mealKey = foodDelete.dataset.mealKey;
      day.meals[mealKey] = day.meals[mealKey].filter((item) => item.id !== foodDelete.dataset.deleteFood);
      render();
    }

    const exerciseDelete = event.target.closest("[data-delete-exercise]");
    if (exerciseDelete) {
      const day = getDay();
      day.training.exercises = day.training.exercises.filter((item) => item.id !== exerciseDelete.dataset.deleteExercise);
      render();
    }

    const openDate = event.target.closest("[data-open-date]");
    if (openDate) {
      state.activeDate = openDate.dataset.openDate;
      setView("training");
      render();
    }
  });

  $("foodForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("foodName").value.trim();
    if (!name) return;
    getDay().meals[state.activeMeal].push({
      id: createId(),
      name,
      carbs: parseNumber($("foodCarbs").value),
      protein: parseNumber($("foodProtein").value),
      fat: parseNumber($("foodFat").value),
      calories: parseNumber($("foodCalories").value),
    });
    event.target.reset();
    render();
  });

  $("exerciseForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("exerciseName").value.trim();
    if (!name) return;
    getDay().training.exercises.push({
      id: createId(),
      name,
      weight: parseNumber($("exerciseWeight").value),
      reps: parseNumber($("exerciseReps").value),
      sets: parseNumber($("exerciseSets").value),
      note: $("exerciseNote").value.trim(),
    });
    event.target.reset();
    render();
  });
}

bindEvents();
render();
const STORAGE_KEY = "fatLossTrackerMvp.v1";

const TARGETS = {
  low: { label: "低碳日", calories: 1800, carbs: 100, protein: 160, fat: 75 },
  mid: { label: "中碳日", calories: 2050, carbs: 190, protein: 160, fat: 65 },
  high: { label: "高碳日", calories: 2300, carbs: 280, protein: 160, fat: 60 },
};

const MEALS = [
  { key: "breakfast", label: "早餐" },
  { key: "lunch", label: "午餐" },
  { key: "dinner", label: "晚餐" },
  { key: "snack", label: "加餐" },
];

const state = {
  activeDate: formatDate(new Date()),
  activeMeal: "breakfast",
  records: loadRecords(),
};

const $ = (id) => document.getElementById(id);

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function getDay(date = state.activeDate) {
  if (!state.records[date]) {
    state.records[date] = {
      dayType: "low",
      meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
      training: { type: "休息", exercises: [] },
    };
  }
  return state.records[date];
}

function getTotals(day = getDay()) {
  return MEALS.reduce(
    (sum, meal) => {
      day.meals[meal.key].forEach((item) => {
        sum.calories += item.calories;
        sum.carbs += item.carbs;
        sum.protein += item.protein;
        sum.fat += item.fat;
      });
      return sum;
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function metricLabel(key) {
  return {
    calories: "热量",
    carbs: "碳水",
    protein: "蛋白",
    fat: "脂肪",
  }[key];
}

function unitFor(key) {
  return key === "calories" ? "kcal" : "g";
}

function render() {
  const day = getDay();
  $("activeDate").value = state.activeDate;
  $("dayTypeSelect").value = day.dayType;
  $("trainingType").value = day.training.type;
  renderHome(day);
  renderFood(day);
  renderTraining(day);
  renderDashboard();
  saveRecords();
}

function renderHome(day) {
  const totals = getTotals(day);
  const target = TARGETS[day.dayType];
  $("homeDayType").textContent = target.label;
  $("homeFoodTotal").textContent = `${round(totals.calories)} kcal`;
  $("homeTrainingType").textContent =
    day.training.type === "休息" && day.training.exercises.length === 0
      ? "未记录"
      : day.training.type;
  $("homeGapHint").textContent = `${round(totals.calories)} / ${target.calories} kcal`;

  $("homeSummary").innerHTML = ["calories", "carbs", "protein", "fat"]
    .map((key) => {
      const value = round(totals[key]);
      return `
        <div class="metric-card">
          <span>${metricLabel(key)}</span>
          <strong>${value}${unitFor(key)}</strong>
          <small>目标 ${target[key]}${unitFor(key)}</small>
        </div>
      `;
    })
    .join("");

  $("homeGaps").innerHTML = ["calories", "carbs", "protein", "fat"]
    .map((key) => {
      const value = round(totals[key]);
      const gap = round(target[key] - value);
      const pct = target[key] ? Math.min(100, Math.round((value / target[key]) * 100)) : 0;
      const gapText = gap >= 0 ? `差 ${gap}` : `超 ${Math.abs(gap)}`;
      return `
        <div class="gap-row">
          <span>${metricLabel(key)}</span>
          <div class="progress" aria-label="${metricLabel(key)}进度">
            <i style="--pct:${pct}%"></i>
          </div>
          <strong>${gapText}${unitFor(key)}</strong>
        </div>
      `;
    })
    .join("");
}

function renderFood(day) {
  const totals = getTotals(day);
  $("foodTotalHint").textContent = `${round(totals.calories)} kcal`;
  $("mealTabs").innerHTML = MEALS.map(
    (meal) =>
      `<button class="meal-tab ${meal.key === state.activeMeal ? "active" : ""}" data-meal="${meal.key}" type="button">${meal.label}</button>`
  ).join("");

  $("mealLists").innerHTML = MEALS.map((meal) => {
    const items = day.meals[meal.key];
    const rows = items.length
      ? items
          .map(
            (item) => `
              <div class="record-item">
                <div class="record-head">
                  <strong>${escapeHtml(item.name)}</strong>
                  <button class="danger-btn" data-delete-food="${item.id}" data-meal-key="${meal.key}" type="button">删</button>
                </div>
                <div class="record-meta">
                  ${round(item.calories)} kcal · 碳 ${round(item.carbs)}g · 蛋白 ${round(item.protein)}g · 脂肪 ${round(item.fat)}g
                </div>
              </div>
            `
          )
          .join("")
      : `<p class="empty">还没有记录</p>`;
    return `
      <div class="meal-block">
        <h3>${meal.label}</h3>
        <div class="record-list">${rows}</div>
      </div>
    `;
  }).join("");
}

function renderTraining(day) {
  const exercises = day.training.exercises;
  $("exerciseCountHint").textContent = `${exercises.length} 个动作`;
  $("exerciseList").innerHTML = exercises.length
    ? exercises
        .map(
          (item) => `
            <div class="record-item">
              <div class="record-head">
                <strong>${escapeHtml(item.name)}</strong>
                <button class="danger-btn" data-delete-exercise="${item.id}" type="button">删</button>
              </div>
              <div class="record-meta">
                ${round(item.weight)}kg · ${round(item.reps)}次 · ${round(item.sets)}组${item.note ? ` · ${escapeHtml(item.note)}` : ""}
              </div>
            </div>
          `
        )
        .join("")
    : `<p class="empty">今天还没有添加动作</p>`;

  const history = Object.keys(state.records)
    .sort((a, b) => b.localeCompare(a))
    .filter((date) => {
      const training = state.records[date].training;
      return training && (training.type !== "休息" || training.exercises.length > 0);
    })
    .slice(0, 12);

  $("trainingHistory").innerHTML = history.length
    ? history
        .map((date) => {
          const training = state.records[date].training;
          return `
            <button class="history-item" data-open-date="${date}" type="button">
              <div class="record-head">
                <strong>${date}</strong>
                <span class="record-meta">${training.type}</span>
              </div>
              <div class="record-meta">${training.exercises.length} 个动作</div>
            </button>
          `;
        })
        .join("")
    : `<p class="empty">暂无历史训练记录</p>`;
}

function renderDashboard() {
  const dates = lastSevenDates();
  const totals = dates.map((date) => getTotals(getDay(date)));
  const trainingCount = dates.filter((date) => {
    const training = getDay(date).training;
    return training.type !== "休息" || training.exercises.length > 0;
  }).length;

  const avg = (key) => round(totals.reduce((sum, item) => sum + item[key], 0) / dates.length);
  $("dashboardRange").textContent = `${dates[0].slice(5)} 至 ${dates[6].slice(5)}`;
  $("dashboardCards").innerHTML = [
    ["平均热量", `${avg("calories")} kcal`],
    ["平均碳水", `${avg("carbs")} g`],
    ["平均蛋白质", `${avg("protein")} g`],
    ["平均脂肪", `${avg("fat")} g`],
    ["训练次数", `${trainingCount} 次`],
  ]
    .map(([label, value]) => `<div class="dash-card"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function lastSevenDates() {
  const base = new Date(`${state.activeDate}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() - (6 - index));
    return formatDate(date);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function setView(name) {
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  $(`view-${name}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === name);
  });
  $("pageTitle").textContent = { home: "今日", food: "饮食", training: "训练", dashboard: "看板" }[name];
}

function bindEvents() {
  $("activeDate").addEventListener("change", (event) => {
    state.activeDate = event.target.value || formatDate(new Date());
    render();
  });

  $("dayTypeSelect").addEventListener("change", (event) => {
    getDay().dayType = event.target.value;
    render();
  });

  $("trainingType").addEventListener("change", (event) => {
    getDay().training.type = event.target.value;
    render();
  });

  document.body.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav]");
    if (nav) setView(nav.dataset.nav);

    const meal = event.target.closest("[data-meal]");
    if (meal) {
      state.activeMeal = meal.dataset.meal;
      render();
    }

    const foodDelete = event.target.closest("[data-delete-food]");
    if (foodDelete) {
      const day = getDay();
      const mealKey = foodDelete.dataset.mealKey;
      day.meals[mealKey] = day.meals[mealKey].filter((item) => item.id !== foodDelete.dataset.deleteFood);
      render();
    }

    const exerciseDelete = event.target.closest("[data-delete-exercise]");
    if (exerciseDelete) {
      const day = getDay();
      day.training.exercises = day.training.exercises.filter((item) => item.id !== exerciseDelete.dataset.deleteExercise);
      render();
    }

    const openDate = event.target.closest("[data-open-date]");
    if (openDate) {
      state.activeDate = openDate.dataset.openDate;
      setView("training");
      render();
    }
  });

  $("foodForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("foodName").value.trim();
    if (!name) return;
    getDay().meals[state.activeMeal].push({
      id: createId(),
      name,
      carbs: parseNumber($("foodCarbs").value),
      protein: parseNumber($("foodProtein").value),
      fat: parseNumber($("foodFat").value),
      calories: parseNumber($("foodCalories").value),
    });
    event.target.reset();
    render();
  });

  $("exerciseForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("exerciseName").value.trim();
    if (!name) return;
    getDay().training.exercises.push({
      id: createId(),
      name,
      weight: parseNumber($("exerciseWeight").value),
      reps: parseNumber($("exerciseReps").value),
      sets: parseNumber($("exerciseSets").value),
      note: $("exerciseNote").value.trim(),
    });
    event.target.reset();
    render();
  });
}

bindEvents();
render();

const STORAGE_KEY = "fatLossTrackerMvp.v2";
const LEGACY_STORAGE_KEY = "fatLossTrackerMvp.v1";

const DEFAULT_TARGETS = {
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

const BASE_FOODS = [
  { name: "熟米饭", calories: 116, carbs: 25.9, protein: 2.6, fat: 0.3, type: "主食" },
  { name: "干意面", calories: 350, carbs: 72, protein: 12, fat: 1.5, type: "主食" },
  { name: "熟红薯", calories: 90, carbs: 21, protein: 1.6, fat: 0.2, type: "主食" },
  { name: "燕麦", calories: 380, carbs: 66, protein: 13, fat: 7, type: "主食" },
  { name: "全麦面包", calories: 250, carbs: 43, protein: 9, fat: 4, type: "主食" },
  { name: "鸡胸肉", calories: 165, carbs: 0, protein: 31, fat: 3.6, type: "肉类" },
  { name: "瘦牛肉", calories: 180, carbs: 0, protein: 26, fat: 8, type: "肉类" },
  { name: "三文鱼", calories: 208, carbs: 0, protein: 20, fat: 13, type: "肉类" },
  { name: "虾仁", calories: 99, carbs: 0.2, protein: 24, fat: 0.3, type: "肉类" },
  { name: "全蛋", calories: 143, carbs: 1, protein: 13, fat: 10, type: "蛋奶" },
  { name: "蛋白", calories: 52, carbs: 0.7, protein: 11, fat: 0.2, type: "蛋奶" },
  { name: "无糖酸奶", calories: 60, carbs: 5, protein: 4, fat: 3, type: "蛋奶" },
  { name: "牛奶", calories: 65, carbs: 5, protein: 3.3, fat: 3.5, type: "蛋奶" },
  { name: "乳清蛋白粉", calories: 400, carbs: 8, protein: 80, fat: 6, type: "蛋奶" },
  { name: "西兰花", calories: 34, carbs: 7, protein: 2.8, fat: 0.4, type: "蔬菜" },
  { name: "生菜", calories: 15, carbs: 2.9, protein: 1.4, fat: 0.2, type: "蔬菜" },
  { name: "番茄", calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, type: "蔬菜" },
  { name: "香蕉", calories: 89, carbs: 23, protein: 1.1, fat: 0.3, type: "水果" },
  { name: "苹果", calories: 52, carbs: 14, protein: 0.3, fat: 0.2, type: "水果" },
  { name: "蓝莓", calories: 57, carbs: 14.5, protein: 0.7, fat: 0.3, type: "水果" },
  { name: "橄榄油", calories: 884, carbs: 0, protein: 0, fat: 100, type: "其他" },
  { name: "坚果混合", calories: 600, carbs: 20, protein: 20, fat: 50, type: "坚果" },
  { name: "牛油果", calories: 160, carbs: 9, protein: 2, fat: 15, type: "水果" },
];

const DEFAULT_FOODS = (window.FOOD_DATABASE || BASE_FOODS.map(normalizeLegacyFood)).map((food) => ({
  ...food,
  source: "default",
}));

const TRAINING_RECOMMENDATIONS = {
  背: ["引体向上", "高位下拉", "杠铃划船", "坐姿划船"],
  胸: ["卧推", "上斜卧推", "双杠臂屈伸", "绳索夹胸"],
  腿: ["深蹲", "腿举", "罗马尼亚硬拉", "腿弯举"],
  肩: ["推举", "侧平举", "俯身飞鸟", "面拉"],
  手臂: ["杠铃弯举", "哑铃弯举", "绳索下压", "臂屈伸"],
  全身: ["深蹲", "卧推", "硬拉", "划船"],
  有氧: ["跑步", "椭圆机", "爬坡走", "动感单车"],
};

const TRAINING_TEMPLATES = {
  背部日: ["引体向上", "高位下拉", "杠铃划船", "坐姿划船"],
  胸部日: ["卧推", "上斜卧推", "双杠臂屈伸"],
  腿部日: ["深蹲", "腿举", "罗马尼亚硬拉", "腿弯举"],
};

const state = {
  activeDate: formatDate(new Date()),
  activeMeal: "breakfast",
  editingFood: null,
  data: loadData(),
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

function round(value) {
  return Math.round(value * 10) / 10;
}

function roundInt(value) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      return {
        records: saved.records || {},
        profile: saved.profile || null,
        customFoods: saved.customFoods || [],
        foodLibrary: saved.foodLibrary || [],
        exerciseLibrary: saved.exerciseLibrary || [],
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  try {
    return {
      records: JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY)) || {},
      profile: null,
      customFoods: [],
      foodLibrary: [],
      exerciseLibrary: [],
    };
  } catch {
    return { records: {}, profile: null, customFoods: [], foodLibrary: [], exerciseLibrary: [] };
  }
}

function normalizeLegacyFood(food) {
  return {
    id: food.id || `custom-${food.name}`,
    name: food.name,
    brand: food.brand || "",
    category: food.category || food.type || "其他",
    unitType: food.unitType || "per100g",
    servingSize: food.servingSize || "100g",
    calories: parseNumber(food.calories),
    carbs: parseNumber(food.carbs),
    protein: parseNumber(food.protein),
    fat: parseNumber(food.fat),
    verified: food.verified ?? true,
    note: food.note || "",
    aliases: food.aliases || [],
    defaultAmount: food.defaultAmount || food.defaultWeight || (food.unitType === "perServing" ? 1 : 100),
    favorite: food.favorite || false,
    useCount: food.useCount || 0,
    lastUsed: food.lastUsed || "",
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function getDay(date = state.activeDate) {
  if (!state.data.records[date]) {
    state.data.records[date] = {
      dayType: "low",
      meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
      training: { type: "休息", exercises: [] },
    };
  }

  const day = state.data.records[date];
  day.meals = day.meals || { breakfast: [], lunch: [], dinner: [], snack: [] };
  MEALS.forEach((meal) => {
    day.meals[meal.key] = day.meals[meal.key] || [];
  });
  day.training = day.training || { type: "休息", exercises: [] };
  return day;
}

function getAllFoods() {
  const byName = new Map();
  DEFAULT_FOODS.forEach((food) => byName.set(foodKey(food), normalizeFoodWithHistory(food)));
  state.data.customFoods.map(normalizeLegacyFood).forEach((food) => byName.set(foodKey(food), normalizeFoodWithHistory(food)));
  state.data.foodLibrary.forEach((food) => {
    const key = foodKey(food);
    const existing = byName.get(key) || normalizeLegacyFood(food);
    byName.set(key, {
      ...existing,
      defaultAmount: food.defaultAmount || food.defaultWeight || existing.defaultAmount,
      favorite: food.favorite || false,
      useCount: food.useCount || 0,
      lastUsed: food.lastUsed || "",
    });
  });
  return [...byName.values()];
}

function foodKey(food) {
  return food.id || `${food.brand || ""}|${food.name}`;
}

function allFoods() {
  return getAllFoods();
}

function normalizeFoodWithHistory(food) {
  const history = state.data.foodLibrary.find((item) => item.name === food.name);
  return {
    ...normalizeLegacyFood(food),
    favorite: history?.favorite || food.favorite || false,
    useCount: history?.useCount || food.useCount || 0,
    lastUsed: history?.lastUsed || food.lastUsed || "",
    defaultAmount: history?.defaultAmount || history?.defaultWeight || food.defaultAmount || food.defaultWeight || (food.unitType === "perServing" ? 1 : 100),
  };
}

function findFood(name) {
  const keyword = name.trim();
  if (!keyword) return null;
  return getAllFoods().find((food) => food.name === keyword || food.aliases?.includes(keyword)) || null;
}

function searchFoods(keyword) {
  const text = keyword.trim();
  const foods = getAllFoods();
  const results = text
    ? foods.filter((food) => foodMatches(food, text))
    : foods.filter((food) => food.favorite || food.lastUsed).slice(0, 30);
  return results.sort((a, b) => foodSearchScore(b, text) - foodSearchScore(a, text)).slice(0, 20);
}

function calculateFood(food, weight) {
  return calculateNutrition(food, weight);
}

function calculateNutrition(food, amount) {
  const value = parseNumber(amount);
  const ratio = food.unitType === "perServing" ? value : value / 100;
  return {
    calories: round(food.calories * ratio),
    carbs: round(food.carbs * ratio),
    protein: round(food.protein * ratio),
    fat: round(food.fat * ratio),
  };
}

function filterByCategory(category) {
  return getAllFoods().filter((food) => food.category === category);
}

function addCustomFood(food) {
  const normalized = normalizeLegacyFood({
    ...food,
    id: food.id || `custom-${Date.now()}`,
    verified: food.verified ?? false,
    note: food.note || "用户自定义食物",
  });
  state.data.customFoods = state.data.customFoods.filter((item) => item.name !== normalized.name);
  state.data.customFoods.push(normalized);
  saveData();
}

function saveRecentFood(food) {
  const item = normalizeLegacyFood(food);
  const existing = state.data.foodLibrary.find((saved) => saved.name === item.name);
  state.data.foodLibrary = state.data.foodLibrary.filter((saved) => saved.name !== item.name);
  state.data.foodLibrary.push({
    ...item,
    favorite: existing?.favorite || item.favorite || false,
    useCount: (existing?.useCount || 0) + 1,
    lastUsed: new Date().toISOString(),
  });
  saveData();
}

function toggleFavoriteFood(foodId) {
  const food = getAllFoods().find((item) => item.id === foodId || item.name === foodId);
  if (food) toggleFoodFavorite(food.name);
}

function foodMatches(food, keyword) {
  return [food.name, food.brand, food.category, ...(food.aliases || [])].some((value) => String(value || "").includes(keyword));
}

function foodSearchScore(food, keyword) {
  let score = 0;
  if (food.favorite) score += 100000;
  if (food.lastUsed) score += 50000;
  score += (food.useCount || 0) * 100;
  if (keyword && food.name === keyword) score += 10000;
  if (keyword && food.name.includes(keyword)) score += 3000;
  if (keyword && food.brand?.includes(keyword)) score += 2500;
  if (keyword && food.category?.includes(keyword)) score += 1500;
  if (food.source === "default") score += 10;
  return score;
}

function getTargets() {
  const profile = state.data.profile;
  if (!profile || !parseNumber(profile.weight)) return DEFAULT_TARGETS;

  const weight = parseNumber(profile.weight);
  const proteinRatio = profile.proteinMode === "high" ? 1.8 : 1.6;
  const goalAdjust = {
    "fat-loss": 1,
    maintain: 1.12,
    "muscle-gain": 1.22,
  }[profile.goal] || 1;

  const activityAdjust = {
    "0-1": 0.9,
    "2-3": 1,
    "4-5": 1.08,
    "6+": 1.15,
  }[profile.activity] || 1;

  const base = {
    carbs: 2.2 * weight * goalAdjust * activityAdjust,
    protein: proteinRatio * weight,
    fat: 0.8 * weight * goalAdjust,
  };

  return {
    low: makeTarget("低碳日", base.carbs * 0.6, base.protein, base.fat * 1.1),
    mid: makeTarget("中碳日", base.carbs, base.protein, base.fat),
    high: makeTarget("高碳日", base.carbs * 1.5, base.protein, base.fat * 0.85),
  };
}

function makeTarget(label, carbs, protein, fat) {
  const rounded = {
    label,
    carbs: roundInt(carbs),
    protein: roundInt(protein),
    fat: roundInt(fat),
  };
  rounded.calories = roundInt(rounded.carbs * 4 + rounded.protein * 4 + rounded.fat * 9);
  return rounded;
}

function getTotals(day = getDay()) {
  return MEALS.reduce(
    (sum, meal) => {
      day.meals[meal.key].forEach((item) => {
        sum.calories += parseNumber(item.calories);
        sum.carbs += parseNumber(item.carbs);
        sum.protein += parseNumber(item.protein);
        sum.fat += parseNumber(item.fat);
      });
      return sum;
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );
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
  renderSettings();
  renderLibraries(day);
  renderFoodSuggestions();
  saveData();
}

function renderHome(day) {
  const totals = getTotals(day);
  const targets = getTargets();
  const target = targets[day.dayType];
  $("homeDateText").textContent = state.activeDate;
  $("homeDayType").textContent = target.label;
  $("targetSourceText").textContent = state.data.profile ? "已按个人信息自动计算" : "未设置个人信息，正在使用默认目标";
  $("homeFoodTotal").textContent = `${round(totals.calories)} kcal`;
  $("homeTrainingType").textContent =
    day.training.type === "休息" && day.training.exercises.length === 0 ? "未记录" : day.training.type;
  $("homeGapHint").textContent = `${round(totals.calories)} / ${target.calories} kcal`;

  $("homeSummary").innerHTML = ["calories", "carbs", "protein", "fat"]
    .map((key) => summaryCard(key, totals[key], target[key]))
    .join("");

  $("homeGaps").innerHTML = ["calories", "carbs", "protein", "fat"]
    .map((key) => {
      const value = round(totals[key]);
      const gap = round(target[key] - value);
      const pct = target[key] ? Math.min(100, Math.round((value / target[key]) * 100)) : 0;
      const gapText = gap >= 0 ? `剩 ${gap}` : `超 ${Math.abs(gap)}`;
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

function summaryCard(key, total, target) {
  const left = round(target - total);
  const leftText = left >= 0 ? `剩余 ${left}` : `超出 ${Math.abs(left)}`;
  return `
    <div class="metric-card">
      <span>${metricLabel(key)}</span>
      <strong>${round(total)}${unitFor(key)}</strong>
      <small>目标 ${target}${unitFor(key)} · ${leftText}${unitFor(key)}</small>
    </div>
  `;
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
      ? items.map((item) => foodRow(item, meal.key)).join("")
      : `<p class="empty">还没有记录</p>`;
    return `
      <div class="meal-block">
        <h3>${meal.label}</h3>
        <div class="record-list">${rows}</div>
      </div>
    `;
  }).join("");

  $("foodSubmitBtn").textContent = state.editingFood ? "保存修改" : "添加到当前餐";
  $("cancelFoodEdit").classList.toggle("hidden", !state.editingFood);
}

function renderLibraries(day) {
  renderFoodLibrary();
  renderExerciseLibrary(day.training.type);
}

function renderFoodLibrary() {
  const foods = state.data.foodLibrary;
  const favorites = foods.filter((food) => food.favorite).sort(byRecent).slice(0, 8);
  const recent = [...foods].sort(byRecent).slice(0, 8);
  const common = [...foods].sort((a, b) => (b.useCount || 0) - (a.useCount || 0)).slice(0, 8);
  $("favoriteFoods").innerHTML = shortcutList(favorites, foodShortcut);
  $("recentFoods").innerHTML = shortcutList(recent, foodShortcut);
  $("commonFoods").innerHTML = shortcutList(common, foodShortcut, true);
  $("homeRecentFoods").innerHTML = shortcutList(recent.slice(0, 5), foodShortcut);
}

function renderExerciseLibrary(trainingType) {
  const exercises = state.data.exerciseLibrary;
  const recent = [...exercises].sort(byRecent).slice(0, 8);
  const recommended = mergeExerciseNames(TRAINING_RECOMMENDATIONS[trainingType] || [], exercises).slice(0, 8);
  $("recentExercises").innerHTML = shortcutList(recent, exerciseShortcut);
  $("recommendedExercises").innerHTML = shortcutList(recommended, exerciseShortcut);
  $("homeRecentExercises").innerHTML = shortcutList(recent.slice(0, 5), exerciseShortcut);
  $("trainingTemplates").innerHTML = Object.keys(TRAINING_TEMPLATES)
    .map((name) => `<button class="shortcut-chip" data-template="${escapeHtml(name)}" type="button">${escapeHtml(name)}</button>`)
    .join("");
}

function shortcutList(items, renderItem, showCount = false) {
  return items.length ? items.map((item) => renderItem(item, showCount)).join("") : `<p class="empty small">暂无记录</p>`;
}

function foodShortcut(food, showCount) {
  const count = showCount ? `（${food.useCount || 0}次）` : "";
  const weight = food.defaultWeight ? `<small>${round(food.defaultWeight)}g</small>` : "";
  return `<button class="shortcut-chip" data-quick-food="${escapeHtml(food.name)}" type="button">${food.favorite ? "⭐ " : ""}${escapeHtml(food.name)}${count}${weight}</button>`;
}

function exerciseShortcut(item) {
  const meta = item.weight || item.reps || item.sets ? `<small>${round(item.weight)}kg × ${round(item.reps)} × ${round(item.sets)}组</small>` : "";
  return `<button class="shortcut-chip" data-quick-exercise="${escapeHtml(item.name)}" type="button">${escapeHtml(item.name)}${meta}</button>`;
}

function mergeExerciseNames(names, library) {
  return names.map((name) => library.find((item) => item.name === name) || { name, weight: 0, reps: 0, sets: 0, useCount: 0 });
}

function byRecent(a, b) {
  return String(b.lastUsed || "").localeCompare(String(a.lastUsed || ""));
}

function foodRow(item, mealKey) {
  const amountUnit = item.unitType === "perServing" ? "份" : "g";
  const weight = item.weight ? `${round(item.weight)}${amountUnit} · ` : "";
  const brand = item.brand ? `${escapeHtml(item.brand)} · ` : "";
  const note = item.verified === false ? `<div class="record-note">${escapeHtml(item.note || "估算值，仅供记录参考")}</div>` : "";
  const favorite = state.data.foodLibrary.find((food) => food.name === item.name)?.favorite;
  return `
    <div class="record-item">
      <div class="record-head">
        <strong>${escapeHtml(item.name)}</strong>
        <div class="record-actions">
          <button class="ghost-btn" data-toggle-food-favorite="${escapeHtml(item.name)}" type="button">${favorite ? "⭐" : "☆"}</button>
          <button class="ghost-btn" data-edit-food="${item.id}" data-meal-key="${mealKey}" type="button">编辑</button>
          <button class="danger-btn" data-delete-food="${item.id}" data-meal-key="${mealKey}" type="button">删</button>
        </div>
      </div>
      <div class="record-meta">
        ${brand}${weight}${round(item.calories)} kcal · 碳 ${round(item.carbs)}g · 蛋白 ${round(item.protein)}g · 脂肪 ${round(item.fat)}g
      </div>
      ${note}
    </div>
  `;
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

  const history = Object.keys(state.data.records)
    .sort((a, b) => b.localeCompare(a))
    .filter((date) => {
      const training = state.data.records[date].training;
      return training && (training.type !== "休息" || training.exercises.length > 0);
    })
    .slice(0, 12);

  $("trainingHistory").innerHTML = history.length
    ? history
        .map((date) => {
          const training = state.data.records[date].training;
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

function renderSettings() {
  const profile = state.data.profile || defaultProfile();
  $("profileGender").value = profile.gender;
  $("profileHeight").value = profile.height || "";
  $("profileWeight").value = profile.weight || "";
  $("profileActivity").value = profile.activity;
  $("profileGoal").value = profile.goal;
  $("profileProteinMode").value = profile.proteinMode;
  $("profileStatus").textContent = state.data.profile ? "已保存" : "未设置";

  const targets = getTargets();
  $("targetPreview").innerHTML = ["low", "mid", "high"]
    .map((key) => {
      const item = targets[key];
      return `
        <div class="dash-card target-card">
          <span>${item.label}</span>
          <strong>${item.calories} kcal</strong>
          <small>碳 ${item.carbs}g · 蛋白 ${item.protein}g · 脂肪 ${item.fat}g</small>
        </div>
      `;
    })
    .join("");
}

function renderFoodSuggestions() {
  const keyword = $("foodName").value || "";
  $("foodSuggestions").innerHTML = searchFoods(keyword)
    .map((food) => `<option value="${escapeHtml(food.name)}">${foodOptionMeta(food)}</option>`)
    .join("");
  $("foodSearchResults").innerHTML = searchFoods(keyword)
    .slice(0, 8)
    .map(
      (food) => `
        <button class="food-result" data-select-food="${escapeHtml(food.name)}" type="button">
          <strong>${escapeHtml(food.name)}</strong>
          <span>${escapeHtml(foodOptionMeta(food))}</span>
        </button>
      `
    )
    .join("");
}

function foodOptionMeta(food) {
  const brand = food.brand ? `${food.brand} · ` : "";
  const unit = food.unitType === "perServing" ? food.servingSize || "1份" : "100g";
  const verified = food.verified ? "" : " · 估算";
  return `${brand}${food.category} · ${food.calories} kcal/${unit}${verified}`;
}

function defaultProfile() {
  return {
    gender: "male",
    height: "",
    weight: "",
    activity: "2-3",
    goal: "fat-loss",
    proteinMode: "standard",
  };
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
  $("pageTitle").textContent = { home: "今日", food: "饮食", training: "训练", dashboard: "看板", settings: "设置" }[name];
}

function updateFoodByName() {
  renderFoodSuggestions();
  const food = findFood($("foodName").value);
  const weight = parseNumber($("foodWeight").value);
  if (!food) {
    $("foodMatchHint").textContent = "没有匹配到内置食物，可手动填写";
    $("foodAmountLabel").firstChild.textContent = "重量 g";
    return;
  }

  $("foodAmountLabel").firstChild.textContent = food.unitType === "perServing" ? "份数" : "重量 g";
  $("foodWeight").placeholder = food.unitType === "perServing" ? "例如 1" : "例如 150";
  $("foodMatchHint").textContent = food.verified
    ? `已匹配：${food.name}（${foodOptionMeta(food)}）`
    : `已匹配：${food.name}（${foodOptionMeta(food)}）。${food.note || "估算值，仅供记录参考"}`;
  if (weight) fillFoodMacros(calculateFood(food, weight));
}

function fillFoodMacros(macros) {
  $("foodCalories").value = macros.calories;
  $("foodCarbs").value = macros.carbs;
  $("foodProtein").value = macros.protein;
  $("foodFat").value = macros.fat;
}

function clearFoodForm() {
  $("foodForm").reset();
  $("foodMatchHint").textContent = "输入食物名称和重量后自动计算";
  $("foodAmountLabel").firstChild.textContent = "重量 g";
  state.editingFood = null;
  render();
}

function generateShareText() {
  const day = getDay();
  const targets = getTargets();
  const target = targets[day.dayType];
  const totals = getTotals(day);
  const percent = (key) => {
    if (!target[key]) return 0;
    return Math.round((totals[key] / target[key]) * 100);
  };

  return [
    `今日减脂记录｜${state.activeDate}`,
    "",
    `类型：${target.label}`,
    "",
    "目标：",
    `热量 ${target.calories} kcal`,
    `碳水 ${target.carbs}g｜蛋白质 ${target.protein}g｜脂肪 ${target.fat}g`,
    "",
    "实际：",
    `热量 ${roundInt(totals.calories)} kcal`,
    `碳水 ${roundInt(totals.carbs)}g｜蛋白质 ${roundInt(totals.protein)}g｜脂肪 ${roundInt(totals.fat)}g`,
    "",
    "完成度：",
    `热量 ${percent("calories")}%`,
    `碳水 ${percent("carbs")}%`,
    `蛋白质 ${percent("protein")}%`,
    `脂肪 ${percent("fat")}%`,
    "",
    "训练：",
    trainingShareText(day.training),
    "",
    "总结：",
    shareSummary(target, totals, day.training),
  ].join("\n");
}

function trainingShareText(training) {
  if (!training || (training.type === "休息" && training.exercises.length === 0)) {
    return "今日休息";
  }
  const label = {
    胸: "胸部训练",
    背: "背部训练",
    腿: "腿部训练",
    肩: "肩部训练",
    手臂: "手臂训练",
    全身: "全身训练",
    有氧: "有氧训练",
    休息: "今日休息",
  }[training.type] || `${training.type}训练`;
  if (label === "今日休息") return label;
  const totalSets = training.exercises.reduce((sum, item) => sum + parseNumber(item.sets), 0);
  return `${label}，${training.exercises.length}个动作，共${roundInt(totalSets)}组`;
}

function shareSummary(target, totals, training) {
  const noTraining = !training || (training.type === "休息" && training.exercises.length === 0);
  if (totals.calories > target.calories * 1.1) {
    return "今日热量略高，明天回到计划即可，不用焦虑。";
  }
  if (totals.protein < target.protein * 0.8) {
    return "今日蛋白质偏低，建议晚餐或加餐补充优质蛋白。";
  }
  if (noTraining) {
    return "今日休息日，保持饮食节奏也很重要。";
  }
  if (totals.calories <= target.calories * 1.05 && totals.protein >= target.protein * 0.9) {
    return "今日完成度不错，蛋白质基本达标，继续保持。";
  }
  return "今日记录已完成，明天继续稳定执行。";
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  $("shareText").select();
  document.execCommand("copy");
}

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.remove("hidden");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => $("toast").classList.add("hidden"), 1800);
}

function buildFoodItem() {
  const name = $("foodName").value.trim();
  if (!name) return null;
  const food = findFood(name);
  return {
    id: state.editingFood?.id || createId(),
    name,
    brand: food?.brand || "",
    category: food?.category || "其他",
    foodId: food?.id || "",
    unitType: food?.unitType || "per100g",
    servingSize: food?.servingSize || "100g",
    verified: food?.verified ?? false,
    note: food?.note || "",
    weight: parseNumber($("foodWeight").value),
    carbs: parseNumber($("foodCarbs").value),
    protein: parseNumber($("foodProtein").value),
    fat: parseNumber($("foodFat").value),
    calories: parseNumber($("foodCalories").value),
  };
}

function saveCustomFoodIfNeeded(item) {
  if (!$("saveCustomFood").checked || !item.weight) return;
  const ratio = item.unitType === "perServing" ? 1 / item.weight : 100 / item.weight;
  const food = {
    id: `custom-${Date.now()}`,
    name: item.name,
    brand: item.brand || "",
    category: item.category || "其他",
    unitType: item.unitType || "per100g",
    servingSize: item.unitType === "perServing" ? item.servingSize || "1份" : "100g",
    calories: round(item.calories * ratio),
    carbs: round(item.carbs * ratio),
    protein: round(item.protein * ratio),
    fat: round(item.fat * ratio),
    verified: false,
    note: "用户自定义食物",
  };
  addCustomFood(food);
}

function rememberFood(item) {
  if (!item.name || !item.weight) return;
  const matched = findFood(item.name);
  const ratio = item.unitType === "perServing" ? 1 / item.weight : 100 / item.weight;
  const existing = state.data.foodLibrary.find((food) => food.name === item.name);
  const saved = {
    id: matched?.id || item.foodId || `recent-${item.name}`,
    name: item.name,
    brand: matched?.brand || item.brand || "",
    category: matched?.category || item.category || "其他",
    unitType: matched?.unitType || item.unitType || "per100g",
    servingSize: matched?.servingSize || item.servingSize || "100g",
    defaultAmount: item.weight,
    defaultWeight: item.weight,
    calories: matched?.calories ?? round(item.calories * ratio),
    carbs: matched?.carbs ?? round(item.carbs * ratio),
    protein: matched?.protein ?? round(item.protein * ratio),
    fat: matched?.fat ?? round(item.fat * ratio),
    verified: matched?.verified ?? item.verified ?? false,
    note: matched?.note || item.note || "",
    favorite: existing?.favorite || false,
    lastUsed: new Date().toISOString(),
    useCount: (existing?.useCount || 0) + 1,
  };
  state.data.foodLibrary = state.data.foodLibrary.filter((food) => food.name !== item.name);
  state.data.foodLibrary.push(saved);
}

function rememberExercise(item) {
  if (!item.name) return;
  const existing = state.data.exerciseLibrary.find((exercise) => exercise.name === item.name);
  const saved = {
    name: item.name,
    weight: item.weight,
    reps: item.reps,
    sets: item.sets,
    lastUsed: new Date().toISOString(),
    useCount: (existing?.useCount || 0) + 1,
  };
  state.data.exerciseLibrary = state.data.exerciseLibrary.filter((exercise) => exercise.name !== item.name);
  state.data.exerciseLibrary.push(saved);
}

function quickFillFood(name) {
  const food = getAllFoods().find((item) => item.name === name);
  if (!food) return;
  $("foodName").value = food.name;
  $("foodWeight").value = food.defaultAmount || (food.unitType === "perServing" ? 1 : 100);
  fillFoodMacros(calculateFood(food, $("foodWeight").value));
  $("foodAmountLabel").firstChild.textContent = food.unitType === "perServing" ? "份数" : "重量 g";
  $("foodMatchHint").textContent = food.verified
    ? `已填入：${food.name}，可直接修改${food.unitType === "perServing" ? "份数" : "重量"}`
    : `已填入：${food.name}，${food.note || "估算值，仅供记录参考"}`;
  setView("food");
  $("foodWeight").focus();
}

function quickFillExercise(name) {
  const exercise = state.data.exerciseLibrary.find((item) => item.name === name) || { name, weight: 0, reps: 0, sets: 0 };
  $("exerciseName").value = exercise.name;
  $("exerciseWeight").value = exercise.weight || "";
  $("exerciseReps").value = exercise.reps || "";
  $("exerciseSets").value = exercise.sets || "";
  $("exerciseNote").value = "";
  setView("training");
  $("exerciseWeight").focus();
}

function toggleFoodFavorite(name) {
  let item = state.data.foodLibrary.find((food) => food.name === name);
  if (!item) {
    const food = findFood(name);
    if (!food) return;
    item = {
      name: food.name,
      brand: food.brand || "",
      category: food.category || "其他",
      unitType: food.unitType || "per100g",
      servingSize: food.servingSize || "100g",
      defaultAmount: food.defaultAmount || (food.unitType === "perServing" ? 1 : 100),
      defaultWeight: food.defaultAmount || (food.unitType === "perServing" ? 1 : 100),
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      verified: food.verified,
      note: food.note || "",
      favorite: false,
      lastUsed: new Date().toISOString(),
      useCount: 0,
    };
    state.data.foodLibrary.push(item);
  }
  item.favorite = !item.favorite;
  render();
}

function applyTrainingTemplate(name) {
  const template = TRAINING_TEMPLATES[name];
  if (!template) return;
  const day = getDay();
  template.forEach((exerciseName) => {
    const saved = state.data.exerciseLibrary.find((item) => item.name === exerciseName);
    day.training.exercises.push({
      id: createId(),
      name: exerciseName,
      weight: saved?.weight || 0,
      reps: saved?.reps || 0,
      sets: saved?.sets || 0,
      note: "",
    });
  });
  render();
}

function startFoodEdit(mealKey, id) {
  const item = getDay().meals[mealKey].find((food) => food.id === id);
  if (!item) return;
  state.activeMeal = mealKey;
  state.editingFood = { mealKey, id };
  $("foodName").value = item.name;
  $("foodWeight").value = item.weight || "";
  $("foodCarbs").value = item.carbs || "";
  $("foodProtein").value = item.protein || "";
  $("foodFat").value = item.fat || "";
  $("foodCalories").value = item.calories || "";
  $("saveCustomFood").checked = false;
  setView("food");
  renderFood(getDay());
  $("foodName").focus();
}

function bindEvents() {
  $("activeDate").addEventListener("change", (event) => {
    state.activeDate = event.target.value || formatDate(new Date());
    state.editingFood = null;
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

  $("foodName").addEventListener("input", updateFoodByName);
  $("foodWeight").addEventListener("input", updateFoodByName);
  $("cancelFoodEdit").addEventListener("click", clearFoodForm);
  $("shareTodayBtn").addEventListener("click", () => {
    const shareText = $("shareText");
    shareText.value = generateShareText();
    shareText.setSelectionRange(0, 0);
    shareText.scrollTop = 0;
    $("shareDialog").showModal();
    window.requestAnimationFrame(() => {
      shareText.setSelectionRange(0, 0);
      shareText.scrollTop = 0;
    });
  });
  $("closeShareDialog").addEventListener("click", () => $("shareDialog").close());
  $("copyShareText").addEventListener("click", async () => {
    await copyText($("shareText").value);
    showToast("已复制，可发送给朋友");
  });

  document.body.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav]");
    if (nav) setView(nav.dataset.nav);

    const meal = event.target.closest("[data-meal]");
    if (meal) {
      state.activeMeal = meal.dataset.meal;
      render();
    }

    const foodEdit = event.target.closest("[data-edit-food]");
    if (foodEdit) {
      startFoodEdit(foodEdit.dataset.mealKey, foodEdit.dataset.editFood);
    }

    const quickFood = event.target.closest("[data-quick-food]");
    if (quickFood) {
      quickFillFood(quickFood.dataset.quickFood);
    }

    const selectedFood = event.target.closest("[data-select-food]");
    if (selectedFood) {
      quickFillFood(selectedFood.dataset.selectFood);
      renderFoodSuggestions();
    }

    const favoriteFood = event.target.closest("[data-toggle-food-favorite]");
    if (favoriteFood) {
      toggleFoodFavorite(favoriteFood.dataset.toggleFoodFavorite);
    }

    const foodDelete = event.target.closest("[data-delete-food]");
    if (foodDelete) {
      const day = getDay();
      const mealKey = foodDelete.dataset.mealKey;
      day.meals[mealKey] = day.meals[mealKey].filter((item) => item.id !== foodDelete.dataset.deleteFood);
      if (state.editingFood?.id === foodDelete.dataset.deleteFood) state.editingFood = null;
      render();
    }

    const exerciseDelete = event.target.closest("[data-delete-exercise]");
    if (exerciseDelete) {
      const day = getDay();
      day.training.exercises = day.training.exercises.filter((item) => item.id !== exerciseDelete.dataset.deleteExercise);
      render();
    }

    const quickExercise = event.target.closest("[data-quick-exercise]");
    if (quickExercise) {
      quickFillExercise(quickExercise.dataset.quickExercise);
    }

    const template = event.target.closest("[data-template]");
    if (template) {
      applyTrainingTemplate(template.dataset.template);
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
    const item = buildFoodItem();
    if (!item) return;
    const day = getDay();
    saveCustomFoodIfNeeded(item);
    rememberFood(item);

    if (state.editingFood) {
      const list = day.meals[state.editingFood.mealKey];
      const index = list.findIndex((food) => food.id === state.editingFood.id);
      if (index >= 0) list[index] = item;
    } else {
      day.meals[state.activeMeal].push(item);
    }
    clearFoodForm();
  });

  $("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.data.profile = {
      gender: $("profileGender").value,
      height: parseNumber($("profileHeight").value),
      weight: parseNumber($("profileWeight").value),
      activity: $("profileActivity").value,
      goal: $("profileGoal").value,
      proteinMode: $("profileProteinMode").value,
    };
    render();
    setView("home");
  });

  $("exerciseForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("exerciseName").value.trim();
    if (!name) return;
    const item = {
      id: createId(),
      name,
      weight: parseNumber($("exerciseWeight").value),
      reps: parseNumber($("exerciseReps").value),
      sets: parseNumber($("exerciseSets").value),
      note: $("exerciseNote").value.trim(),
    };
    getDay().training.exercises.push(item);
    rememberExercise(item);
    event.target.reset();
    render();
  });
}

bindEvents();
render();

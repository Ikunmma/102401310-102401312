"use strict";

function eventTimestamp(value) {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2})?$/.test(text)) return NaN;
  return new Date(text.replace(" ", "T")).getTime();
}

const regionNames = { teaching: "教学区", library: "图书馆", canteen: "食堂", dorm: "宿舍区", sports: "操场", other: "其他区域" };

function matchesRegion(location, region) {
  const patterns = {
    teaching: /教学|实验楼|实验室/, library: /图书馆/, canteen: /食堂|餐厅/,
    dorm: /宿舍|宿舍楼|公寓/, sports: /操场|田径场|运动场/
  };
  return !region || Boolean(patterns[region]?.test(String(location || "")));
}

function filterItems(source, keyword, type, category = "", options = {}) {
  const query = keyword.trim().toLocaleLowerCase();
  const now = options.now ?? Date.now();

  return source.filter(item => {
    if (item.status === "resolved") return false;
    const typeMatches = type === "all" || item.type === type;
    const searchableText = [
      item.name, item.category, item.description, item.location
    ].map(value => String(value || "")).join(" ").toLocaleLowerCase();

    const categoryMatches = !category || String(item.category || "").trim() === category;
    const time = eventTimestamp(item.eventTime);
    const timeMatches = !options.days || (Number.isFinite(time) &&
      time >= now - Number(options.days) * 86400000 && time <= now);
    return typeMatches && categoryMatches && searchableText.includes(query) &&
      (!options.region || (item.region ? item.region === options.region : matchesRegion(item.location, options.region))) && timeMatches;
  });
}

function keywordScore(item, searchKeyword) {
  const query = String(searchKeyword || "").trim().toLocaleLowerCase();
  if (!query) return 0;
  const name = String(item.name || "").toLocaleLowerCase();
  if (name === query) return 4;
  if (name.includes(query)) return 3;
  if (String(item.category || "").toLocaleLowerCase().includes(query)) return 2;
  return [item.description, item.location].some(value => String(value || "").toLocaleLowerCase().includes(query)) ? 1 : 0;
}

function sortSearchItems(source, order = "default", searchKeyword = "") {
  const timestamp = item => new Date(item.createdAt).getTime();
  return [...source].sort((a, b) => {
    if (order === "default") {
      const relevance = keywordScore(b, searchKeyword) - keywordScore(a, searchKeyword);
      if (relevance) return relevance;
    }
    if (order === "views") {
      const views = ShiguangData.viewCount(b) - ShiguangData.viewCount(a);
      if (views) return views;
    }
    const left = timestamp(a), right = timestamp(b);
    if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : 0;
    if (!Number.isFinite(right)) return -1;
    return right - left;
  });
}

window.ShiguangSearch = { filterItems, sortSearchItems, matchesRegion, eventTimestamp, keywordScore, viewCount };
const searchList = document.getElementById("search-results");
const summary = document.getElementById("search-summary");
const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("search-category");
const regionSelect = document.getElementById("search-region");
const daysSelect = document.getElementById("search-days");
const sortSelect = document.getElementById("search-sort");
const standardCategories = ["证件卡片", "钥匙", "电子设备", "生活用品", "书籍文具", "衣物配饰", "其他物品"];

function refreshCategoryOptions() {
  const categories = [...new Set([...standardCategories,
    ...ShiguangData.getItems().map(item => String(item.category || "").trim()).filter(Boolean)])];
  for (const select of [categorySelect, document.getElementById("publish-category")]) {
    const value = select.value;
    const placeholder = select.id === "search-category" ? "全部类别" : "请选择物品分类";
    const first = makeElement("option", "", placeholder);
    first.value = "";
    select.replaceChildren(first, ...categories.map(category => {
      const option = makeElement("option", "", category);
      option.value = category;
      return option;
    }));
    select.value = value;
  }
}

let keyword = "";
let selectedType = "all";
let selectedCategory = "";
let historyOpen = false;
function closeSearchHistory() {
  historyOpen = false;
  document.getElementById("search-history").hidden = true;
  searchInput.setAttribute("aria-expanded", "false");
}
function openSearchHistory() {
  historyOpen = true;
  renderSearchHistory();
}
searchInput.addEventListener("focus", openSearchHistory);
searchInput.addEventListener("click", openSearchHistory);
searchInput.addEventListener("keydown", event => {
  if (event.key === "Escape") closeSearchHistory();
  if (event.key === "ArrowDown") {
    openSearchHistory();
    const first = document.querySelector(".history-keyword");
    if (first) { event.preventDefault(); first.focus(); }
  }
});
document.addEventListener("click", event => {
  if (!event.target.closest(".search-input-wrap")) closeSearchHistory();
});
document.querySelector(".search-input-wrap").addEventListener("focusout", event => {
  if (!event.currentTarget.contains(event.relatedTarget)) closeSearchHistory();
});
function renderSearchHistory() {
  const history = ShiguangData.getSearchHistory();
  document.getElementById("search-history").hidden = !historyOpen || !history.length;
  searchInput.setAttribute("aria-expanded", String(historyOpen && history.length > 0));
  document.getElementById("search-history-list").replaceChildren(...history.map(text => {
    const entry = makeElement("span", "history-entry", "");
    const button = makeElement("button", "history-keyword", text);
    button.type = "button";
    button.addEventListener("click", () => {
      searchInput.value = text;
      keyword = text;
      rememberSearch(text);
      renderSearch();
      closeSearchHistory();
    });
    const remove = makeElement("button", "history-remove", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `删除搜索记录：${text}`);
    remove.addEventListener("click", () => { ShiguangData.removeSearchHistory(text); renderSearchHistory(); });
    entry.append(button, remove);
    return entry;
  }));
}

function rememberSearch(text) {
  ShiguangData.addSearchHistory(text);
  renderSearchHistory();
}

document.getElementById("clear-search-history").addEventListener("click", () => {
  ShiguangData.clearSearchHistory();
  renderSearchHistory();
});
renderSearchHistory();
function renderSearch() {
  refreshCategoryOptions();
  const results = sortSearchItems(filterItems(ShiguangData.getItems(), keyword, selectedType, selectedCategory,
    { region: regionSelect.value, days: daysSelect.value }), sortSelect.value, keyword);

  if (results.length === 0) {
    const empty = makeElement("div", "empty-result", "");
    const publishButton = makeElement("button", "empty-publish", "发布寻物");
    publishButton.type = "button";
    publishButton.addEventListener("click", () => {
      if (editingId) leaveEdit();
      setEditMode(false);
      setPublishType("lost");
      const nameInput = document.getElementById("publish-name");
      if (!nameInput.value.trim()) nameInput.value = keyword.slice(0, nameInput.maxLength);
      const publishCategory = document.getElementById("publish-category");
      if (!publishCategory.value && selectedCategory) publishCategory.value = selectedCategory;
      showView("publish");
      nameInput.focus();
    });
    const actions = makeElement("div", "empty-actions", "");
    actions.append(publishButton);
    empty.append(
      makeElement("h3", "", "暂时没有找到相关信息"),
      actions
    );
    searchList.replaceChildren(empty);
  } else {
    searchList.replaceChildren(...results.map(createCard));
  }

  summary.textContent = keyword || selectedType !== "all" || selectedCategory || regionSelect.value || daysSelect.value
    ? `符合条件的 ${results.length} 条信息`
    : `共 ${results.length} 条信息`;
}
document.getElementById("search-form").addEventListener("submit", event => {
  event.preventDefault();
  keyword = searchInput.value.trim();
  rememberSearch(keyword);
  closeSearchHistory();
  renderSearch();
});

categorySelect.addEventListener("change", () => {
  selectedCategory = categorySelect.value;
  keyword = searchInput.value.trim();
  renderSearch();
});
for (const select of [regionSelect, daysSelect, sortSelect]) {
  select.addEventListener("change", () => {
    keyword = searchInput.value.trim();
    renderSearch();
  });
}

document.querySelectorAll(".type-filters button").forEach(button => {
  button.addEventListener("click", () => {
    selectedType = button.dataset.type;

    document.querySelectorAll(".type-filters button").forEach(other => {
      const active = other === button;
      other.classList.toggle("is-active", active);
      other.setAttribute("aria-pressed", String(active));
    });

    renderSearch();
  });
});

function openSearchWithType(type) {
  keyword = "";
  searchInput.value = "";
  selectedCategory = "";
  categorySelect.value = "";
  regionSelect.value = "";
  daysSelect.value = "";
  sortSelect.value = "default";

  const filterButton = document.querySelector(
    `.type-filters button[data-type="${type}"]`
  );
  filterButton.click();
  showView("search");
}

document.getElementById("search-back").addEventListener("click", () => showView("home"));

"use strict";

const STORAGE_KEY = "shiguang_items_v1";

const demoItems = [
  {
    id: "demo-card", type: "found", name: "蓝色卡套 · 校园卡",
    category: "证件卡片", description: "蓝色卡套，卡面姓名请认领时核对",
    location: "图书馆一楼", eventTime: "2026-09-26T09:20",
    contact: "演示信息", status: "active", ownerId: "demo",
    createdAt: "2026-09-26T09:20"
  },
  {
    id: "demo-umbrella", type: "lost", name: "黑色折叠伞",
    category: "生活用品", description: "黑色三折雨伞，木纹手柄",
    location: "第三教学楼 203", eventTime: "2026-09-25T18:00",
    contact: "演示信息", status: "active", ownerId: "demo",
    createdAt: "2026-09-25T18:00"
  },
  {
    id: "demo-keys", type: "found", name: "一串宿舍钥匙",
    category: "钥匙", description: "三把钥匙，蓝色钥匙扣",
    location: "第二食堂门口", eventTime: "2026-09-24T12:30",
    contact: "演示信息", status: "active", ownerId: "demo",
    createdAt: "2026-09-24T12:30"
  }
];

function readSavedItems() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function statusText(item) {
  if (item.status === "resolved") {
    return item.type === "lost" ? "已找到" : "已归还";
  }
  return item.type === "lost" ? "寻找中" : "等待认领";
}

function displayTime(value) {
  const text = String(value || "").replace("T", " ");
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(5, 16) : text;
}

function displayPublishedTime(value) {
  const text = String(value || "");
  if (/Z$/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("zh-CN", { hour12: false });
    }
  }
  return text.replace("T", " ") || "时间未填写";
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

const contactButton = document.getElementById("reveal-contact");
const contactText = document.getElementById("detail-contact");

function openDetail(item) {
  const isLost = item.type === "lost";

  document.getElementById("detail-kind").textContent =
    isLost ? "寻物启事" : "招领信息";
  document.getElementById("detail-kind").className =
    `detail-kind ${isLost ? "lost" : "found"}`;
  document.getElementById("detail-status").textContent = statusText(item);
  document.getElementById("detail-title").textContent =
    item.name || "未命名物品";
  document.getElementById("detail-category").textContent = `物品分类：${item.category || "其他物品"}`;
  document.getElementById("detail-description").textContent = item.description || "暂未提供外观特征";
  document.getElementById("detail-published").textContent =
    `发布于 ${displayPublishedTime(item.createdAt)}`;

  const fields = document.getElementById("detail-fields");
  fields.replaceChildren();

  const rows = [
    [isLost ? "丢失地点" : "拾取地点", item.location],
    [isLost ? "丢失时间" : "拾取时间",
      String(item.eventTime || "").replace("T", " ")]
  ];

  for (const [index, [label, value]] of rows.entries()) {
    const row = document.createElement("div");
    row.className = `detail-field${index < 2 ? " is-primary" : " is-wide"}`;
    row.append(
      makeElement("span", "", label),
      makeElement("strong", "", String(value || "未填写"))
    );
    fields.append(row);
  }

  contactText.textContent = `联系方式：${item.contact || "未提供"}`;
  contactText.hidden = true;
  contactButton.hidden = false;

  previousView = currentView;
  showView("detail");
}

contactButton.addEventListener("click", () => {
  contactText.hidden = false;
  contactButton.hidden = true;
});

function createCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "item-card";

  const top = makeElement("span", "card-top", "");
  top.append(
    makeElement(
      "span",
      `card-type ${item.type === "lost" ? "lost" : "found"}`,
      `${item.type === "lost" ? "寻物" : "招领"} · ${statusText(item)}`
    )
  );

  card.append(
    top,
    makeElement("span", "card-name", item.name || "未命名物品"),
    makeElement(
      "span",
      "card-meta",
      `${item.location || "地点未填"} · ${displayTime(item.eventTime)}`
    )
  );
  card.addEventListener("click", () => openDetail(item));
  return card;
}

/* 搜索 */
const items = [...readSavedItems(), ...demoItems]
  .filter(item => item && typeof item === "object")
  .sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );

function filterItems(source, keyword, type) {
  const query = keyword.trim().toLocaleLowerCase();

  return source.filter(item => {
    const typeMatches = type === "all" || item.type === type;
    const searchableText = [
      item.name, item.category, item.description, item.location
    ].map(value => String(value || "")).join(" ").toLocaleLowerCase();

    return typeMatches && searchableText.includes(query);
  });
}

window.ShiguangSearch = { filterItems };

const homeList = document.getElementById("item-list");
const searchList = document.getElementById("search-results");
const summary = document.getElementById("search-summary");
const searchInput = document.getElementById("search-input");
const homeView = document.getElementById("home-view");
const searchView = document.getElementById("search-view");
const detailView = document.getElementById("detail-view");
const homeNav = document.getElementById("home-nav");
const searchNav = document.getElementById("search-nav");
const publishNav = document.getElementById("publish-nav");
const mineNav = document.getElementById("mine-nav");

let keyword = "";
let selectedType = "all";
let previousView = "home";
let currentView = "home";

function renderHome() {
  homeList.replaceChildren(...items.slice(0, 3).map(createCard));
}

function renderSearch() {
  const results = filterItems(items, keyword, selectedType);

  if (results.length === 0) {
    const empty = makeElement("div", "empty-result", "");
    const resetButton = makeElement("button", "empty-reset", "清除条件，查看全部");
    resetButton.type = "button";
    resetButton.addEventListener("click", () => {
      keyword = "";
      searchInput.value = "";
      document.querySelector('.type-filters button[data-type="all"]').click();
      searchInput.focus();
    });
    empty.append(
      makeElement("h3", "", "暂时没有找到相关信息"),
      makeElement("p", "", "试试其他物品名称或地点，也可以清除筛选条件。"),
      resetButton
    );
    searchList.replaceChildren(empty);
  } else {
    searchList.replaceChildren(...results.map(createCard));
  }

  summary.textContent = keyword || selectedType !== "all"
    ? `符合条件的 ${results.length} 条信息`
    : `共 ${results.length} 条信息`;
}

function showView(view) {
  currentView = view;
  for (const name of ["home", "search", "detail", "publish", "publish-success", "mine"]) {
    document.getElementById(`${name}-view`).hidden = name !== view;
  }
  const navView = view === "publish-success" ? "publish" : view;
  for (const [name, button] of [["home", homeNav], ["search", searchNav], ["publish", publishNav], ["mine", mineNav]]) {
    button.classList.toggle("active", name === navView);
    button.removeAttribute("aria-current");
    if (name === navView) button.setAttribute("aria-current", "page");
  }

  document.querySelector(".page-scroll").scrollTop = 0;
  window.scrollTo(0, 0);
}

document.getElementById("search-form").addEventListener("submit", event => {
  event.preventDefault();
  keyword = searchInput.value.trim();
  renderSearch();
});

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

  const filterButton = document.querySelector(
    `.type-filters button[data-type="${type}"]`
  );
  filterButton.click();
  showView("search");
}

document.querySelectorAll("[data-home-type]").forEach(button => {
  button.addEventListener("click", () => {
    openSearchWithType(button.dataset.homeType);
  });
});

document.getElementById("detail-back").addEventListener("click", () => {
  showView(previousView);
});
homeNav.addEventListener("click", () => showView("home"));
searchNav.addEventListener("click", () => showView("search"));

/* 发布：仅在保存成功后更新列表和展示成功页。 */
const OWNER_KEY = "shiguang_owner_v1";
const publishForm = document.getElementById("publish-form");
const publishError = document.getElementById("publish-error");
const publishFields = {
  name: "物品名称", category: "物品分类", eventTime: "时间",
  location: "地点", description: "外观特征", contact: "联系方式"
};
let publishType = "lost";
let editingId = null;
let publishDraft = null;

function setPublishType(type) {
  publishType = type;
  document.querySelectorAll('input[name="publish-type"]').forEach(input => {
    input.checked = input.value === type;
  });
  document.getElementById("publish-time-label").textContent = type === "lost" ? "丢失时间" : "拾取时间";
  document.getElementById("publish-location-label").textContent = type === "lost" ? "丢失地点" : "拾取地点";
}

function setEditMode(editing) {
  document.getElementById("publish-heading").textContent = editing ? "编辑发布信息" : "发布信息";
  document.getElementById("publish-submit").textContent = editing ? "保存修改" : "发布信息";
  document.getElementById("publish-back").textContent = editing ? "‹ 返回我的发布" : "‹ 返回首页";
  document.getElementById("edit-cancel").hidden = !editing;
  publishError.hidden = true;
  Object.keys(publishFields).forEach(name => setFieldError(name, ""));
}

function leaveEdit() {
  editingId = null;
  publishForm.reset();
  for (const name of Object.keys(publishFields)) {
    document.getElementById(`publish-${name}`).value = publishDraft?.[name] || "";
  }
  setPublishType(publishDraft?.type || "lost");
  publishDraft = null;
  setEditMode(false);
}

function readOwnedRecord(id) {
  const ownerId = localStorage.getItem(OWNER_KEY);
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!Array.isArray(saved)) throw new Error("无法读取发布记录，请刷新页面后重试。");
  const record = saved.find(item => item && item.id === id && item.ownerId === ownerId);
  if (!ownerId || !record) throw new Error("未找到你的发布记录，请刷新页面后重试。");
  return { saved, record };
}

function updateOwnedRecord(id, changes) {
  const { saved, record } = readOwnedRecord(id);
  const updated = { ...record, ...changes };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.map(item => item === record ? updated : item)));
  const index = items.findIndex(item => item.id === id && item.ownerId === record.ownerId);
  if (index !== -1) items[index] = updated;
  renderHome();
  renderSearch();
  renderMine();
  return updated;
}

function showMineFeedback(message, error = false) {
  const feedback = document.getElementById("mine-feedback");
  feedback.textContent = message;
  feedback.className = `mine-feedback${error ? " is-error" : ""}`;
  feedback.hidden = false;
  feedback.focus();
}

function editItem(id) {
  let record;
  try { record = readOwnedRecord(id).record; } catch {
    showMineFeedback("无法读取你的发布记录，请检查本地存储或刷新页面后重试。", true);
    return;
  }
  if (!editingId) {
    publishDraft = { type: publishType };
    for (const name of Object.keys(publishFields)) {
      publishDraft[name] = document.getElementById(`publish-${name}`).value;
    }
  }
  editingId = id;
  for (const name of Object.keys(publishFields)) {
    document.getElementById(`publish-${name}`).value = String(record[name] || "");
  }
  setPublishType(record.type === "found" ? "found" : "lost");
  setEditMode(true);
  showView("publish");
  document.getElementById("publish-name").focus();
}

function uniqueId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function setFieldError(name, message) {
  const input = document.getElementById(`publish-${name}`);
  const error = document.getElementById(`error-${name}`);
  error.textContent = message;
  error.hidden = !message;
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

document.querySelectorAll('input[name="publish-type"]').forEach(input => {
  input.addEventListener("change", () => {
    setPublishType(input.value);
  });
});

Object.keys(publishFields).forEach(name => {
  document.getElementById(`publish-${name}`).addEventListener("input", () => {
    setFieldError(name, "");
  });
});

publishForm.addEventListener("submit", event => {
  event.preventDefault();
  publishError.hidden = true;
  const values = {};
  let firstInvalid;
  for (const [name, label] of Object.entries(publishFields)) {
    const input = document.getElementById(`publish-${name}`);
    values[name] = input.value.trim();
    const message = !values[name] ? `请填写${label}` :
      values[name].length > input.maxLength ? `${label}最多填写${input.maxLength}个字符` : "";
    setFieldError(name, message);
    if (message && !firstInvalid) firstInvalid = input;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }
  if (editingId) {
    let updated;
    try {
      updated = updateOwnedRecord(editingId, { ...values, type: publishType });
    } catch {
      publishError.textContent = "修改保存失败，请检查本地存储及发布记录后重试。填写的内容已保留。";
      publishError.hidden = false;
      return;
    }
    leaveEdit();
    openMine();
    showMineFeedback(`“${updated.name}”的修改已保存。`);
    return;
  }
  let item;
  try {
    let ownerId = localStorage.getItem(OWNER_KEY);
    if (!ownerId) {
      ownerId = uniqueId();
      localStorage.setItem(OWNER_KEY, ownerId);
    }
    item = { ...values, id: uniqueId(), type: publishType, status: "active", ownerId, createdAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...readSavedItems(), item]));
  } catch {
    publishError.textContent = "保存失败，请检查浏览器是否允许本地存储后重试。填写的内容已保留。";
    publishError.hidden = false;
    return;
  }
  items.unshift(item);
  renderHome();
  renderSearch();
  document.getElementById("publish-success-message").textContent =
    `你的${publishType === "lost" ? "寻物" : "招领"}信息已经加入校园信息列表。`;
  publishForm.reset();
  setPublishType("lost");
  showView("publish-success");
});

function renderMine() {
  let ownerId;
  try { ownerId = localStorage.getItem(OWNER_KEY); } catch { /* 显示空状态 */ }
  const ownItems = ownerId ? items.filter(item => item.ownerId === ownerId) : [];
  document.getElementById("mine-count").textContent = `${ownItems.length} 条`;
  const list = document.getElementById("mine-list");
  if (!ownItems.length) {
    const empty = makeElement("div", "mine-empty", "");
    const icon = makeElement("span", "mine-empty-icon", "○");
    icon.setAttribute("aria-hidden", "true");
    empty.append(icon,
      makeElement("h3", "", "还没有发布记录"),
      makeElement("p", "", "发布寻物或招领信息后，就能在这里管理状态。"));
    list.replaceChildren(empty);
    return;
  }
  list.replaceChildren(...ownItems.map(item => {
    const entry = makeElement("article", "mine-entry", "");
    entry.append(createCard(item));
    const actions = makeElement("div", "mine-actions", "");
    const edit = makeElement("button", "edit-button", "编辑信息");
    edit.type = "button";
    edit.setAttribute("aria-label", `编辑信息：${item.name || "未命名物品"}`);
    edit.addEventListener("click", () => editItem(item.id));
    const resolved = item.status === "resolved";
    const action = makeElement("button", "resolve-button", resolved ? "撤销完成标记" : item.type === "lost" ? "标记已找到" : "标记已归还");
    action.type = "button";
    action.setAttribute("aria-label", `${action.textContent}：${item.name || "未命名物品"}`);
    action.addEventListener("click", () => resolveItem(item.id, resolved ? "active" : "resolved"));
    actions.append(edit, action);
    entry.append(actions);
    return entry;
  }));
}

function resolveItem(id, status = "resolved") {
  if (status !== "active" && status !== "resolved") return;
  let updated;
  try {
    updated = updateOwnedRecord(id, { status });
  } catch {
    showMineFeedback("状态保存失败，请检查本地存储及发布记录后重试。", true);
    return;
  }
  showMineFeedback(status === "active"
    ? `已撤销“${updated.name || "未命名物品"}”的完成标记，恢复为${statusText(updated)}。`
    : `“${updated.name || "未命名物品"}”已标记为${statusText(updated)}。`);
}

function openMine() {
  document.getElementById("mine-feedback").hidden = true;
  renderMine();
  showView("mine");
}

publishNav.addEventListener("click", () => {
  if (editingId) leaveEdit();
  showView("publish");
});
mineNav.addEventListener("click", openMine);
document.getElementById("publish-back").addEventListener("click", () => {
  if (editingId) { leaveEdit(); openMine(); }
  else showView("home");
});
document.getElementById("edit-cancel").addEventListener("click", () => { leaveEdit(); openMine(); });
document.getElementById("success-home").addEventListener("click", () => showView("home"));
document.getElementById("success-mine").addEventListener("click", openMine);
document.getElementById("mine-back").addEventListener("click", () => showView("home"));

renderHome();
renderSearch();
showView("home");

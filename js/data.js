"use strict";

const STORAGE_KEY = "shiguang_items_v1";
const VIEWS_KEY = "shiguang_views_v1";
const viewCounts = new Map();
try {
  const saved = JSON.parse(localStorage.getItem(VIEWS_KEY) || "[]");
  if (Array.isArray(saved)) saved.forEach(entry => {
    // 兼容旧版每条信息只记录一次的浏览记录。
    if (typeof entry === "string") viewCounts.set(entry, 1);
    else if (Array.isArray(entry) && typeof entry[0] === "string" && Number.isSafeInteger(entry[1]) && entry[1] >= 0) {
      viewCounts.set(entry[0], entry[1]);
    }
  });
} catch { /* 存储不可用时保留本次访问记录 */ }

function viewCount(item) {
  const stored = Number(item.views);
  const base = Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : 0;
  return base + (viewCounts.get(item.id) || 0);
}

function recordView(item) {
  if (typeof item.id !== "string") return;
  viewCounts.set(item.id, (viewCounts.get(item.id) || 0) + 1);
  try { localStorage.setItem(VIEWS_KEY, JSON.stringify([...viewCounts])); }
  catch { /* 不影响查看详情，当前页面仍可按浏览次数排序 */ }
  notifyItemsChanged();
}

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
const items = [...readSavedItems(), ...demoItems]
  .filter(item => item && typeof item === "object")
  .sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
const OWNER_KEY = "shiguang_owner_v1";
const DRAFT_KEY = "shiguang_publish_draft_v1";

function readPublishDraft() {
  const text = localStorage.getItem(DRAFT_KEY);
  if (!text) return null;
  const draft = JSON.parse(text);
  return draft && typeof draft === "object" && !Array.isArray(draft) ? draft : null;
}

function writePublishDraft(draft) {
  if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  else localStorage.removeItem(DRAFT_KEY);
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
  notifyItemsChanged();
  return updated;
}

function notifyItemsChanged() {
  document.dispatchEvent(new CustomEvent("shiguang:datachange"));
}

function deleteOwnedRecord(id) {
  const { saved, record } = readOwnedRecord(id);
  // 先保存成功，再从页面数据移除；失败时原记录仍保留。
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.filter(item => item !== record)));
  const index = items.findIndex(item => item.id === id && item.ownerId === record.ownerId);
  if (index !== -1) items.splice(index, 1);
  viewCounts.delete(id);
  try { localStorage.setItem(VIEWS_KEY, JSON.stringify([...viewCounts])); }
  catch { /* 浏览统计清理失败不影响已经成功删除的发布记录 */ }
  notifyItemsChanged();
  return record;
}

function createItem(values, type) {
  let ownerId = localStorage.getItem(OWNER_KEY);
  if (!ownerId) {
    ownerId = uniqueId();
    localStorage.setItem(OWNER_KEY, ownerId);
  }
  const item = { ...values, id: uniqueId(), type, status: "active", ownerId, createdAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...readSavedItems(), item]));
  items.unshift(item);
  notifyItemsChanged();
  return item;
}

let searchHistory = [];
try {
  const saved = JSON.parse(localStorage.getItem("shiguang_search_history_v1") || "[]");
  if (Array.isArray(saved)) searchHistory = [...new Set(saved.filter(value => typeof value === "string" && value.trim()).map(value => value.trim()))].slice(0, 10);
} catch { /* 无历史记录时显示空状态 */ }

function writeSearchHistory(values) {
  searchHistory = [...values];
  try { localStorage.setItem("shiguang_search_history_v1", JSON.stringify(searchHistory)); }
  catch { /* 存储不可用时仍保留本次页面内的搜索历史 */ }
}

window.ShiguangData = {
  getSearchHistory: () => [...searchHistory],
  addSearchHistory(value) {
    const text = String(value || "").trim();
    if (!text) return;
    writeSearchHistory([text, ...searchHistory.filter(entry => entry.toLocaleLowerCase() !== text.toLocaleLowerCase())].slice(0, 10));
  },
  removeSearchHistory(value) { writeSearchHistory(searchHistory.filter(entry => entry !== value)); },
  clearSearchHistory() { writeSearchHistory([]); },
  readPublishDraft, writePublishDraft,
  getItems: () => items.map(item => ({ ...item, images: [...itemPhotos(item)] })),
  getOwnerId: () => localStorage.getItem(OWNER_KEY),
  readOwnedRecord, createItem, updateItem: updateOwnedRecord, deleteItem: deleteOwnedRecord,
  updateStatus(id, status) {
    if (!["active", "resolved"].includes(status)) throw new Error("无效状态");
    return updateOwnedRecord(id, { status });
  },
  recordView, viewCount
};

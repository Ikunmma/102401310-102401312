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
  return text.length >= 16 ? text.slice(5, 16) : text;
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

const dialog = document.getElementById("detail-dialog");
const contactButton = document.getElementById("reveal-contact");
const contactText = document.getElementById("detail-contact");

function openDetail(item) {
  document.getElementById("detail-title").textContent = item.name;
  const fields = document.getElementById("detail-fields");
  fields.replaceChildren();

  const rows = [
    ["分类", item.category],
    ["时间", String(item.eventTime || "").replace("T", " ")],
    ["地点", item.location],
    ["特征", item.description],
    ["状态", statusText(item)]
  ];

  for (const [label, value] of rows) {
    const row = document.createElement("div");
    row.append(
      makeElement("span", "", label),
      makeElement("strong", "", String(value || "未填写"))
    );
    fields.append(row);
  }

  contactText.textContent = `联系途径：${item.contact || "未提供"}`;
  contactText.hidden = true;
  contactButton.hidden = false;
  dialog.showModal();
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
    ),
    makeElement("span", "card-more", "查看详情 ›")
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

const items = [...readSavedItems(), ...demoItems]
  .filter(item => item && typeof item === "object")
  .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

document.getElementById("item-list").replaceChildren(
  ...items.slice(0, 3).map(createCard)
);
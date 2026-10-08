"use strict";

// 名称匹配与分类匹配均为线索，不代表确认是同一件物品。
function findSimilarItems(source, values, excludedId = null) {
  const normalize = value => String(value || "").toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
  const name = normalize(values.name);
  const category = String(values.category || "").trim();
  if (name.length < 2 && !category) return [];
  const pairs = value => new Set(Array.from({ length: Math.max(0, value.length - 1) }, (_, i) => value.slice(i, i + 2)));
  const namePairs = pairs(name);
  return source.filter(item => item.id !== excludedId && item.status !== "resolved")
    .map(item => {
      const candidate = normalize(item.name);
      const sameCategory = Boolean(category && item.category === category);
      let score = 0;
      if (name.length >= 2 && candidate) {
        if (candidate === name) score = 100;
        else if (candidate.includes(name) || (candidate.length >= 2 && name.includes(candidate))) score = 70;
        else {
          const candidatePairs = pairs(candidate);
          const common = [...namePairs].filter(pair => candidatePairs.has(pair)).length;
          const overlap = 2 * common / (namePairs.size + candidatePairs.size || 1);
          if (overlap >= 0.5) score = Math.round(overlap * 50);
        }
      }
      if (sameCategory) score += 20;
      return { item, score, opposite: item.type !== values.type };
    }).filter(entry => entry.score > 0)
    .sort((a, b) => Number(b.opposite) - Number(a.opposite) || b.score - a.score ||
      (Date.parse(b.item.createdAt) || 0) - (Date.parse(a.item.createdAt) || 0))
    .slice(0, 3).map(entry => entry.item);
}

function renderSimilarItems() {
  const panel = document.getElementById("similar-panel");
  const matches = editingId ? [] : findSimilarItems(ShiguangData.getItems(), {
    name: document.getElementById("publish-name").value,
    category: document.getElementById("publish-category").value,
    type: publishType
  });
  panel.hidden = !matches.length;
  document.getElementById("similar-list").replaceChildren(...matches.map(item => {
    const button = makeElement("button", "similar-item", "");
    button.type = "button";
    const title = makeElement("span", "similar-title", "");
    title.append(makeElement("span", `card-type ${item.type === "lost" ? "lost" : "found"}`, item.type === "lost" ? "寻物" : "招领"),
      makeElement("strong", "", item.name || "未命名物品"));
    button.append(title, makeElement("span", "similar-meta", `${item.location || "地点未填写"} · ${displayTime(item.eventTime)}`),
      makeElement("span", "similar-link", "查看详情 →"));
    button.addEventListener("click", () => openDetail(item));
    return button;
  }));
}

document.getElementById("publish-name").addEventListener("input", renderSimilarItems);
document.getElementById("publish-category").addEventListener("change", renderSimilarItems);
document.addEventListener("shiguang:datachange", renderSimilarItems);

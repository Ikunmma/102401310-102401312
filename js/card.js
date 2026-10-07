"use strict";

function createCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "item-card";
  const cover = itemPhotos(item)[0];
  if (cover) card.append(photoImage(cover, "", "card-photo"));
  else card.append(createPhotoPlaceholder(item.category));

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
    ),
    createViewBadge(item)
  );
  card.addEventListener("click", () => openDetail(item));
  return card;
}

function createViewBadge(item) {
  const badge = makeElement("span", "card-views", "");
  badge.setAttribute("aria-label", `浏览 ${ShiguangData.viewCount(item)} 次`);
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.7");
  icon.setAttribute("aria-hidden", "true");
  const outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
  outline.setAttribute("d", "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z");
  const pupil = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  pupil.setAttribute("cx", "12");
  pupil.setAttribute("cy", "12");
  pupil.setAttribute("r", "3");
  icon.append(outline, pupil);
  badge.append(icon, makeElement("span", "", String(ShiguangData.viewCount(item))));
  return badge;
}

function createPhotoPlaceholder(category) {
  const placeholder = makeElement("span", "card-photo card-photo-placeholder", "");
  placeholder.setAttribute("aria-hidden", "true");
  const paths = {
    "证件卡片": ["M4 5h16v14H4z", "M8 9h3v3H8z", "M14 9h3M14 12h3M8 16h9"],
    "钥匙": ["M14 10a4 4 0 1 0 0 .1", "M11 13 4 20H2v-3l7-7", "M5 16l3 3"],
    "电子设备": ["M7 2h10v20H7z", "M10 18h4"],
    "书籍文具": ["M12 5v16", "M12 5C8 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-2-1-6-2-10 1z"],
    "衣物配饰": ["m8 3-6 5 4 4 2-2v11h8V10l2 2 4-4-6-5c0 4-8 4-8 0z"],
    "生活用品": ["M3 12a9 9 0 0 1 18 0H3z", "M12 12v7a2 2 0 0 0 4 0"]
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  for (const d of paths[category] || ["m3 7 9-5 9 5v10l-9 5-9-5z", "m3 7 9 5 9-5M12 12v10"]) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  placeholder.append(svg);
  return placeholder;
}

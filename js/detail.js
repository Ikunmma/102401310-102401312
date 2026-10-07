"use strict";

const contactButton = document.getElementById("copy-contact");
const contactText = document.getElementById("detail-contact");
const copyFeedback = document.getElementById("copy-contact-feedback");
let currentContact = "";
let contactVersion = 0;

function openDetail(item) {
  ShiguangData.recordView(item);
  const isLost = item.type === "lost";
  const gallery = document.getElementById("detail-photos");
  const photos = itemPhotos(item);
  gallery.hidden = !photos.length;
  gallery.replaceChildren(...photos.map((source, index) => {
    const button = makeElement("button", "detail-photo", "");
    button.type = "button";
    button.setAttribute("aria-label", `放大第${index + 1}张物品照片`);
    button.append(photoImage(source, `物品照片${index + 1}`));
    button.addEventListener("click", () => {
      document.getElementById("photo-full").src = source;
      document.getElementById("photo-dialog").showModal();
    });
    return button;
  }));

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
    [isLost ? "丢失地点" : "拾取地点", item.region
      ? `${regionNames[item.region] || "其他区域"} · ${item.location || "未填写"}` : item.location],
    [isLost ? "丢失时间" : "拾取时间",
      displayTime(item.eventTime)]
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

  currentContact = String(item.contact || "").trim();
  contactVersion += 1;
  contactText.textContent = currentContact
    ? `${item.contactMethod ? item.contactMethod + "：" : ""}${currentContact}` : "未提供联系方式";
  contactButton.disabled = !currentContact;
  copyFeedback.hidden = true;

  previousView = currentView;
  showView("detail");
}
contactButton.addEventListener("click", async () => {
  if (!currentContact) return;
  const version = contactVersion;
  contactButton.disabled = true;
  const copied = await copyContact(currentContact);
  if (version !== contactVersion) return;
  contactButton.disabled = false;
  copyFeedback.textContent = copied ? "联系方式已复制" : "复制失败，请选中联系方式后按 Ctrl + C 复制。";
  copyFeedback.hidden = false;
});

document.getElementById("photo-close").addEventListener("click", () => document.getElementById("photo-dialog").close());
document.getElementById("detail-back").addEventListener("click", () => {
  showView(previousView);
});

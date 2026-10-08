"use strict";

const publishForm = document.getElementById("publish-form");
const publishError = document.getElementById("publish-error");
const publishFields = {
  name: "物品名称", category: "物品分类", eventTime: "时间",
  region: "所在区域", location: "地点", description: "外观特征",
  contactMethod: "联系渠道", contact: "联系方式"
};
let publishType = "lost";
let editingId = null;
let publishDraft = null;
let publishImages = [];
let photosBusy = false;
let draftTimer;
const draftFeedback = makeElement("p", "mine-feedback", "");
draftFeedback.hidden = true;
draftFeedback.setAttribute("role", "status");
publishForm.prepend(draftFeedback);

function savePublishDraft() {
  clearTimeout(draftTimer);
  if (editingId) return;
  const draft = { type: publishType, images: [...publishImages] };
  for (const name of Object.keys(publishFields)) draft[name] = document.getElementById(`publish-${name}`).value;
  const hasContent = draft.images.length || Object.keys(publishFields).some(name => draft[name].trim());
  try {
    ShiguangData.writePublishDraft(hasContent ? draft : null);
    draftFeedback.hidden = true;
  } catch {
    draftFeedback.textContent = "草稿保存失败，本地存储可能已满或不可用，请勿关闭页面。";
    draftFeedback.hidden = false;
  }
}

function restorePublishDraft() {
  let draft;
  try { draft = ShiguangData.readPublishDraft(); }
  catch {
    draftFeedback.textContent = "无法读取本地草稿，请检查浏览器存储。";
    draftFeedback.hidden = false;
    return;
  }
  if (!draft) return;
  for (const name of Object.keys(publishFields)) {
    const value = typeof draft[name] === "string" ? draft[name] : "";
    const input = document.getElementById(`publish-${name}`);
    input.value = input.maxLength > 0 ? value.slice(0, input.maxLength) : value;
  }
  publishImages = itemPhotos(draft);
  setPublishType(draft.type === "found" ? "found" : "lost");
  renderPhotoPreviews();
}

publishForm.addEventListener("input", () => {
  if (editingId) return;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(savePublishDraft, 400);
});
publishForm.addEventListener("change", () => savePublishDraft());
window.addEventListener("pagehide", savePublishDraft);
function renderPhotoPreviews() {
  document.getElementById("photo-previews").replaceChildren(...publishImages.map((source, index) => {
    const preview = makeElement("div", "photo-preview", "");
    const remove = makeElement("button", "photo-remove", "移除");
    remove.type = "button";
    remove.disabled = photosBusy;
    remove.setAttribute("aria-label", `移除第${index + 1}张照片`);
    remove.addEventListener("click", () => { publishImages.splice(index, 1); renderPhotoPreviews(); savePublishDraft(); });
    preview.append(photoImage(source, `物品照片${index + 1}`), remove);
    return preview;
  }));
  document.querySelector(".photo-upload").hidden = publishImages.length >= 3;
}

async function compressPhoto(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("请选择 JPG、PNG 或 WebP 图片。");
  if (file.size > 10 * 1024 * 1024) throw new Error("每张照片不能超过10MB。");
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error();
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compressed = canvas.toDataURL("image/jpeg", 0.75);
    if (compressed.length > 700000) throw new Error("照片压缩后仍过大，请选择更小的图片。");
    return compressed;
  } finally { URL.revokeObjectURL(source); }
}

document.getElementById("publish-images").addEventListener("change", async event => {
  if (photosBusy) return;
  const files = [...event.target.files];
  event.target.value = "";
  const feedback = document.getElementById("photo-feedback");
  if (!files.length) return;
  feedback.hidden = false;
  if (files.length + publishImages.length > 3) {
    feedback.textContent = "最多上传3张照片，请重新选择。";
    return;
  }
  photosBusy = true;
  event.target.disabled = true;
  document.getElementById("publish-submit").disabled = true;
  feedback.textContent = "正在处理照片……";
  renderPhotoPreviews();
  try {
    const added = [];
    for (const file of files) added.push(await compressPhoto(file));
    publishImages.push(...added);
    savePublishDraft();
    feedback.hidden = true;
  } catch (error) {
    feedback.textContent = error.message || "图片无法读取，请重新选择。";
  } finally {
    photosBusy = false;
    event.target.disabled = false;
    document.getElementById("publish-submit").disabled = false;
    renderPhotoPreviews();
  }
});
document.addEventListener("click", event => {
  if (photosBusy && event.target.closest("button, .publish-types")) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

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
  if (photosBusy) return;
  editingId = null;
  publishForm.reset();
  for (const name of Object.keys(publishFields)) {
    document.getElementById(`publish-${name}`).value = publishDraft?.[name] || "";
  }
  setPublishType(publishDraft?.type || "lost");
  publishImages = [...(publishDraft?.images || [])];
  renderPhotoPreviews();
  document.getElementById("photo-feedback").hidden = true;
  publishDraft = null;
  setEditMode(false);
}
function editItem(id) {
  if (photosBusy) { showMineFeedback("照片正在处理，请稍后再编辑。", true); return; }
  let record;
  try { record = ShiguangData.readOwnedRecord(id).record; } catch {
    showMineFeedback("无法读取你的发布记录，请检查本地存储或刷新页面后重试。", true);
    return;
  }
  if (!editingId) {
    savePublishDraft();
    publishDraft = { type: publishType, images: [...publishImages] };
    for (const name of Object.keys(publishFields)) {
      publishDraft[name] = document.getElementById(`publish-${name}`).value;
    }
  }
  editingId = id;
  publishImages = itemPhotos(record);
  renderPhotoPreviews();
  document.getElementById("photo-feedback").hidden = true;
  for (const name of Object.keys(publishFields)) {
    const value = String(record[name] || "");
    document.getElementById(`publish-${name}`).value = name === "eventTime"
      ? value.replace(/^(\d{4}-\d{2}-\d{2}) /, "$1T") : value;
  }
  setPublishType(record.type === "found" ? "found" : "lost");
  setEditMode(true);
  if (!document.getElementById("publish-eventTime").value) {
    setFieldError("eventTime", `原记录时间为“${record.eventTime || "未填写"}”，请重新选择日期和时间。`);
  }
  showView("publish");
  document.getElementById("publish-name").focus();
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
  if (photosBusy) return;
  publishError.hidden = true;
  const values = {};
  let firstInvalid;
  for (const [name, label] of Object.entries(publishFields)) {
    const input = document.getElementById(`publish-${name}`);
    values[name] = input.value.trim();
    const message = !values[name] ? `请填写${label}` :
      name === "eventTime" && !input.validity.valid ? "请选择有效的日期和时间" :
      input.maxLength > 0 && values[name].length > input.maxLength ? `${label}最多填写${input.maxLength}个字符` : "";
    setFieldError(name, message);
    if (message && !firstInvalid) firstInvalid = input;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }
  values.images = [...publishImages];
  if (editingId) {
    let updated;
    try {
      updated = ShiguangData.updateItem(editingId, { ...values, type: publishType });
    } catch {
      publishError.textContent = "修改保存失败，本地存储可能已满，请减少照片后重试。填写的内容已保留。";
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
    item = ShiguangData.createItem(values, publishType);
  } catch {
    publishError.textContent = "保存失败，本地存储可能已满或不可用，请减少照片后重试。填写的内容已保留。";
    publishError.hidden = false;
    return;
  }
  document.getElementById("publish-success-message").textContent =
    `你的${publishType === "lost" ? "寻物" : "招领"}信息已经加入校园信息列表。`;
  publishForm.reset();
  publishImages = [];
  renderPhotoPreviews();
  document.getElementById("photo-feedback").hidden = true;
  setPublishType("lost");
  savePublishDraft();
  showView("publish-success");
});
document.getElementById("publish-back").addEventListener("click", () => {
  if (editingId) { leaveEdit(); openMine(); }
  else showView("home");
});
document.getElementById("edit-cancel").addEventListener("click", () => { leaveEdit(); openMine(); });
document.getElementById("success-home").addEventListener("click", () => showView("home"));
document.getElementById("success-mine").addEventListener("click", () => openMine());

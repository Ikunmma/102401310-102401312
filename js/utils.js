"use strict";

function statusText(item) {
  if (item.status === "resolved") {
    return item.type === "lost" ? "已找到" : "已归还";
  }
  return item.type === "lost" ? "寻找中" : "等待认领";
}

function displayTime(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(text)
    ? text.slice(0, 16).replace("T", " ") : text || "时间未填写";
}

function displayPublishedTime(value) {
  const text = String(value || "");
  if (/Z$/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      const pad = number => String(number).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
  }
  return displayTime(text);
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}
async function copyContact(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch { /* 直接打开 HTML 或权限受限时使用备用方式 */ }
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;left:-9999px;top:0";
  const previousFocus = document.activeElement;
  document.body.append(field);
  try {
    field.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
    previousFocus?.focus();
  }
}
function itemPhotos(item) {
  return Array.isArray(item.images) ? item.images.filter(source =>
    typeof source === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(source)
  ).slice(0, 3) : [];
}

function photoImage(source, alt, className = "") {
  const image = document.createElement("img");
  image.src = source;
  image.alt = alt;
  image.className = className;
  return image;
}
function uniqueId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

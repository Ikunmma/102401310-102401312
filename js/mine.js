"use strict";

function showMineFeedback(message, error = false) {
  const feedback = document.getElementById("mine-feedback");
  feedback.textContent = message;
  feedback.className = `mine-feedback${error ? " is-error" : ""}`;
  feedback.hidden = false;
  feedback.focus();
}
let mineStatus = "all";

function setMineStatus(status) {
  mineStatus = status;
  document.querySelectorAll("[data-mine-status]").forEach(button => {
    const active = button.dataset.mineStatus === status;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.getElementById("mine-feedback").hidden = true;
  renderMine();
}

document.querySelectorAll("[data-mine-status]").forEach(button => {
  button.addEventListener("click", () => setMineStatus(button.dataset.mineStatus));
});

function renderMine() {
  let ownerId;
  try { ownerId = ShiguangData.getOwnerId(); } catch { /* 显示空状态 */ }
  const ownItems = ownerId ? ShiguangData.getItems().filter(item => item.ownerId === ownerId) : [];
  const resolvedCount = ownItems.filter(item => item.status === "resolved").length;
  document.getElementById("mine-all-count").textContent = ownItems.length;
  document.getElementById("mine-active-count").textContent = ownItems.length - resolvedCount;
  document.getElementById("mine-resolved-count").textContent = resolvedCount;
  const visibleItems = ownItems.filter(item => mineStatus === "all" ||
    (mineStatus === "resolved" ? item.status === "resolved" : item.status !== "resolved"));
  document.getElementById("mine-count").textContent = mineStatus === "all"
    ? `${ownItems.length} 条`
    : `${visibleItems.length} 条 / 共 ${ownItems.length} 条`;
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
  if (!visibleItems.length) {
    const empty = makeElement("div", "mine-empty", "");
    const reset = makeElement("button", "empty-reset", "查看全部发布");
    reset.type = "button";
    reset.addEventListener("click", () => setMineStatus("all"));
    empty.append(
      makeElement("h3", "", mineStatus === "resolved" ? "暂无已完成的发布" : "暂无处理中的发布"),
      makeElement("p", "", "可以切换状态筛选，查看其他发布记录。"), reset);
    list.replaceChildren(empty);
    return;
  }
  list.replaceChildren(...visibleItems.map(item => {
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
    updated = ShiguangData.updateStatus(id, status);
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

document.getElementById("mine-back").addEventListener("click", () => showView("home"));

"use strict";

const homeList = document.getElementById("item-list");

function renderHome() {
  const latest = filterItems(ShiguangData.getItems(), "", "all").slice(0, 3);
  homeList.replaceChildren(...(latest.length
    ? latest.map(createCard)
    : [makeElement("p", "empty-result", "暂无待处理信息，发布寻物或招领信息吧。") ]));
}
document.querySelectorAll("[data-publish-type]").forEach(button => {
  button.addEventListener("click", () => {
    if (editingId) leaveEdit();
    setEditMode(false);
    setPublishType(button.dataset.publishType);
    showView("publish");
    document.getElementById("publish-name").focus();
  });
});

document.getElementById("home-view-all").addEventListener("click", () => {
  openSearchWithType("all");
});

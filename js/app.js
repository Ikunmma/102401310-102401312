"use strict";

const homeNav = document.getElementById("home-nav");
const searchNav = document.getElementById("search-nav");
const publishNav = document.getElementById("publish-nav");
const mineNav = document.getElementById("mine-nav");

let previousView = "home";
let currentView = "home";

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

homeNav.addEventListener("click", () => showView("home"));
searchNav.addEventListener("click", () => showView("search"));
publishNav.addEventListener("click", () => {
  if (editingId) leaveEdit();
  showView("publish");
});
mineNav.addEventListener("click", openMine);

document.addEventListener("shiguang:datachange", () => { renderHome(); renderSearch(); renderMine(); });

renderHome();
renderSearch();
showView("home");

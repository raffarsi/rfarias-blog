document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  initNav();
  RENDERERS.login();
  if (STATE.currentStudent && STATE.students[STATE.currentStudent]) {
    enterApp();
  } else {
    showScreen("login");
  }
});

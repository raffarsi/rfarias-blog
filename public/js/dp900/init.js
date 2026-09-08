// Override: skip landing/azurehub screens, go straight to login or dashboard
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  initNav();
  RENDERERS.login();

  // If student already identified, go to dashboard
  if (STATE.currentStudent && STATE.students[STATE.currentStudent]) {
    enterApp();
  } else {
    showScreen("login");
  }
});

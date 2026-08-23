// Dashboard Toggle Function - Add this inline in index.html after the dashboard HTML
// Find this section in index.html and add the function before the closing script tag:

/*
// ===== DASHBOARD TOGGLE FUNCTION =====
// Add this immediately after the dashboard panel HTML in index.html

function handleDashboardToggle() {
  const dashboard = document.getElementById('dashboard');
  if (dashboard) {
    dashboard.classList.toggle('hidden');
    console.log('Dashboard toggled');
  }
}

// ===== INITIALIZE DASHBOARD =====
// Call this after game initialization:

function initDashboard() {
  // Add event listeners
  const dashboardToggle = document.getElementById('dashboardToggle');
  if (dashboardToggle) {
    dashboardToggle.addEventListener('click', handleDashboardToggle);
    console.log('Dashboard toggle initialized');
  }

  // Update dashboard stats periodically
  setInterval(async () => {
    const stats = await window.CrazyTukGame?.getDashboardStats();
    const swaps = await window.CrazyTukGame?.getTransactionHistory();
    const leaderboard = await window.CrazyTukGame?.getLeaderboard(10);

    if (stats && swaps && leaderboard) {
      window.CrazyTukGame?.updateDashboard(stats, swaps, leaderboard);
    }
  }, 5000); // Update every 5 seconds

  console.log('Dashboard initialized');
}
*/
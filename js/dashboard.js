// Crazy Tuk Dashboard UI
// Main dashboard for game management and statistics

/**
 * Dashboard Stats
 */
export const DashboardStats = {
  /**
   * Get current game statistics
   * @returns {Promise<StatsOverview>}
   */
  async getStats() {
    try {
      const player = window.CrazyTukGame?.getPlayer();
      const walletStats = window.CrazyTukGame?.getSwapStatistics?.(null);

      if (!player) {
        throw new Error('No player data available');
      }

      // Calculate completed fares today
      const completedFaresToday = this.getFaresCompletedToday(player);

      return {
        player: {
          name: player.name || 'anon',
          points: player.points || 0,
          fuel: Math.floor(player.fuel || 20),
          completedFares: player.completedFares || 0,
          stallCount: player.stallCount || 0,
          fuelEarned: player.fuelEarned || 0
        },
        swaps: walletStats || {
          totalSwaps: 0,
          completedSwaps: 0,
          totalUsdValue: 0,
          totalFuel: 0,
          averageSwapValue: 0,
          averageFuelPerSwap: 0
        },
        completedFaresToday: completedFaresToday,
        totalSwaps: (walletStats?.totalSwaps || 0),
        totalUsdValue: (walletStats?.totalUsdValue || 0),
        fuelEarned: (walletStats?.totalFuel || 0)
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return this.getEmptyStats();
    }
  },

  /**
   * Get fares completed today
   * @param {object} player - Player data
   * @returns {number} Fares completed today
   */
  getFaresCompletedToday(player) {
    if (!player.completedFares || !player.completedFaresHistory) {
      return 0;
    }

    const today = new Date().toDateString();
    return player.completedFaresHistory.filter(fare => {
      if (!fare.completedAt) return false;
      return new Date(fare.completedAt).toDateString() === today;
    }).length;
  },

  /**
   * Get empty stats object
   * @returns {object} Empty stats
   */
  getEmptyStats() {
    return {
      player: {
        name: 'anon',
        points: 0,
        fuel: 20,
        completedFares: 0,
        stallCount: 0,
        fuelEarned: 0
      },
      swaps: {
        totalSwaps: 0,
        completedSwaps: 0,
        totalUsdValue: 0,
        totalFuel: 0,
        averageSwapValue: 0,
        averageFuelPerSwap: 0
      },
      completedFaresToday: 0,
      totalSwaps: 0,
      totalUsdValue: 0,
      fuelEarned: 0
    };
  }
};

/**
 * Transaction History
 */
export const TransactionHistory = {
  /**
   * Get swap history with fallback
   * @returns {Promise<TransactionList>}
   */
  async getHistory() {
    try {
      const wallet = window.CrazyTukGame?.getWalletPublicKey?.();

      if (!wallet) {
        throw new Error('Wallet not connected');
      }

      const history = await window.CrazyTukGame?.getSwapHistoryWithFallback?.(wallet);

      if (!history) {
        throw new Error('Failed to get swap history');
      }

      return {
        swaps: this.formatHistory(history.history),
        source: history.source,
        total: history.history.length
      };
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return {
        swaps: [],
        source: 'ERROR',
        total: 0
      };
    }
  },

  /**
   * Format history for display
   * @param {Array} history - Raw swap history
   * @returns {Array} Formatted swap list
   */
  formatHistory(history) {
    return history.map(swap => ({
      id: swap.id,
      inputMint: swap.inputMint,
      outputMint: swap.outputMint,
      usdValue: swap.usdValue || 0,
      fuelAwarded: swap.fuelAwarded || 0,
      state: swap.state || 'PENDING',
      timestamp: swap.timestamp || Date.now(),
      createdAt: swap.createdAt || new Date().toISOString()
    })).sort((a, b) => b.timestamp - a.timestamp);
  }
};

/**
 * Leaderboard Display
 */
export const LeaderboardDisplay = {
  /**
   * Get leaderboard with current player
   * @param {number} limit - Max results
   * @returns {Promise<LeaderboardData>}
   */
  async getLeaderboard(limit = 10) {
    try {
      const leaderboard = window.CrazyTukGame?.getTopPlayers?.(limit);

      if (!leaderboard) {
        throw new Error('Leaderboard data not available');
      }

      const player = window.CrazyTukGame?.getPlayer?.();

      // Add current player to leaderboard
      if (player) {
        leaderboard.unshift({
          name: player.name || 'anon',
          points: player.points || 0,
          isCurrentUser: true
        });
      }

      return {
        leaderboard: leaderboard,
        currentUserRank: this.getCurrentUserRank(leaderboard, player)
      };
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return {
        leaderboard: [],
        currentUserRank: null
      };
    }
  },

  /**
   * Get current user rank
   * @param {Array} leaderboard - Leaderboard data
   * @param {object} player - Current player
   * @returns {number|null} User rank or null
   */
  getCurrentUserRank(leaderboard, player) {
    if (!leaderboard || !player) return null;

    const playerEntry = leaderboard.find(entry =>
      (entry.name || 'anon') === (player.name || 'anon')
    );

    if (playerEntry) {
      return leaderboard.indexOf(playerEntry) + 1;
    }

    return null;
  }
};

/**
 * Settings Panel
 */
export const SettingsPanel = {
  /**
   * Get current settings
   * @returns {object} Settings
   */
  getSettings() {
    return {
      soundEnabled: localStorage.getItem('crazytuk_sound_enabled') !== 'false',
      musicEnabled: localStorage.getItem('crazytuk_music_enabled') === 'true',
      vibrationEnabled: localStorage.getItem('crazytuk_vibration_enabled') !== 'false',
      notificationsEnabled: localStorage.getItem('crazytuk_notifications_enabled') !== 'false',
      swapNotifications: localStorage.getItem('crazytuk_swap_notifications') !== 'false',
      fuelWarnings: localStorage.getItem('crazytuk_fuel_warnings') !== 'false'
    };
  },

  /**
   * Update setting
   * @param {string} key - Setting key
   * @param {boolean} value - Setting value
   */
  updateSetting(key, value) {
    try {
      localStorage.setItem(`crazytuk_${key}`, value);
      console.log(`Setting updated: ${key} = ${value}`);
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  },

  /**
   * Reset all settings to defaults
   */
  resetSettings() {
    try {
      const defaultSettings = {
        soundEnabled: true,
        musicEnabled: false,
        vibrationEnabled: true,
        notificationsEnabled: true,
        swapNotifications: true,
        fuelWarnings: true
      };

      Object.entries(defaultSettings).forEach(([key, value]) => {
        localStorage.setItem(`crazytuk_${key}`, value);
      });

      console.log('Settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  }
};

/**
 * Help Panel
 */
export const HelpPanel = {
  /**
   * Get help content
   * @returns {object} Help content
   */
  getHelpContent() {
    return {
      overview: `
        Welcome to Crazy Tuk! 🛺
        Load up your tuk-tuk, connect your wallet, and cruise through Bangkok's traffic to earn points.
      `,
      howToPlay: [
        {
          title: '💰 Connect Your Wallet',
          content: 'Click the "Connect Wallet" button and choose Phantom, Solflare, or Coinbase Wallet.'
        },
        {
          title: '🛵 Accept Fares',
          content: 'Click on NPCs on the map to see fare details and select one to work on.'
        },
        {
          title: '⚡ Do Swaps',
          content: 'Complete swaps to earn fuel. More expensive swaps = more fuel!'
        },
        {
          title: '🛣️ Drive to Destination',
          content: 'Drive your tuk-tuk to the pickup location. Avoid stalling by running out of fuel!'
        },
        {
          title: '🎯 Complete Fares',
          content: 'Arrive at the destination, and you\'ll earn points and complete the fare.'
        }
      ],
      faq: [
        {
          question: 'What fuels do I need?',
          answer: 'Fuel is required to drive between fare locations. You earn fuel by completing swaps.'
        },
        {
          question: 'How do swaps work?',
          answer: 'Swaps are automated trades between SOL and USDC on DFlow. The swap value determines how much fuel you earn.'
        },
        {
          question: 'What happens if I stall?',
          answer: 'If you run out of fuel during a trip, you\'ll stall. Complete additional swaps to refuel and continue!'
        },
        {
          question: 'How are points calculated?',
          answer: 'Points are based on fare difficulty and swap value. More valuable swaps = more points!'
        }
      ]
    };
  }
};

/**
 * Notification System
 */
export const Notifications = {
  /**
   * Show notification
   * @param {string} message - Message to display
   * @param {string} type - Notification type (info, success, error)
   */
  show(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2000;
      padding: 12px 24px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-size: 14px;
      font-weight: 500;
    `;

    if (type === 'error') {
      notification.style.borderColor = 'var(--danger)';
    } else if (type === 'success') {
      notification.style.borderColor = 'var(--good)';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('notification-hidden');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  /**
   * Hide notification
   * @param {HTMLElement} notification - Notification element
   */
  hide(notification) {
    if (notification) {
      notification.classList.add('notification-hidden');
      setTimeout(() => notification.remove(), 300);
    }
  }
};

/**
 * Dashboard UI Manager
 */
export const DashboardUI = {
  /**
   * Create dashboard HTML
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement} Dashboard element
   */
  createDashboard(container) {
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard';
    dashboard.innerHTML = `
      <div class="dashboard-header">
        <h2>Dashboard</h2>
        <button class="dashboard-close">✕</button>
      </div>

      <div class="dashboard-content">
        <!-- Stats Section -->
        <section class="dashboard-section">
          <h3>📊 Stats</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Points</span>
              <span class="stat-value" id="stat-points">0</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Fuel</span>
              <span class="stat-value" id="stat-fuel">20</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Completed Fares</span>
              <span class="stat-value" id="stat-completed">0</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Today\'s Fares</span>
              <span class="stat-value" id="stat-today">0</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Total Swaps</span>
              <span class="stat-value" id="stat-swaps">0</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Fuel Earned</span>
              <span class="stat-value" id="stat-fuel-earned">0</span>
            </div>
          </div>
        </section>

        <!-- Transaction History -->
        <section class="dashboard-section">
          <h3>💰 Transaction History</h3>
          <div class="transaction-list" id="transaction-list">
            <div class="empty-state">No transactions yet</div>
          </div>
        </section>

        <!-- Leaderboard -->
        <section class="dashboard-section">
          <h3>🏆 Leaderboard</h3>
          <div class="leaderboard-list" id="leaderboard-list">
            <div class="empty-state">Loading leaderboard...</div>
          </div>
        </section>

        <!-- Navigation -->
        <div class="dashboard-nav">
          <button class="nav-btn primary" id="nav-dashboard">
            <span>📊</span> Dashboard
          </button>
          <button class="nav-btn" id="nav-settings">
            <span>⚙</span> Settings
          </button>
          <button class="nav-btn" id="nav-help">
            <span>📖</span> Help
          </button>
        </div>
      </div>

      <!-- Settings Panel -->
      <section class="dashboard-panel" id="settings-panel">
        <h3>⚙️ Settings</h3>
        <div class="settings-list">
          <div class="setting-item">
            <span>Sound Enabled</span>
            <label class="toggle-switch">
              <input type="checkbox" id="setting-sound" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span>Music Enabled</span>
            <label class="toggle-switch">
              <input type="checkbox" id="setting-music">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span>Vibration</span>
            <label class="toggle-switch">
              <input type="checkbox" id="setting-vibration" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span>Notifications</span>
            <label class="toggle-switch">
              <input type="checkbox" id="setting-notifications" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span>Fuel Warnings</span>
            <label class="toggle-switch">
              <input type="checkbox" id="setting-fuel-warnings" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <button class="reset-settings" id="reset-settings">Reset All Settings</button>
        </div>
      </section>

      <!-- Help Panel -->
      <section class="dashboard-panel" id="help-panel">
        <h3>📖 How to Play</h3>
        <div class="help-content" id="help-content"></div>
        <button class="close-help">Close</button>
      </section>
    `;

    container.appendChild(dashboard);
    return dashboard;
  },

  /**
   * Update stats display
   * @param {object} stats - Stats data
   */
  updateStats(stats) {
    const elements = {
      points: document.getElementById('stat-points'),
      fuel: document.getElementById('stat-fuel'),
      completed: document.getElementById('stat-completed'),
      today: document.getElementById('stat-today'),
      swaps: document.getElementById('stat-swaps'),
      fuelEarned: document.getElementById('stat-fuel-earned')
    };

    Object.entries(elements).forEach(([key, element]) => {
      if (element) {
        element.textContent = stats[key] || 0;
      }
    });
  },

  /**
   * Update transaction history
   * @param {Array} swaps - Swap history
   */
  updateTransactions(swaps) {
    const container = document.getElementById('transaction-list');

    if (!container) return;

    if (swaps.length === 0) {
      container.innerHTML = '<div class="empty-state">No transactions yet</div>';
      return;
    }

    container.innerHTML = swaps.map(swap => `
      <div class="transaction-item">
        <div class="transaction-header">
          <span class="transaction-from">⚡ ${swap.inputMint}</span>
          <span class="transaction-arrow">→</span>
          <span class="transaction-to">💰 ${swap.outputMint}</span>
        </div>
        <div class="transaction-details">
          <span class="transaction-value">Value: $${swap.usdValue.toFixed(2)}</span>
          <span class="transaction-fuel">Fuel: +${swap.fuelAwarded}</span>
          <span class="transaction-status ${swap.state.toLowerCase()}">${swap.state}</span>
        </div>
        <span class="transaction-time">${this.formatTime(swap.createdAt)}</span>
      </div>
    `).join('');
  },

  /**
   * Format time for display
   * @param {string} timestamp - Timestamp
   * @returns {string} Formatted time
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  },

  /**
   * Update leaderboard
   * @param {Array} leaderboard - Leaderboard data
   */
  updateLeaderboard(leaderboard) {
    const container = document.getElementById('leaderboard-list');

    if (!container) return;

    if (leaderboard.length === 0) {
      container.innerHTML = '<div class="empty-state">No leaderboard data</div>';
      return;
    }

    container.innerHTML = leaderboard.map((entry, index) => `
      <div class="leaderboard-item ${entry.isCurrentUser ? 'current-user' : ''}">
        <span class="leaderboard-rank">${index + 1}</span>
        <span class="leaderboard-name">${entry.name}</span>
        <span class="leaderboard-points">${entry.points}</span>
      </div>
    `).join('');
  },

  /**
   * Toggle dashboard panels
   */
  togglePanel(panelId) {
    const panels = ['settings-panel', 'help-panel'];
    panels.forEach(panelId => {
      const panel = document.getElementById(panelId);
      if (panel) {
        if (panel.id === panelId) {
          panel.classList.toggle('hidden');
        } else {
          panel.classList.add('hidden');
        }
      }
    });
  }
};

// Export all functions
export default {
  DashboardStats,
  TransactionHistory,
  LeaderboardDisplay,
  SettingsPanel,
  HelpPanel,
  Notifications,
  DashboardUI
};

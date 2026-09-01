// Crazy Tuk Wallet Module
// Solana wallet connection and signing for DFlow swaps

const WALLET_CONNECTED_KEY = 'crazytuk_wallet_connected';
const WALLET_ADDRESS_KEY = 'crazytuk_wallet_address';
const WALLET_SIGNATURES_KEY = 'crazytuk_wallet_signatures';

/**
 * Wallet states
 */
export const WALLET_STATES = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR'
};

/**
 * Solana-compatible wallet adapters
 */
const WalletAdapters = {
  phantom: null,
  solflare: null,
  coinbase: null,
  walletConnect: null
};

function getPhantomProvider() {
  if (window.phantom?.solana?.isPhantom) {
    return window.phantom.solana;
  }

  if (window.solana?.isPhantom) {
    return window.solana;
  }

  if (Array.isArray(window.solana?.providers)) {
    return window.solana.providers.find((provider) => provider?.isPhantom) || null;
  }

  return null;
}

function getSolflareProvider() {
  if (window.solflare?.isSolflare) {
    return window.solflare;
  }

  if (window.solana?.isSolflare) {
    return window.solana;
  }

  if (Array.isArray(window.solana?.providers)) {
    return window.solana.providers.find((provider) => provider?.isSolflare) || null;
  }

  return null;
}

/**
 * Connect to a wallet
 * @param {string} adapter - Wallet adapter name ('phantom', 'solflare', 'coinbase', 'walletconnect')
 * @returns {Promise<WalletState>}
 */
export async function connectWallet(adapter = 'phantom') {
  try {
    console.log(`Connecting to ${adapter} wallet...`);

    // Initialize adapter
    switch (adapter) {
      case 'phantom':
        await initPhantom();
        break;
      case 'solflare':
        await initSolflare();
        break;
      case 'coinbase':
        if (!(window.walletlink && window.walletlink.Signer)) {
          await loadWalletScript('https://www.walletlink.com/release/2.5.2/walletlink.js');
        }
        await initCoinbase();
        break;
      case 'walletconnect':
        if (!window.WalletConnectWeb3Provider) {
          await loadWalletScript('https://unpkg.com/@walletconnect/web3-provider@1.10.1/dist/umd/index.js');
        }
        await initWalletConnect();
        break;
      default:
        throw new Error(`Unknown adapter: ${adapter}`);
    }

    return getWalletState();

  } catch (error) {
    console.error('Wallet connection error:', error);
    return { state: WALLET_STATES.ERROR, error: error.message };
  }
}

/**
 * Load wallet script dynamically
 */
function loadWalletScript(scriptUrl) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${scriptUrl}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Initialize Phantom wallet
 */
async function initPhantom() {
  const provider = getPhantomProvider();

  if (provider && provider.isPhantom) {
    WalletAdapters.phantom = provider;
    const response = await provider.connect();
    storeWalletState({
      state: WALLET_STATES.CONNECTED,
      adapter: 'phantom',
      publicKey: response.publicKey.toString(),
      address: response.publicKey.toString()
    });
    console.log('Phantom wallet connected:', response.publicKey.toString());
  } else {
    throw new Error('Phantom wallet not installed');
  }
}

/**
 * Initialize Solflare wallet
 */
async function initSolflare() {
  const provider = getSolflareProvider();

  if (provider && provider.isSolflare) {
    try {
      WalletAdapters.solflare = provider;
      const response = await provider.connect();

      storeWalletState({
        state: WALLET_STATES.CONNECTED,
        adapter: 'solflare',
        publicKey: response.publicKey.toString(),
        address: response.publicKey.toString()
      });
      console.log('Solflare wallet connected:', response.publicKey.toString());
    } catch (error) {
      if (error.message.includes('User rejected')) {
        throw new Error('Connection rejected');
      }
      throw error;
    }
  } else {
    throw new Error('Solflare wallet not installed');
  }
}

/**
 * Initialize Coinbase wallet
 */
async function initCoinbase() {
  if (window.walletlink && window.walletlink.Signer) {
    const walletLink = window.walletlink;
    const provider = walletLink.Signer.getWeb3Provider();

    const accounts = await provider.eth.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];

    storeWalletState({
      state: WALLET_STATES.CONNECTED,
      adapter: 'coinbase',
      publicKey: address,
      address: address
    });
    console.log('Coinbase wallet connected:', address);
  } else {
    throw new Error('Coinbase wallet not installed');
  }
}

/**
 * Initialize WalletConnect
 */
async function initWalletConnect() {
  const { Web3Provider } = window.WalletConnectWeb3Provider;

  if (window.walletconnect) {
    try {
      // Configure WalletConnect
      const provider = new Web3Provider({
        rpc: {
          1: 'https://rpc.ankr.com/eth'
        }
      }, {
        chainId: 1,
        bridge: 'https://bridge.walletconnect.org'
      });

      await provider.enable();

      const address = provider.selectedAddress;

      storeWalletState({
        state: WALLET_STATES.CONNECTED,
        adapter: 'walletconnect',
        publicKey: address,
        address: address,
        walletConnectProvider: provider
      });
      console.log('WalletConnect connected:', address);
    } catch (error) {
      if (error.message.includes('User rejected')) {
        throw new Error('Connection rejected');
      }
      throw error;
    }
  } else {
    throw new Error('WalletConnect not installed');
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet() {
  try {
    console.log('Disconnecting wallet...');

    const walletState = getWalletState();
    const provider = walletState.adapter === 'phantom'
      ? (WalletAdapters.phantom || getPhantomProvider())
      : walletState.adapter === 'solflare'
        ? (WalletAdapters.solflare || getSolflareProvider())
        : null;
    if (provider?.disconnect) {
      await provider.disconnect();
    }

    // Reset wallet state
    removeWalletState();

    // Notify game logic
    const event = new CustomEvent('wallet-disconnect', {
      detail: { state: WALLET_STATES.DISCONNECTED }
    });
    document.dispatchEvent(event);

    console.log('Wallet disconnected');
    return { state: WALLET_STATES.DISCONNECTED };
  } catch (error) {
    console.error('Wallet disconnect error:', error);
    return { state: WALLET_STATES.ERROR, error: error.message };
  }
}

/**
 * Get current wallet state
 */
export function getWalletState() {
  const stored = localStorage.getItem(WALLET_CONNECTED_KEY);
  if (stored) {
    return {
      ...JSON.parse(stored),
      state: JSON.parse(stored).state || WALLET_STATES.CONNECTED,
      connectedAt: parseInt(stored.connectedAt) || Date.now(),
      lastActive: parseInt(stored.lastActive) || Date.now()
    };
  }
  return {
    state: WALLET_STATES.DISCONNECTED,
    adapter: null,
    publicKey: null,
    address: null
  };
}

/**
 * Store wallet state in localStorage
 */
function storeWalletState(state) {
  const newState = {
    ...state,
    connectedAt: Date.now(),
    lastActive: Date.now()
  };
  localStorage.setItem(WALLET_CONNECTED_KEY, JSON.stringify(newState));
  localStorage.setItem(WALLET_ADDRESS_KEY, state.publicKey || state.address);

  // Notify game logic
  const event = new CustomEvent('wallet-connect', {
    detail: state
  });
  document.dispatchEvent(event);

  console.log('Wallet state stored:', newState);
}

/**
 * Remove wallet state from localStorage
 */
function removeWalletState() {
  localStorage.removeItem(WALLET_CONNECTED_KEY);
  localStorage.removeItem(WALLET_ADDRESS_KEY);
  localStorage.removeItem(WALLET_SIGNATURES_KEY);
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected() {
  const state = getWalletState();
  return state.state === WALLET_STATES.CONNECTED;
}

/**
 * Get wallet public key
 */
export function getWalletPublicKey() {
  const state = getWalletState();
  return state.publicKey || state.address;
}

/**
 * Get wallet adapter name
 */
export function getWalletAdapter() {
  const state = getWalletState();
  return state.adapter;
}

/**
 * Get wallet addresses
 */
export function getWalletAddress() {
  const state = getWalletState();
  return state.address;
}

/**
 * Sign a message with wallet
 * @param {string} message - Message to sign
 * @returns {Promise<string>} Signed message
 */
export async function signMessage(message) {
  try {
    const walletState = getWalletState();
    const publicKey = getWalletPublicKey();

    if (!walletState.state === WALLET_STATES.CONNECTED) {
      throw new Error('Wallet not connected');
    }

    let signature;

    switch (walletState.adapter) {
      case 'phantom':
        signature = await window.solana.signMessage(
          new TextEncoder().encode(message),
          'utf8'
        );
        break;

      case 'solflare':
        const solflare = window.solflare;
        signature = await solflare.signMessage(
          new TextEncoder().encode(message),
          'utf8'
        );
        break;

      case 'coinbase':
        const provider = window.walletlink.Signer.getWeb3Provider();
        const accounts = await provider.eth.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        signature = await provider.eth.personal.sign(
          new TextEncoder().encode(message),
          address,
          ''
        );
        break;

      case 'walletconnect':
        signature = await walletState.walletConnectProvider.currentProvider.signer.signMessage(
          new TextEncoder().encode(message)
        );
        break;

      default:
        throw new Error(`Unsupported wallet: ${walletState.adapter}`);
    }

    // Store signature
    const signatures = JSON.parse(localStorage.getItem(WALLET_SIGNATURES_KEY) || '{}');
    signatures[publicKey] = signatures[publicKey] || [];
    signatures[publicKey].push({
      signature: Array.from(signature),
      timestamp: Date.now(),
      message: message
    });
    localStorage.setItem(WALLET_SIGNATURES_KEY, JSON.stringify(signatures));

    console.log('Message signed:', signature);
    return Array.from(signature);

  } catch (error) {
    console.error('Message signing error:', error);
    throw error;
  }
}

/**
 * Sign a transaction with wallet
 * @param {object} transaction - Transaction to sign
 * @returns {Promise<object>} Signed transaction
 */
export async function signTransaction(transaction) {
  try {
    const walletState = getWalletState();

    if (walletState.state !== WALLET_STATES.CONNECTED) {
      throw new Error('Wallet not connected');
    }

    let signedTransaction;

    switch (walletState.adapter) {
      case 'phantom':
        signedTransaction = await window.solana.signAndSendTransaction(transaction);
        break;

      case 'solflare':
        signedTransaction = await window.solflare.signAndSendTransaction(transaction);
        break;

      case 'coinbase':
        const provider = window.walletlink.Signer.getWeb3Provider();
        signedTransaction = await provider.eth.sendTransaction(transaction);
        break;

      default:
        throw new Error(`Unsupported wallet: ${walletState.adapter}`);
    }

    console.log('Transaction signed:', signedTransaction);
    return signedTransaction;

  } catch (error) {
    console.error('Transaction signing error:', error);
    throw error;
  }
}

/**
 * Get available wallets
 */
export function getAvailableWallets() {
  const available = [];

  if (getPhantomProvider()) {
    available.push({ id: 'phantom', name: 'Phantom', installed: true });
  }

  if (getSolflareProvider()) {
    available.push({ id: 'solflare', name: 'Solflare', installed: true });
  }

  if (window.walletlink && window.walletlink.Signer) {
    available.push({ id: 'coinbase', name: 'Coinbase Wallet', installed: true });
  }

  if (window.walletconnect) {
    available.push({ id: 'walletconnect', name: 'WalletConnect', installed: true });
  }

  return available;
}

export function getPreferredWallet() {
  const available = getAvailableWallets();
  if (available.find((wallet) => wallet.id === 'phantom')) return 'phantom';
  if (available.find((wallet) => wallet.id === 'solflare')) return 'solflare';
  if (available.length > 0) return available[0].id;
  return null;
}

/**
 * Create a wallet UI modal
 * @returns {HTMLElement} Modal element
 */
export function createWalletModal() {
  const availableWallets = getAvailableWallets();
  const modal = document.createElement('div');
  modal.className = 'wallet-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'walletModalTitle');
  modal.innerHTML = `
    <div class="wallet-modal-content">
      <h2 id="walletModalTitle">Connect Wallet</h2>
      <p class="wallet-modal-subtitle">${availableWallets.length ? 'Choose a wallet to connect to Crazy Tuk.' : 'No supported Solana wallet was detected in this browser.'}</p>

      <div class="wallet-list">
        ${availableWallets.map(wallet => `
          <button class="wallet-button" data-wallet="${wallet.id}">
            <span class="wallet-icon">${getWalletIcon(wallet.id)}</span>
            <span class="wallet-name">${wallet.name}</span>
          </button>
        `).join('')}
      </div>

      ${availableWallets.length ? '' : `
        <p class="wallet-empty">Install Phantom or Solflare, then refresh this page and select Connect Wallet again.</p>
        <div class="wallet-install-links">
          <a href="https://phantom.app/download" target="_blank" rel="noopener noreferrer">GET PHANTOM</a>
          <a href="https://solflare.com/download" target="_blank" rel="noopener noreferrer">GET SOLFLARE</a>
        </div>
      `}

      <button class="wallet-close">Cancel</button>
    </div>
  `;

  // Add event listeners
  modal.querySelector('.wallet-close').addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelectorAll('.wallet-button').forEach(button => {
    button.addEventListener('click', async (e) => {
      const walletId = e.currentTarget.dataset.wallet;
      const result = await connectWallet(walletId);

      if (result.state === WALLET_STATES.CONNECTED) {
        modal.remove();

        // Update game UI
        if (window.CrazyTukGame) {
          window.CrazyTukGame.walletState = result;
          window.CrazyTukGame.updateHUD(window.CrazyTukGame.getPlayer());
        }
      } else {
        showNotification(`Failed to connect: ${result.error}`, 'error');
      }
    });
  });

  return modal;
}

/**
 * Get wallet icon
 */
function getWalletIcon(walletId) {
  const icons = {
    phantom: '👻',
    solflare: '☀️',
    coinbase: '🪙',
    walletconnect: '🔗'
  };
  return icons[walletId] || '👛';
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('notification-hidden');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Initialize wallet state on load
 */
export function initWallet() {
  const walletState = getWalletState();

  console.log('Wallet init:', walletState);

  if (walletState.state === WALLET_STATES.CONNECTED) {
    // Notify game logic
    const event = new CustomEvent('wallet-connect', {
      detail: walletState
    });
    document.dispatchEvent(event);
  }
}

// Export all functions for game data modules
export default {
  connectWallet,
  getPreferredWallet,
  disconnectWallet,
  getWalletState,
  isWalletConnected,
  getWalletPublicKey,
  getWalletAddress,
  getWalletAdapter,
  getAvailableWallets,
  createWalletModal,
  signMessage,
  signTransaction,
  initWallet,
  WALLET_STATES
};

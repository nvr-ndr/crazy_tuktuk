// Crazy Tuk DFlow API Client
// Integration with DFlow swap API for authenticated swaps

const DFLOW_API_URL = '/api/dflow';

/**
 * DFlow API Response Types
 */
const DFLOW_RESPONSES = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  PENDING: 'PENDING'
};

/**
 * Create swap quote request
 * @param {object} params - Swap parameters
 * @param {string} params.inputMint - Input token mint (e.g., 'USDC', 'SOL')
 * @param {string} params.outputMint - Output token mint (e.g., 'SOL', 'USDC')
 * @param {number} params.inputAmount - Amount in input token (in smallest units)
 * @param {number} params.slippageTolerance - Slippage tolerance (in percentage, e.g., 0.5 for 0.5%)
 * @returns {Promise<SwapQuote>}
 */
export async function getSwapQuote(params) {
  try {
    console.log('Getting swap quote...', params);

    const query = new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: String(params.inputAmount),
      slippageBps: String(Math.round((params.slippageTolerance || 0.5) * 100))
    });
    if (params.wallet) query.set('userPublicKey', params.wallet);

    const response = await fetch(`${DFLOW_API_URL}/order?${query}`);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || errorBody.error || `DFlow API error: ${response.status}`);
    }

    const quote = await response.json();
    console.log('Swap quote received:', quote);

    return {
      state: DFLOW_RESPONSES.SUCCESS,
      quote: quote,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Failed to get swap quote:', error);
    return {
      state: DFLOW_RESPONSES.ERROR,
      error: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Execute swap
 * @param {object} params - Swap execution parameters
 * @param {string} params.quoteId - Quote ID from quote request
 * @param {string} params.wallet - Wallet public key
 * @param {string} params.inputMint - Input token mint
 * @param {number} params.inputAmount - Input amount
 * @returns {Promise<SwapExecution>}
 */
export async function executeSwap(params) {
  try {
    console.log('Executing swap...', params);

    const response = await fetch(`${DFLOW_API_URL}/swap/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteId: params.quoteId,
        wallet: params.wallet,
        inputMint: params.inputMint,
        inputAmount: params.inputAmount,
        confirm: params.confirm || false
      })
    });

    if (!response.ok) {
      throw new Error(`DFlow API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Swap executed:', result);

    return {
      state: DFLOW_RESPONSES.SUCCESS,
      result: result,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Failed to execute swap:', error);
    return {
      state: DFLOW_RESPONSES.ERROR,
      error: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Get swap status
 * @param {string} swapId - Swap transaction ID
 * @returns {Promise<SwapStatus>}
 */
export async function getSwapStatus(swapId) {
  try {
    console.log('Getting swap status for:', swapId);

    const response = await fetch(`${DFLOW_API_URL}/swap/${swapId}/status`);

    if (!response.ok) {
      throw new Error(`DFlow API error: ${response.status}`);
    }

    const status = await response.json();
    console.log('Swap status:', status);

    return {
      state: DFLOW_RESPONSES.SUCCESS,
      status: status,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Failed to get swap status:', error);
    return {
      state: DFLOW_RESPONSES.ERROR,
      error: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Get swap history for wallet
 * @param {string} wallet - Wallet public key
 * @param {number} limit - Maximum number of swaps to return
 * @returns {Promise<SwapHistory>}
 */
export async function getSwapHistory(wallet, limit = 10) {
  try {
    console.log('Getting swap history for wallet:', wallet);

    const response = await fetch(`${DFLOW_API_URL}/wallet/${wallet}/swaps?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`DFlow API error: ${response.status}`);
    }

    const history = await response.json();
    console.log('Swap history:', history);

    return {
      state: DFLOW_RESPONSES.SUCCESS,
      history: history,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Failed to get swap history:', error);
    return {
      state: DFLOW_RESPONSES.ERROR,
      error: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Verify swap
 * @param {string} swapId - Swap transaction ID
 * @param {string} wallet - Wallet public key
 * @returns {Promise<SwapVerification>}
 */
export async function verifySwap(swapId, wallet) {
  try {
    console.log('Verifying swap:', swapId, 'for wallet:', wallet);

    const response = await fetch(`${DFLOW_API_URL}/swap/${swapId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wallet: wallet,
        swapId: swapId
      })
    });

    if (!response.ok) {
      throw new Error(`DFlow API error: ${response.status}`);
    }

    const verification = await response.json();
    console.log('Swap verified:', verification);

    return {
      state: DFLOW_RESPONSES.SUCCESS,
      verification: verification,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Failed to verify swap:', error);
    return {
      state: DFLOW_RESPONSES.ERROR,
      error: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Create authenticated swap for DFlow game
 * @param {object} params - Authenticated swap parameters
 * @param {string} params.wallet - Wallet public key
 * @param {string} params.inputMint - Input token (e.g., 'SOL', 'USDC')
 * @param {number} params.inputAmount - Input amount
 * @param {number} params.outputMint - Output token (e.g., 'USDC', 'SOL')
 * @param {number} params.usdValue - USD value of swap (for fuel calculation)
 * @param {string} params.fareId - Fare ID (optional)
 * @returns {Promise<AuthenticatedSwap>}
 */
export async function createAuthenticatedSwap(params) {
  try {
    console.log('Creating authenticated swap...', params);

    // Step 1: Get swap quote
    console.log('Step 1: Getting swap quote...');
    const quoteResult = await getSwapQuote({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      inputAmount: params.inputAmount,
      slippageTolerance: params.slippageTolerance || 0.5,
      wallet: params.wallet,
      faucet: params.faucet !== false
    });

    if (quoteResult.state !== DFLOW_RESPONSES.SUCCESS) {
      throw new Error(`Quote failed: ${quoteResult.error}`);
    }

    console.log('Step 2: Executing swap...');
    // Step 2: Execute swap
    const executeResult = await executeSwap({
      quoteId: quoteResult.quote.id,
      wallet: params.wallet,
      inputMint: params.inputMint,
      inputAmount: params.inputAmount,
      confirm: params.confirm || false
    });

    if (executeResult.state !== DFLOW_RESPONSES.SUCCESS) {
      throw new Error(`Swap execution failed: ${executeResult.error}`);
    }

    // Step 3: Verify swap
    console.log('Step 3: Verifying swap...');
    const verifyResult = await verifySwap(executeResult.result.id, params.wallet);

    if (verifyResult.state !== DFLOW_RESPONSES.SUCCESS) {
      throw new Error(`Swap verification failed: ${verifyResult.error}`);
    }

    console.log('Swap completed successfully!');

    return {
      state: DFLOW_RESPONSES.SUCCESS,
      swap: {
        id: executeResult.result.id,
        quoteId: quoteResult.quote.id,
        quote: quoteResult.quote,
        execution: executeResult.result,
        verification: verifyResult.verification,
        usdValue: params.usdValue,
        fareId: params.fareId
      },
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Failed to create authenticated swap:', error);
    return {
      state: DFLOW_RESPONSES.ERROR,
      error: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Fallback to simulated swap when API fails
 * @param {object} params - Same as createAuthenticatedSwap
 * @returns {Promise<SimulatedSwap>}
 */
export function createSimulatedSwap(params) {
  console.log('Creating simulated swap (API fallback)...', params);

  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Calculate approximate fuel based on USD value
      const fuelFromUsd = calculateFuelFromUsd(params.usdValue);

      // Create simulated transaction
      const simulatedTransaction = {
        id: `simulated-swap-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        inputAmount: params.inputAmount,
        outputAmount: params.inputAmount * (params.outputMint === 'SOL' ? 0.000018 : 1),
        usdValue: params.usdValue,
        fuelAwarded: fuelFromUsd,
        state: 'CONFIRMED',
        timestamp: Date.now()
      };

      console.log('Simulated swap created:', simulatedTransaction);

      resolve({
        state: DFLOW_RESPONSES.SUCCESS,
        swap: simulatedTransaction,
        isSimulated: true,
        timestamp: Date.now()
      });
    }, 1000);
  });
}

/**
 * Calculate fuel awarded based on USD value
 * @param {number} usdValue - USD value of swap
 * @returns {number} Fuel awarded
 */
function calculateFuelFromUsd(usdValue) {
  const USDC_TO_SOL = 0.000018;

  if (usdValue < 1) return 1;
  if (usdValue < 5) return 2;
  if (usdValue < 10) return 5;
  return 8;
}

/**
 * Validate swap parameters
 * @param {object} params - Swap parameters
 * @returns {object} Validation result
 */
export function validateSwapParams(params) {
  const errors = [];

  if (!params.wallet) {
    errors.push('Wallet public key is required');
  }

  if (!params.inputMint) {
    errors.push('Input mint is required');
  }

  if (!params.inputAmount || params.inputAmount <= 0) {
    errors.push('Input amount must be positive');
  }

  if (!params.outputMint) {
    errors.push('Output mint is required');
  }

  if (!params.usdValue || params.usdValue <= 0) {
    errors.push('USD value must be positive');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Get DFlow API configuration
 * @returns {object} Configuration
 */
export function getDFlowConfig() {
  return {
    apiUrl: DFLOW_API_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

/**
 * Test DFlow API connection
 * @returns {Promise<TestResult>}
 */
export async function testDFlowConnection() {
  try {
    console.log('Testing DFlow API connection...');

    const config = getDFlowConfig();
    const response = await fetch(`${DFLOW_API_URL}/health`, {
      method: 'GET',
      headers: config.headers
    });

    if (!response.ok) {
      throw new Error(`API health check failed: ${response.status}`);
    }

    const health = await response.json();
    console.log('DFlow API is healthy:', health);

    return {
      connected: true,
      status: health.status,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('DFlow API connection failed:', error);

    // Return simulated success for testing
    return {
      connected: false,
      fallbackToSimulated: true,
      error: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Store swap history locally
 * @param {string} wallet - Wallet public key
 * @param {object} swap - Swap data
 */
export function storeSwapHistory(wallet, swap) {
  try {
    const HISTORY_KEY = `crazytuk_swaps_${wallet}`;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    history.unshift({
      ...swap,
      wallet: wallet,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    });

    // Keep only last 50 swaps
    const limitedHistory = history.slice(0, 50);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
    console.log('Swap history stored for wallet:', wallet);
  } catch (error) {
    console.error('Failed to store swap history:', error);
  }
}

/**
 * Get local swap history for wallet
 * @param {string} wallet - Wallet public key
 * @returns {Array} Swap history
 */
export function getLocalSwapHistory(wallet) {
  try {
    const HISTORY_KEY = `crazytuk_swaps_${wallet}`;
    const history = localStorage.getItem(HISTORY_KEY);

    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get swap history:', error);
    return [];
  }
}

// Export all functions
export default {
  getSwapQuote,
  executeSwap,
  getSwapStatus,
  getSwapHistory,
  verifySwap,
  createAuthenticatedSwap,
  createSimulatedSwap,
  validateSwapParams,
  getDFlowConfig,
  testDFlowConnection,
  storeSwapHistory,
  getLocalSwapHistory,
  DFLOW_RESPONSES,
  calculateFuelFromUsd
};

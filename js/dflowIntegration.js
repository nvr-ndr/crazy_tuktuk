// Crazy Tuk DFlow Integration
// Bridge between DFlow API and game swap interpretation

import {
  getSwapQuote,
  getSwapStatus,
  getSwapHistory,
  storeSwapHistory,
  getLocalSwapHistory,
  validateSwapParams,
  testDFlowConnection
} from './dflow.js?v=20260823o';
import { signTransaction } from './wallet.js?v=20260823e';
import { interpretConfirmedSwap } from './interpretSwap.js';
import { calculateFuelEarned } from './fuel.js';
const DFLOW_ENABLED = true; // Set to false to force simulated mode

/**
 * Authoritative swap-to-game-event bridge with real DFlow support
 * @param {object} swap - Swap data to process
 * @returns {Promise<ProcessedSwap>}
 */
export async function processSwap(swap) {
  try {
    console.log('Processing swap with DFlow...', swap);

    // Validate swap parameters
    const validation = window.DFlowClient.validateSwapParams(swap);
    if (!validation.valid) {
      throw new Error(`Invalid swap parameters: ${validation.errors.join(', ')}`);
    }

    // Check if DFlow is enabled
    if (!DFLOW_ENABLED) {
      throw new Error('DFlow swaps are currently disabled');
    }

    // Check if wallet is connected
    if (!swap.wallet) {
      throw new Error('Wallet not connected - cannot process real swap');
    }

    const result = await processWithDFlowAPI(swap);

    if (result.state === 'SUCCESS') {
      const interpreted = interpretConfirmedSwap({ ...result.swap, signature: result.signature, wallet: swap.wallet, confirmedAt: Date.now() });
      if (!interpreted.success && interpreted.reason !== 'duplicate_signature') {
        throw new Error(`Swap could not be applied to game state: ${interpreted.reason}`);
      }
      result.fuelAwarded = interpreted.fuelAwarded;
      result.fareAssigned = interpreted.fareAssigned;
      result.fareContext = interpreted.fareContext;
      storeSwapHistory(swap.wallet, { ...result.swap, fuelAwarded: interpreted.fuelAwarded, fareId: interpreted.fareAssigned });
    }

    return result;

  } catch (error) {
    console.error('Failed to process swap:', error);
    throw error;
  }
}

/**
 * Process swap with real DFlow API
 * @param {object} swap - Swap data
 * @returns {Promise<ProcessedSwap>}
 */
async function processWithDFlowAPI(swap) {
  try {
    console.log('Processing swap with DFlow API...', swap);

    // Reuse the displayed order so wallet approval matches the quoted output.
    const quoteParams = {
      inputMint: swap.inputMint,
      outputMint: swap.outputMint,
      inputAmount: swap.inputAmount,
      slippageTolerance: swap.slippageTolerance || 0.5,
      wallet: swap.wallet,
      faucet: swap.faucet !== false
    };

    let order = swap.order;
    if (!order) {
      const quoteResult = await getSwapQuote(quoteParams);
      if (quoteResult.state !== 'SUCCESS') throw new Error(`Order failed: ${quoteResult.error}`);
      order = quoteResult.quote;
    }
    if (!order?.transaction) {
      throw new Error('DFlow order did not include a transaction. Refresh the quote and try again.');
    }
    if (!window.solanaWeb3?.VersionedTransaction) {
      throw new Error('Solana transaction library did not load.');
    }

    const transactionBytes = Uint8Array.from(atob(order.transaction), character => character.charCodeAt(0));
    let transaction;
    try {
      transaction = window.solanaWeb3.VersionedTransaction.deserialize(transactionBytes);
    } catch {
      transaction = window.solanaWeb3.Transaction.from(transactionBytes);
    }

    console.log('Requesting wallet approval...');
    const walletResult = await signTransaction(transaction);
    const signature = typeof walletResult === 'string' ? walletResult : walletResult?.signature;
    if (!signature) throw new Error('Wallet did not return a transaction signature.');

    const connection = new window.solanaWeb3.Connection(
      'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    const confirmed = !confirmation.value?.err;

    // Calculate fuel awarded (same as fake swap logic)
    const fuelAwarded = calculateFuelFromUsd(swap.usdValue);

    // Check if fare assignment is needed
    let fareAssigned = null;
    if (swap.fareId) {
      // In a real implementation, we would verify the fare is eligible
      fareAssigned = swap.fareId;
    }

    // Check context
    const state = swap.fareContext || 'AVAILABLE';

    const result = {
      state: confirmed ? 'SUCCESS' : 'ERROR',
      confirmed,
      error: confirmed ? null : 'DFlow returned without confirmed Solana status.',
      fuelAwarded: fuelAwarded,
      fareAssigned: fareAssigned,
      fareContext: state,
      quote: order,
      execution: { signature },
      verification: confirmation.value,
      signature,
      swap: {
        signature,
        inputMint: swap.inputMint,
        outputMint: swap.outputMint,
        inputAmount: swap.inputAmount,
        usdValue: swap.usdValue,
        fuelAwarded,
        state: confirmed ? 'CONFIRMED' : 'UNCONFIRMED',
        timestamp: Date.now()
      },
      swappedWith: 'DFLOW_API'
    };

    console.log('Swap processed with DFlow API:', result);

    return result;

  } catch (error) {
    console.error('DFlow API processing failed:', error);
    throw error;
  }
}

/**
 * Calculate fuel awarded based on USD value
 * @param {number} usdValue - USD value of swap
 * @returns {number} Fuel awarded
 */
function calculateFuelFromUsd(usdValue) {
  return calculateFuelEarned(usdValue);
}

/**
 * Get swap history with fallback
 * @param {string} wallet - Wallet public key
 * @returns {Promise<SwapHistory>}
 */
export async function getSwapHistoryWithFallback(wallet) {
  try {
    console.log('Getting swap history for wallet:', wallet);

    // First try local storage
    const localHistory = getLocalSwapHistory(wallet);
    if (localHistory.length > 0) {
      console.log('Found local swap history:', localHistory.length, 'swaps');
      return {
        history: localHistory,
        source: 'LOCAL',
        timestamp: Date.now()
      };
    }

    // Try to get from DFlow API
    console.log('No local history found, trying DFlow API...');
    const apiResult = await window.DFlowClient.getSwapHistory(wallet);

    if (apiResult.state === 'SUCCESS') {
      console.log('Found API swap history:', apiResult.history.length, 'swaps');
      return {
        history: apiResult.history,
        source: 'API',
        timestamp: Date.now()
      };
    }

    // Return empty history
    return {
      history: [],
      source: 'NONE',
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Failed to get swap history:', error);

    // Return local history as fallback
    const localHistory = getLocalSwapHistory(wallet);
    return {
      history: localHistory,
      source: 'LOCAL_FALLBACK',
      timestamp: Date.now()
    };
  }
}

/**
 * Get swap statistics for wallet
 * @param {string} wallet - Wallet public key
 * @returns {Promise<SwapStatistics>}
 */
export async function getSwapStatistics(wallet) {
  try {
    const history = await getSwapHistoryWithFallback(wallet);

    const swaps = history.history;
    const totalSwaps = swaps.length;
    const completedSwaps = swaps.filter(s => s.state === 'CONFIRMED').length;
    const totalUsdValue = swaps.reduce((sum, swap) => sum + (swap.usdValue || 0), 0);
    const totalFuel = swaps.reduce((sum, swap) => sum + (swap.fuelAwarded || 0), 0);

    return {
      totalSwaps: totalSwaps,
      completedSwaps: completedSwaps,
      totalUsdValue: totalUsdValue,
      totalFuel: totalFuel,
      averageSwapValue: totalSwaps > 0 ? totalUsdValue / totalSwaps : 0,
      averageFuelPerSwap: totalSwaps > 0 ? totalFuel / totalSwaps : 0,
      source: history.source
    };

  } catch (error) {
    console.error('Failed to get swap statistics:', error);
    return {
      totalSwaps: 0,
      completedSwaps: 0,
      totalUsdValue: 0,
      totalFuel: 0,
      source: 'ERROR'
    };
  }
}

/**
 * Poll for swap confirmation
 * @param {string} swapId - Swap transaction ID
 * @param {number} interval - Polling interval in ms
 * @param {number} maxAttempts - Maximum polling attempts
 * @returns {Promise<SwapStatus>}
 */
export async function pollSwapConfirmation(swapId, interval = 3000, maxAttempts = 20) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      console.log(`Polling swap confirmation... Attempt ${attempts}/${maxAttempts}`);

      const status = await window.DFlowClient.getSwapStatus(swapId);

      if (status.state === 'SUCCESS') {
        console.log('Swap confirmed:', status.status);

        if (status.status.state === 'CONFIRMED') {
          return {
            confirmed: true,
            status: status.status,
            attempts: attempts
          };
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));

    } catch (error) {
      console.error('Polling error:', error);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  console.log('Swap confirmation timeout');
  return {
    confirmed: false,
    status: null,
    attempts: attempts
  };
}

/**
 * Initialize DFlow integration
 */
export function initDFlowIntegration() {
  console.log('Initializing DFlow integration...');

  // Make DFlow client available globally
  window.DFlowClient = {
    getSwapQuote,
    getSwapStatus,
    getSwapHistory,
    validateSwapParams,
    getLocalSwapHistory,
    testDFlowConnection
  };

  console.log('DFlow integration initialized');
  console.log('DFlow enabled:', DFLOW_ENABLED);
}

// Export all functions
export default {
  processSwap,
  processWithDFlowAPI,
  getSwapHistoryWithFallback,
  getSwapStatistics,
  pollSwapConfirmation,
  initDFlowIntegration
};

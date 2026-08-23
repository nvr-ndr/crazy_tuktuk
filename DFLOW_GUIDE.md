# Crazy Tuk DFlow API Integration

> **Phase 6: DFlow API Integration**

---

## Overview

Crazy Tuk now includes integration with DFlow API for real swap execution. This allows users to make actual SOL ↔ USDC swaps instead of using fake swaps.

---

## Configuration

### 1. DFlow API Key

The current buildathon order flow does not require an API key. Requests are sent through the server-side `api/dflow/order.js` endpoint. If a protected upstream environment is introduced later, configure `DFLOW_API_KEY` in the deployment environment only; never place it in browser code.

### 2. DFlow API URL

The browser uses the same-origin `/api/dflow/order` endpoint, which forwards requests to DFlow.

### 3. Enable/Disable DFlow

In `js/dflowIntegration.js`:

```javascript
const DFLOW_ENABLED = true; // Set to false to force simulated mode
```

---

## API Endpoints

### Quote Request

**Endpoint:** `POST /swap/quote`

**Request:**
```json
{
  "inputMint": "SOL",
  "outputMint": "USDC",
  "inputAmount": 2000000000,
  "slippageTolerance": 0.5,
  "wallet": "publicKey",
  "faucet": true
}
```

**Response:**
```json
{
  "id": "quote-123",
  "inputMint": "SOL",
  "outputMint": "USDC",
  "inputAmount": 2000000000,
  "outputAmount": 690000000,
  "priceImpact": 0.0001,
  "estimatedFee": 5000
}
```

### Swap Execution

**Endpoint:** `POST /swap/execute`

**Request:**
```json
{
  "quoteId": "quote-123",
  "wallet": "publicKey",
  "inputMint": "SOL",
  "inputAmount": 2000000000,
  "confirm": false
}
```

**Response:**
```json
{
  "id": "swap-456",
  "quoteId": "quote-123",
  "state": "PENDING",
  "confirmationState": "PENDING",
  "amountIn": 2000000000,
  "amountOut": 690000000
}
```

### Swap Verification

**Endpoint:** `POST /swap/{swapId}/verify`

**Request:**
```json
{
  "wallet": "publicKey",
  "swapId": "swap-456"
}
```

**Response:**
```json
{
  "verified": true,
  "confirmed": true,
  "signature": "signature-string"
}
```

### Swap History

**Endpoint:** `GET /wallet/{wallet}/swaps`

**Response:**
```json
{
  "wallet": "publicKey",
  "swaps": [
    {
      "id": "swap-456",
      "inputMint": "SOL",
      "outputMint": "USDC",
      "state": "CONFIRMED"
    }
  ]
}
```

---

## Fuel Calculation

Fuel is awarded based on swap USD value:

| USD Value | Fuel Awarded |
|-----------|--------------|
| $0.01 - $0.99 | 1 fuel |
| $1.00 - $4.99 | 2 fuel |
| $5.00 - $9.99 | 5 fuel |
| $10.00+ | 8 fuel |

---

## Transaction States

| State | Description |
|-------|-------------|
| `PENDING` | Transaction is in progress |
| `CONFIRMED` | Transaction successfully completed |
| `FAILED` | Transaction failed |
| `CANCELLED` | Transaction was cancelled |

---

## Code Usage

### Create Swap with DFlow

```javascript
// In your game action handler
const swapResult = await window.CrazyTukGame.processSwap({
  signature: `action-${Date.now()}`,
  wallet: WalletModule.getWalletPublicKey(),
  inputMint: 'SOL',
  outputMint: 'USDC',
  inputAmount: 2000000000,
  outputAmount: 690000000,
  usdValue: 7,
  confirmedAt: Date.now(),
  fareContext: 'SELECTED_FARE'
});

console.log('Swap result:', swapResult);
```

### Get Swap History

```javascript
const history = await window.CrazyTukGame.getSwapHistoryWithFallback(wallet);
console.log('Swap history:', history);
```

### Get Swap Statistics

```javascript
const stats = await window.CrazyTukGame.getSwapStatistics(wallet);
console.log('Swap statistics:', stats);
```

### Test DFlow Connection

```javascript
const test = await window.DFlowClient.testDFlowConnection();
console.log('DFlow connected:', test.connected);
```

---

## Error Handling

### API Errors

The system handles API errors gracefully with fallback to simulated swaps:

```javascript
try {
  const result = await window.CrazyTukGame.processSwap(params);
} catch (error) {
  console.error('Swap failed:', error);
  // Falls back to simulated swap
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid swap parameters` | Missing or invalid swap data | Check all required fields |
| `Wallet not connected` | No wallet connected | Connect wallet first |
| `Quote failed` | API error or invalid parameters | Check DFlow API key |
| `Swap execution failed` | Insufficient funds or network error | Check wallet balance |
| `Swap verification failed` | Transaction not confirmed | Wait and retry |

---

## Fallback to Simulated Mode

If DFlow API fails, the system automatically falls back to simulated swaps:

```javascript
// Simulated swap (used when API fails)
{
  swappedWith: 'DFLOW_FALLBACK',
  id: 'simulated-swap-timestamp-random',
  state: 'CONFIRMED',
  fuelAwarded: 5
}
```

---

## Testing

### Test with DFlow API

1. Set `DFLOW_ENABLED = true`
2. Add a valid DFlow API key
3. Connect wallet
4. Test swap flow
5. Check console for errors

### Test with Simulated Mode

1. Set `DFLOW_ENABLED = false`
2. Connect wallet
3. Test swap flow
4. All swaps are simulated

### Test Wallet Connection

```javascript
// Test in browser console
tests/manual/TEST_WALLET.js
```

---

## Swap History Storage

### Local Storage

Swaps are stored in localStorage:

```
crazytuk_swaps_{wallet}
```

### History Management

- Keeps last 50 swaps per wallet
- Stored with full transaction details
- Available offline

### Access History

```javascript
// Get local history
const history = getLocalSwapHistory(wallet);

// Get full history (API + local)
const fullHistory = await getSwapHistoryWithFallback(wallet);
```

---

## DFlow Configuration

### API Configuration

```text
Browser → /api/dflow/order → DFlow upstream
```

Optional protected environments read `DFLOW_API_KEY` from server-side environment variables.

### Client Setup

```javascript
// Initialize DFlow integration
initDFlowIntegration();

// Access DFlow client
const dflowClient = window.DFlowClient;

// Test connection
const test = await dflowClient.testDFlowConnection();
```

---

## Swap Flow

### Complete Swap Flow

```
1. Select Fare
   ↓
2. Click Action Button → "SWAP"
   ↓
3. Claim Fare (requires wallet)
   ↓
4. Process Swap with DFlow
   ↓
5. Get Swap Quote
   ↓
6. Execute Swap
   ↓
7. Verify Swap
   ↓
8. Award Fuel
   ↓
9. Update Game State
   ↓
10. Complete Fare
```

### Fallback Flow

```
1-4. Same as above
   ↓
5. API Error
   ↓
6. Simulated Swap (local)
   ↓
7. Award Fuel (simulated)
   ↓
8. Update Game State
   ↓
9. Complete Fare
```

---

## Security Considerations

### ✅ Do:
- Use HTTPS for API calls
- Store API key securely
- Validate all input parameters
- Use proper error handling
- Check wallet connection before processing

### ❌ Don't:
- Expose API key in client code
- Trust unsanctioned DFlow instances
- Process swaps without wallet
- Ignore error messages
- Store sensitive data in plain localStorage

---

## Performance

### API Latency

- Quote request: ~500-1500ms
- Swap execution: ~2000-5000ms
- Swap verification: ~500-1500ms
- Total swap time: ~3-8 seconds

### Fallback Performance

- Simulated swap: ~1000ms (instant)

---

## Browser Compatibility

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Requirements

- ES6 modules support
- Fetch API
- LocalStorage
- Modern JavaScript

---

## Troubleshooting

### API Connection Failed

**Symptom:** `DFlow API error: 500` or connection timeout

**Solution:**
1. Check DFlow API key
2. Verify API URL is correct
3. Check network connection
4. Check API endpoint is running

### Wallet Not Connected

**Symptom:** `Wallet not connected - cannot process real swap`

**Solution:**
1. Connect wallet first
2. Check wallet state
3. Verify wallet is unlocked

### Insufficient Funds

**Symptom:** `Swap execution failed - insufficient funds`

**Solution:**
1. Add SOL/USDC to wallet
2. Check wallet balance
3. Verify sufficient amount

### Transaction Not Confirmed

**Symptom:** `Swap verification failed`

**Solution:**
1. Wait for confirmation
2. Check network congestion
3. Verify transaction details
4. Allow fallback to simulated mode

---

## Next Steps

### Phase 7: Dashboard UI

- Create swap history UI
- Add swap statistics display
- Implement wallet connect UI
- Add settings panel
- Add help panel

### Phase 8: App Store Deployment

- Polish UI and UX
- Fix all bugs
- Optimize performance
- Create app store screenshots
- Submit to stores

---

## Support

For DFlow API issues:
- Check DFlow documentation
- Check DFlow API status
- Contact DFlow support
- Enable simulated mode for testing

For swap flow issues:
- Check browser console for errors
- Verify wallet connection
- Check swap parameters
- Review swap history

---

**DFlow Integration Status:** ✅ COMPLETE

Ready for real swap execution! Set `DFLOW_ENABLED = true` and add your API key.

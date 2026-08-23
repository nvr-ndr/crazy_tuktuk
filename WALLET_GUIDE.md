# Crazy Tuk Wallet Integration - User Guide

> **Phase 5 Complete: Wallet Vertical Slice**

---

## Overview

Crazy Tuk now includes full wallet integration with support for:
- **Phantom** (Solana)
- **Solflare** (Solana)
- **Coinbase Wallet** (Ethereum)
- **WalletConnect** (Multi-chain)

---

## Wallet Setup

### Step 1: Install a Wallet

Choose one of these wallets and install it:

1. **Phantom** (Recommended for Solana)
   - Download: https://phantom.app/
   - Browser extension available

2. **Solflare**
   - Download: https://solflare.com/
   - Browser extension available

3. **Coinbase Wallet**
   - Download: https://wallet.coinbase.com/
   - Mobile app also available

4. **WalletConnect**
   - Download: https://walletconnect.com/
   - Multi-chain support

### Step 2: Start Crazy Tuk

Start your local server:
```powershell
node dev-server.cjs
```

Open: http://localhost:8080

### Step 3: Connect Wallet

1. Look for the **👛 Connect** button in the HUD
2. Click the button
3. Select your wallet from the modal
4. Allow the connection in your wallet

**You should see:**
- Button changes to **👛 Wallet**
- Wallet address displayed (e.g., `8x...3K9`)
- Notification: "Wallet connected successfully!"

---

## Wallet Features

### Connected State

When connected, you can:
- **Claim fares** (requires wallet)
- **Get authenticated** for DFlow swaps
- **Earn rewards** with verified transactions
- **View transaction history** (stored locally)

### Wallet Display

The wallet display shows:
- Wallet icon (💕)
- Short address (e.g., `8x...3K9`)
- Connector badge

### Disconnect Wallet

To disconnect:
1. Click the **👛 Wallet** button
2. Wallet will show as "Disconnect" option
3. Confirm disconnection

---

## Wallet-Gated Actions

Certain actions require wallet connection:

### 1. Claim Fares

After selecting a fare:
1. Click the action button
2. Claim the selected fare
3. **Requires wallet connection**

**Flow:**
```
Select Fare → Claim Fare (if connected)
```

**Error if not connected:**
- Notification: "Please connect wallet first"
- Action is blocked until wallet is connected

---

## Testing Wallet Integration

### Test Script

Run this in browser console after connecting:

```javascript
tests/manual/TEST_WALLET.js
```

Or copy and paste the contents of `tests/manual/TEST_WALLET.js` directly into the console.

### Manual Tests

**Test 1: Connection**
```javascript
// Check if wallet is connected
WalletModule.isWalletConnected()

// Get wallet public key
WalletModule.getWalletPublicKey()

// Get wallet address
WalletModule.getWalletAddress()

// Get wallet adapter name
WalletModule.getWalletAdapter()
```

**Test 2: Signing**
```javascript
// Sign a message
const message = "Hello from Crazy Tuk! " + Date.now();
const signature = await WalletModule.signMessage(message);
console.log('Signature:', signature);
```

**Test 3: Disconnect**
```javascript
// Disconnect wallet
WalletModule.disconnectWallet()

// Verify disconnection
WalletModule.isWalletConnected() // Should return false
```

---

## DFlow Integration

### Swap Flow (Future)

When DFlow API is implemented:

1. **Connect wallet** to Crazy Tuk
2. **Select a fare**
3. **Claim fare** (requires swap)
4. **Swap SOL → USDC** via DFlow
5. **Earn fuel** based on swap value
6. **Drive to destination**
7. **Complete trip** (earn points)

### Swap Conditions

Fares qualify for fuel based on swap type:
- **ANY_SWAP** (1 fuel minimum)
- **SOL_PAIR** (2+ fuel)
- **STABLE_PAIRS** (3+ fuel)
- **HIGH_VALUE** (5+ fuel)

### Swap Values

Fuel is awarded based on USD value:
- $0.01 - $0.99: 1 fuel
- $1.00 - $4.99: 2 fuel
- $5.00 - $9.99: 5 fuel
- $10.00+: 8 fuel

---

## Troubleshooting

### Wallet Not Detected

**Symptom:** Wallet button doesn't show your installed wallet

**Solution:**
1. Make sure wallet extension is enabled
2. Refresh the page
3. Check if wallet is locked (unlock it)
4. Try a different browser

### Connection Rejected

**Symptom:** "Connection rejected" or "User denied access"

**Solution:**
1. Make sure you selected "Connect" in the wallet popup
2. Check wallet settings allow connections from this domain
3. Try disconnecting first, then reconnecting

### Signing Fails

**Symptom:** "Signing failed" when trying to sign message

**Solution:**
1. Check wallet is unlocked
2. Ensure wallet has sufficient funds (for Ethereum wallets)
3. Check wallet has enough gas (for Ethereum)
4. Try disconnecting and reconnecting

---

## Security Best Practices

### ✅ Do:
- Only connect wallets you trust
- Check the wallet address matches your expected wallet
- Use wallet extensions in secure environments
- Disconnect when not using Crazy Tuk

### ❌ Don't:
- Connect to suspicious URLs
- Share your wallet seed phrase
- Connect wallets on public computers
- Connect wallets to phishing sites

---

## Technical Details

### Wallet State Management

Wallet state is stored in localStorage:
```javascript
localStorage.getItem('crazytuk_wallet_connected')  // Connection state
localStorage.getItem('crazytuk_wallet_address')    // Public key
localStorage.getItem('crazytuk_wallet_signatures') // Signatures history
```

### Signature Storage

All signed messages are stored locally:
```javascript
{
  "publicKey": "signature-array",
  "timestamp": number,
  "message": "original-message"
}
```

### Authentication

Wallet provides:
- **Public Key**: For identifying the user
- **Signature**: For verifying transactions
- **Address**: For blockchain interactions

---

## Next Steps

After wallet integration is complete:

1. **Test DFlow API integration**
2. **Implement real swap flow**
3. **Add transaction history UI**
4. **Add wallet settings**
5. **Implement onboarding flow**

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Run `tests/manual/TEST_WALLET.js` to verify wallet functionality
3. Check if Crazy Tuk is running with a local server (not `file://`)
4. Verify wallet extension is working in other applications

---

**Wallet Integration Status:** ✅ COMPLETE

Ready for DFlow API integration and real swap flow!

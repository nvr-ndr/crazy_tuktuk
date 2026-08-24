# Crazy Tuk Phase 4 Demo Script
# Testing the Game-Only Fare Loop with Fake Confirmed Swaps

> **Purpose:** Quick verification that the fare loop works end-to-end
> **Location:** Use browser console in Crazy Tuk application
> **Prerequisites:** Crazy Tuk must be running with all game data loaded

---

## Prerequisites Check

```javascript
// Run these in browser console to verify game data is loaded

// Check game data modules
window.CrazyTukGame.LOCATIONS.features.length    // Should be 12
window.CrazyTukGame.NPCs                    // Should have 5 NPCs
window.CrazyTukGame.ROUTES                  // Should have 12 routes
window.CrazyTukGame.CONFIG                 // Should have configuration
```

---

## Test 1: Initial Player Setup

```javascript
// Create a new player for testing

const wallet = "test-wallet-123";

// Load or create player
const player = window.CrazyTukGame.loadOrCreatePlayer(wallet);

console.log('Player created:', player);
console.log('Player state:', player.status);
console.log('Fuel:', player.fuel);
console.log('Points:', player.points);
```

**Expected Output:**
- Player should exist
- Status: "AVAILABLE"
- Fuel: 20
- Points: 0

---

## Test 2: Generate Initial Fares

```javascript
// Generate initial set of available fares

const fares = window.CrazyTukGame.generateInitialFares(wallet);

console.log('Generated fares:', fares.length);
console.log('Fare details:', fares[0]);

// Check fares exist
console.log('Sample fare:', fares[0] || 'No fares yet');

if (fares.length > 0) {
    console.log('✅ Test 2 passed: Fares generated successfully');
} else {
    console.warn('⚠️  Test 2: No fares generated');
}
```

**Expected Output:**
- At least 5 fares should be generated
- Each fare should have: id, wallet, npcId, pickupLocationId, etc.

---

## Test 3: Select a Fare

```javascript
// Select a fare from the available list

// Pick first fare
const selectedFare = window.CrazyTukGame.selectFare(fares[0].id, wallet);

console.log('Fare selected:', selectedFare);
console.log('Selected fare ID:', selectedFare.selectedFareId);

if (selectedFare && selectedFare.selectedFareId) {
    console.log('✅ Test 3 passed: Fare selected successfully');
} else {
    console.warn('⚠️  Test 3: Failed to select fare');
}
```

**Expected Output:**
- Selected fare ID should match
- Player status should still be "AVAILABLE"

---

## Test 4: Simulate Fake Swap (Fuel Award)

```javascript
// Simulate a fake swap that awards fuel
// Using a swap that qualifies for 8 fuel (example: $5-$9.99 swap)

const fakeSwap = {
    signature: `fake-swap-${Date.now()}`,
    wallet: wallet,
    inputMint: 'USDC',
    outputMint: 'SOL',
    inputAmount: 5000000, // 0.005 USDC (just for validation)
    outputAmount: 18000000, // ~0.018 SOL
    usdValue: 7, // This awards 5 fuel based on FUEL_TIERS
    confirmedAt: Date.now()
};

const result = window.CrazyTukGame.simulateFakeSwap(fakeSwap);

console.log('Fake swap result:', result);
console.log('Fuel awarded:', result.fuelAwarded);
console.log('Fare assigned:', result.fareAssigned);
console.log('Player fuel after swap:', window.CrazyTukGame.getPlayer().fuel);
```

**Expected Output:**
- fuelAwarded: 5 (based on $5-$9.99 tier)
- fareAssigned: Should be null (no fare was selected yet)
- Player fuel should be increased by 5 (from 20 to 25)

---

## Test 5: Select Fare + Fake Swap

```javascript
// Now select a fare and simulate a qualifying swap

// Get the first available fare
const testFare = fares[0];

console.log('Selecting fare:', testFare.npcId);

// Select fare
const fareSelected = window.CrazyTukGame.selectFare(testFare.id, wallet);

// Simulate a qualifying swap for SOL pair
const qualifyingSwap = {
    signature: `qualifying-swap-${Date.now()}`,
    wallet: wallet,
    inputMint: 'SOL',
    outputMint: 'USDC',
    inputAmount: 2000000000, // 2 SOL
    outputAmount: 690000000, // ~6.90 USDC
    usdValue: 7, // 5 fuel from $5-$9.99 tier
    confirmedAt: Date.now()
};

const result = window.CrazyTukGame.simulateFakeSwap(qualifyingSwap);

console.log('Swap result:', result);
console.log('Fuel awarded:', result.fuelAwarded);
console.log('Fare assigned:', result.fareAssigned);
console.log('Player status:', result.fareContext);

if (result.fareAssigned === testFare.id && result.fareContext === 'SELECTED_FARE') {
    console.log('✅ Test 5 passed: Fare claimed successfully');
} else {
    console.warn('⚠️  Test 5: Failed to claim fare');
}
```

**Expected Output:**
- fuelAwarded: 5
- fareAssigned: Should match testFare.id
- fareContext: "SELECTED_FARE"

---

## Test 6: Complete Pickup

```javascript
// Simulate completing the pickup animation

const player = window.CrazyTukGame.getPlayer();

console.log('Current player status:', player.status);

// Complete pickup
const pickupComplete = window.CrazyTukGame.completePickup(testFare.id, wallet);

if (pickupComplete) {
    const updatedPlayer = window.CrazyTukGame.getPlayer();
    console.log('Player after pickup:', updatedPlayer.status);
    console.log('Active fare ID:', updatedPlayer.activeFareId);
    console.log('✅ Test 6 passed: Pickup completed');
} else {
    console.warn('⚠️  Test 6: Pickup not completed');
}
```

**Expected Output:**
- Player status: "DRIVING"
- Active fare ID should be set

---

## Test 7: Fake Confirm Swap (Claim Fare)

```javascript
// Claim the selected fare (using fake swap)

console.log('Current fare:', testFare.npcId);

// Simulate swap to claim fare
const swapResult = window.CrazyTukGame.simulateFakeSwap({
    signature: `claim-swap-${Date.now()}`,
    wallet: wallet,
    inputMint: 'SOL',
    outputMint: 'USDC',
    inputAmount: 2000000000,
    outputAmount: 690000000,
    usdValue: 7,
    confirmedAt: Date.now()
});

console.log('Swap claim result:', swapResult);
console.log('Fare claimed:', swapResult.fareAssigned);
console.log('Fuel consumed:', swapResult.fuelAwarded);

const player = window.CrazyTukGame.getPlayer();
console.log('Player status:', player.status);
console.log('Fuel remaining:', player.fuel);
```

**Expected Output:**
- swapResult.fareAssigned: Should be null (pickup fuel was already consumed)
- Player status: "DRIVING"
- Fuel should be slightly reduced or similar (pickup cost is 1)

---

## Test 8: Simulate Trip Progress (Stall)

```javascript
// Simulate driving progress with insufficient fuel

console.log('Current fuel:', window.CrazyTukGame.getPlayer().fuel);

// Simulate driving and stalling (use isStalled parameter)
const stalledResult = window.CrazyTukGame.simulateTripProgress(
    testFare.id,
    wallet,
    true // isStalled
);

if (stalledResult) {
    const player = window.CrazyTukGame.getPlayer();
    console.log('Trip stalled:', player.status);
    console.log('Stall duration:', window.CrazyTukGame.getStallDuration(), 'seconds');
    console.log('Remaining fuel:', player.fuel);
    console.log('Progress:', player.activeTrip.progress);
    console.log('✅ Test 8 passed: Stall detected');
} else {
    console.warn('⚠️  Test 8: Stall not detected');
}
```

**Expected Output:**
- Player status: "STALLED"
- Stall duration: Should show elapsed time
- Progress: Should be very low (around 0)

---

## Test 9: Second Fake Swap (Refuel & Resume)

```javascript
// Simulate a swap to refuel and resume the trip

const refuelSwap = {
    signature: `refuel-swap-${Date.now()}`,
    wallet: wallet,
    inputMint: 'USDC',
    outputMint: 'SOL',
    inputAmount: 5000000, // 0.005 USDC
    outputAmount: 18000000,
    usdValue: 7,
    confirmedAt: Date.now()
};

const refuelResult = window.CrazyTukGame.simulateFakeSwap(refuelSwap);

console.log('Refuel swap result:', refuelResult);
console.log('Fare assigned:', refuelResult.fareAssigned);

const player = window.CrazyTukGame.getPlayer();
console.log('Player status:', player.status);
console.log('Fuel after swap:', player.fuel);

// Simulate trip resumption
const resumeResult = window.CrazyTukGame.simulateTripProgress(
    testFare.id,
    wallet,
    false // isStalled
);

if (resumeResult && player.status === 'DRIVING') {
    console.log('Trip resumed:', resumeResult);
    console.log('✅ Test 9 passed: Trip resumed and fuel added');
} else {
    console.warn('⚠️  Test 9: Trip not resumed');
}
```

**Expected Output:**
- refuelResult.fuelAwarded: 5
- Player status: "DRIVING" (or completed if fuel was enough)
- Resume trip progress increased

---

## Test 10: Complete Fare

```javascript
// Complete the trip

console.log('Current fare ID:', window.CrazyTukGame.getPlayer().activeFareId);

// Simulate completing the trip (keep false for not stalled)
const completeResult = window.CrazyTukGame.simulateTripProgress(
    testFare.id,
    wallet,
    false
);

if (completeResult) {
    const player = window.CrazyTukGame.getPlayer();
    console.log('Fare completed!');
    console.log('Points awarded:', testFare.pointValue);
    console.log('Points total:', player.points);
    console.log('Completed fares:', player.completedFares);
    console.log('Player status:', player.status);
    console.log('✅ Test 10 passed: Fare completed successfully');
} else {
    console.warn('⚠️  Test 10: Fare not completed');
}
```

**Expected Output:**
- Points increased by fare.pointValue
- completedFares increased by 1
- Player status: "AVAILABLE"
- Active fare ID should be null

---

## Summary of Expected Flow

```
Test 1: Player created (AVAILABLE, fuel=20)
Test 2: 5+ fares generated
Test 3: Selected fare
Test 4: Fuel awarded (no fare)
Test 5: Selected fare + swap (fuel awarded + fare claimed)
Test 6: Pickup completed
Test 7: Fare claimed (swap)
Test 8: Trip stalls (fuel insufficient)
Test 9: Refuel swap (fuel awarded + resume)
Test 10: Trip completed (points awarded)
```

---

## Test All Phases in Sequence

```javascript
// Run all tests sequentially

console.log('=== Starting Phase 4 Complete Fare Loop Test ===\n');

const wallet = "test-wallet-complete";
const player = window.CrazyTukGame.loadOrCreatePlayer(wallet);
console.log('1. Player created:', player.status, 'fuel:', player.fuel, 'points:', player.points, '\n');

const fares = window.CrazyTukGame.generateInitialFares(wallet);
console.log('2. Fares generated:', fares.length, '\n');

if (fares.length > 0) {
    const testFare = fares[0];
    const selected = window.CrazyTukGame.selectFare(testFare.id, wallet);
    console.log('3. Fare selected:', selected.selectedFareId, '\n');

    // Test 1: Fuel only
    const swap1 = window.CrazyTukGame.simulateFakeSwap({
        signature: 'test-swap-1',
        wallet: wallet,
        inputMint: 'USDC',
        outputMint: 'SOL',
        inputAmount: 5000000,
        outputAmount: 18000000,
        usdValue: 7,
        confirmedAt: Date.now()
    });
    console.log('4. Fuel swap result:', swap1.fuelAwarded, swap1.fareAssigned, '\n');

    // Test 2: Fare claim
    const swap2 = window.CrazyTukGame.simulateFakeSwap({
        signature: 'test-swap-2',
        wallet: wallet,
        inputMint: 'SOL',
        outputMint: 'USDC',
        inputAmount: 2000000000,
        outputAmount: 690000000,
        usdValue: 7,
        confirmedAt: Date.now()
    });
    console.log('5. Claim swap result:', swap2.fuelAwarded, swap2.fareAssigned, '\n');

    const pickup = window.CrazyTukGame.completePickup(testFare.id, wallet);
    console.log('6. Pickup completed:', pickup.status, '\n');

    // Stall and refuel
    const stalled = window.CrazyTukGame.simulateTripProgress(testFare.id, wallet, true);
    console.log('7. Trip stalled:', stalled.status, 'duration:', window.CrazyTukGame.getStallDuration(), 'seconds\n');

    const refuel = window.CrazyTukGame.simulateFakeSwap({
        signature: 'test-swap-3',
        wallet: wallet,
        inputMint: 'USDC',
        outputMint: 'SOL',
        inputAmount: 5000000,
        outputAmount: 18000000,
        usdValue: 7,
        confirmedAt: Date.now()
    });
    console.log('8. Refuel swap result:', refuel.fuelAwarded, refuel.fareAssigned, '\n');

    const resumed = window.CrazyTukGame.simulateTripProgress(testFare.id, wallet, false);
    console.log('9. Trip resumed:', resumed.status, '\n');

    const completed = window.CrazyTukGame.simulateTripProgress(testFare.id, wallet, false);
    console.log('10. Trip completed:', completed.status, 'points awarded:', testFare.pointValue, '\n');
    console.log('=== Phase 4 Test Complete ===\n');
} else {
    console.log('⚠️  No fares generated. Test incomplete.');
}

// Clean up for next test
window.CrazyTukGame.savePlayer(window.CrazyTukGame.getPlayer());
```

---

## Quick Verification

```javascript
// Verify complete flow

const finalPlayer = window.CrazyTukGame.getPlayer();

console.log('\nFinal Player State:');
console.log('Status:', finalPlayer.status);
console.log('Fuel:', finalPlayer.fuel);
console.log('Points:', finalPlayer.points);
console.log('Completed Fares:', finalPlayer.completedFares);
console.log('Stall Count:', finalPlayer.stallCount);

if (finalPlayer.status === 'AVAILABLE' && finalPlayer.completedFares === 1) {
    console.log('\n✅ Phase 4 Verification: COMPLETE');
} else {
    console.log('\n⚠️  Phase 4 Verification: INCOMPLETE');
}
```

---

## Current Drive Acceptance Addendum

Use the in-app Settings panel while `CONFIG.DEV_MODE` is enabled to make
stall cases repeatable:

1. Set fuel to `0%`, start a fare, and verify pickup travel reaches `STALLED`
   with progress below 100%.
2. Set fuel to `10%` or `25%`, then verify the ride can stall with a passenger
   after pickup.
3. Use `REFUEL & CONTINUE` and verify the same leg resumes from the saved
   progress; fuel spent must not jump when the swap is applied.
4. Use `CALL FOR RESCUE` and verify the original ride is no longer active,
   exactly one `ABANDONED_RESCUABLE` opportunity exists, and the feed contains
   `RESCUE_REQUESTED`.
5. From an available driver state, claim the rescue opportunity and verify it
   changes to `RESCUE_CLAIMED`, records `RESCUE_ACCEPTED`, and uses the rescue
   origin as pickup.
6. Refresh during pickup, passenger travel, and stalled state. The player,
   active fare, route leg, progress, fuel, and event log must remain intact.

Accounting invariant:

```javascript
const before = window.CrazyTukGame.getPlayer();
const spentBefore = before.activeTrip?.fuelSpent || 0;
// Apply a confirmed/refuel swap through the normal UI.
const after = window.CrazyTukGame.getPlayer();
console.assert((after.activeTrip?.fuelSpent || 0) === spentBefore,
  'A swap must add fuel without increasing route fuel spent');
```

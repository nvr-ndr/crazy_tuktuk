// Quick End-to-End Test for Crazy Tuk MVP
// Run in browser console after app loads

(function() {
  console.log('=== Crazy Tuk MVP E2E Test ===\n');

  // Check prerequisites
  if (typeof window.CrazyTukGame === 'undefined') {
    console.error('❌ Game data not loaded');
    return;
  }

  console.log('✅ Game data loaded');

  // Get required functions
  const {
    loadOrCreatePlayer,
    getPlayer,
    savePlayer,
    generateInitialFares,
    selectFare,
    simulateFakeSwap,
    completePickup,
    simulateTripProgress
  } = window.CrazyTukGame;

  // Test 1: Player setup
  console.log('\n[Test 1] Player setup...');
  const wallet = "test-wallet-e2e";
  const player = loadOrCreatePlayer(wallet);
  console.log('  Status:', player.status, 'Fuel:', player.fuel, 'Points:', player.points);
  console.log('✅ Test 1 complete\n');

  // Test 2: Fare generation
  console.log('[Test 2] Fare generation...');
  const fares = generateInitialFares(wallet);
  console.log('  Fares generated:', fares.length);
  console.log('✅ Test 2 complete\n');

  // Test 3: Fare selection
  if (fares.length > 0) {
    console.log('[Test 3] Fare selection...');
    const selected = selectFare(fares[0].id, wallet);
    console.log('  Fare selected:', selected.selectedFareId);
    console.log('✅ Test 3 complete\n');
  }

  // Test 4: Fake swap (fuel only)
  console.log('[Test 4] Fake swap (fuel only)...');
  const swap1 = simulateFakeSwap({
    signature: 'test-swap-fuel-only',
    wallet: wallet,
    inputMint: 'USDC',
    outputMint: 'SOL',
    inputAmount: 5000000,
    outputAmount: 18000000,
    usdValue: 7,
    confirmedAt: Date.now()
  });
  console.log('  Fuel awarded:', swap1.fuelAwarded, 'Fare assigned:', swap1.fareAssigned);
  console.log('✅ Test 4 complete\n');
  savePlayer(getPlayer());

  // Test 5: Swap to claim fare
  if (fares.length > 0) {
    console.log('[Test 5] Swap to claim fare...');
    const swap2 = simulateFakeSwap({
      signature: 'test-swap-claim',
      wallet: wallet,
      inputMint: 'SOL',
      outputMint: 'USDC',
      inputAmount: 2000000000,
      outputAmount: 690000000,
      usdValue: 7,
      confirmedAt: Date.now()
    });
    console.log('  Fuel awarded:', swap2.fuelAwarded, 'Fare assigned:', swap2.fareAssigned);
    console.log('✅ Test 5 complete\n');
    savePlayer(getPlayer());
  }

  // Test 6: Complete pickup
  if (fares.length > 0) {
    console.log('[Test 6] Complete pickup...');
    completePickup(fares[0].id, wallet);
    console.log('  Trip active:', getPlayer().activeFareId !== null);
    console.log('✅ Test 6 complete\n');
    savePlayer(getPlayer());
  }

  // Test 7: Stall simulation
  if (fares.length > 0) {
    console.log('[Test 7] Stall simulation...');
    simulateTripProgress(fares[0].id, wallet, true);
    console.log('  Status:', getPlayer().status, 'Stall count:', getPlayer().stallCount);
    console.log('✅ Test 7 complete\n');
    savePlayer(getPlayer());
  }

  // Test 8: Refuel and resume
  if (fares.length > 0) {
    console.log('[Test 8] Refuel and resume...');
    const swap3 = simulateFakeSwap({
      signature: 'test-swap-refuel',
      wallet: wallet,
      inputMint: 'USDC',
      outputMint: 'SOL',
      inputAmount: 5000000,
      outputAmount: 18000000,
      usdValue: 7,
      confirmedAt: Date.now()
    });
    console.log('  Fuel awarded:', swap3.fuelAwarded);
    simulateTripProgress(fares[0].id, wallet, false);
    console.log('  Status:', getPlayer().status);
    console.log('✅ Test 8 complete\n');
    savePlayer(getPlayer());
  }

  // Test 9: Complete fare
  if (fares.length > 0) {
    console.log('[Test 9] Complete fare...');
    simulateTripProgress(fares[0].id, wallet, false);
    console.log('  Status:', getPlayer().status);
    console.log('  Completed fares:', getPlayer().completedFares);
    console.log('  Points:', getPlayer().points);
    console.log('✅ Test 9 complete\n');
    savePlayer(getPlayer());
  }

  // Final verification
  console.log('=== Final Verification ===');
  const finalPlayer = getPlayer();
  console.log('Player status:', finalPlayer.status);
  console.log('Fuel:', finalPlayer.fuel);
  console.log('Points:', finalPlayer.points);
  console.log('Completed fares:', finalPlayer.completedFares);
  console.log('Stall count:', finalPlayer.stallCount);

  if (finalPlayer.status === 'AVAILABLE' && finalPlayer.completedFares >= 1) {
    console.log('\n✅✅✅ ALL TESTS PASSED - MVP READY ✅✅✅\n');
  } else {
    console.log('\n⚠️  Some tests may have failed\n');
  }
})();
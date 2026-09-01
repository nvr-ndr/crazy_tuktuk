export async function getDflowEligibility(wallet) {
  if (!wallet) return { eligible: false, qualifyingSwapCount: 0 };
  try {
    const response = await fetch(`/api/dflow/eligibility?wallet=${encodeURIComponent(wallet)}`);
    if (!response.ok) throw new Error('eligibility_lookup_failed');
    return await response.json();
  } catch (error) {
    console.warn('[dflow-eligibility] fail closed', error);
    return { eligible: false, qualifyingSwapCount: 0, error };
  }
}

const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');

const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const SYSTEM_PROGRAM = new PublicKey('11111111111111111111111111111111');
const RENT_SYSVAR = new PublicKey('SysvarRent111111111111111111111111111111111');

function signer(name) {
  const raw = process.env[name];
  if (!raw) return null;
  const normalized = raw.trim().replace(/^\[|\]$/g, '').trim();
  if (/^\d+(?:\s*,\s*\d+){63}$/.test(normalized)) return Keypair.fromSecretKey(Uint8Array.from(normalized.split(',').map(Number)));
  return Keypair.fromSecretKey(bs58.decode(normalized));
}

function ata(owner, mint) {
  return PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), mint.toBuffer()], ASSOCIATED_PROGRAM)[0];
}

async function transferUsdc({ signerEnv, destination, mint, amountAtomic }) {
  const { settlementNetwork } = require('./rewardSettlement');
  const network = settlementNetwork();
  if (!network.enabled || mint !== network.mint) return { configured: false, reason: network.reason };
  const payer = signer(signerEnv);
  if (!payer) return { configured: false };
  const mintKey = new PublicKey(mint);
  const destinationKey = new PublicKey(destination);
  const sourceAta = ata(payer.publicKey, mintKey);
  const destinationAta = ata(destinationKey, mintKey);
  const connection = new Connection(network.rpc, 'confirmed');
  const instructions = [];
  const info = await connection.getAccountInfo(destinationAta);
  if (!info) instructions.push(new TransactionInstruction({ programId: ASSOCIATED_PROGRAM, keys: [
    { pubkey: payer.publicKey, isSigner: true, isWritable: true }, { pubkey: destinationAta, isSigner: false, isWritable: true },
    { pubkey: destinationKey, isSigner: false, isWritable: false }, { pubkey: mintKey, isSigner: false, isWritable: false },
    { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false }, { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false }, { pubkey: RENT_SYSVAR, isSigner: false, isWritable: false }
  ], data: Buffer.alloc(0) }));
  const data = Buffer.alloc(9); data[0] = 3; data.writeBigUInt64LE(BigInt(amountAtomic), 1);
  instructions.push(new TransactionInstruction({ programId: TOKEN_PROGRAM, keys: [
    { pubkey: sourceAta, isSigner: false, isWritable: true }, { pubkey: destinationAta, isSigner: false, isWritable: true }, { pubkey: payer.publicKey, isSigner: true, isWritable: false }
  ], data }));
  const signature = await sendAndConfirmTransaction(connection, new Transaction().add(...instructions), [payer], { commitment: 'confirmed' });
  return { configured: true, signature, signer: payer.publicKey.toBase58() };
}

module.exports = { transferUsdc };

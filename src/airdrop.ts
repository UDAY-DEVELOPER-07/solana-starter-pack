import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const loadWallet = (): PublicKey => {
  const walletPath = path.resolve(__dirname, "wallet.json");

  if (!fs.existsSync(walletPath)) {
    console.error(
      "wallet.json not found! Please run `npm run start` to generate a wallet first."
    );
    process.exit(1);
  }

  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));

  if (!walletData.publicKey) {
    console.error(
      "Invalid wallet.json format. Ensure it contains a valid publicKey."
    );
    process.exit(1);
  }

  return new PublicKey(walletData.publicKey);
};

const airdropSol = async (publicKey: PublicKey, amount: number) => {
  try {
    // Connect to the devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Request airdrop
    console.log(
      `Requesting ${amount} SOL airdrop to ${publicKey.toBase58()}...`
    );
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );

    // Wait for the transaction to be confirmed
    const result = await connection.confirmTransaction(signature, "confirmed");
    console.log(`Airdrop successful! Transaction signature: ${signature}`);
    console.log("Transaction confirmation status:", result);
  } catch (error) {
    console.error("Airdrop failed:", error);
  }
};

// Main execution
const main = async () => {
  const walletPublicKey = loadWallet();
  const amount = 1;

  await airdropSol(walletPublicKey, amount);
};

main();

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const loadWallet = (): PublicKey => {
  const walletPath = path.resolve(__dirname, "wallet.json");

  if (!fs.existsSync(walletPath)) {
    console.error(
      "wallet.json not found! Please run `npm run wallet` to generate a wallet first."
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

/**
 * Check the balance of a wallet on the Solana devnet.
 */
const checkBalance = async (publicKey: PublicKey) => {
  try {
    // Connect to the devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Fetch the balance
    console.log(`Fetching balance for ${publicKey.toBase58()}...`);
    const balance = await connection.getBalance(publicKey);

    console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  } catch (error) {
    console.error("Failed to fetch balance:", error);
  }
};

// Main execution
const main = async () => {
  const walletPublicKey = loadWallet();
  await checkBalance(walletPublicKey);
};

main();

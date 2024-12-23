import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const generateWallet = () => {
  const keypair = Keypair.generate();
  const secretKey = Array.from(keypair.secretKey);
  const publicKey = keypair.publicKey.toBase58();

  const wallet = {
    publicKey,
    secretKey,
  };

  // Save to wallet.json
  const walletPath = path.resolve(__dirname, "wallet.json");
  fs.writeFileSync(walletPath, JSON.stringify(wallet, null, 2), "utf-8");
  console.log(`Wallet generated and saved to ${walletPath}`);
  console.log(`Public Key: ${publicKey}`);
};

generateWallet();

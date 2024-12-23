import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createMetadataAccountV3,
  DataV2Args,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  Creator,
  Collection,
  Uses,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  signerIdentity,
  none,
  publicKey,
} from "@metaplex-foundation/umi";
import * as fs from "fs";
import * as path from "path";
import { base58 } from "@metaplex-foundation/umi-serializers-encodings";

// Function to load wallet from wallet.json
const loadWalletJson = () => {
  const walletPath = path.resolve(__dirname, "wallet.json");

  if (!fs.existsSync(walletPath)) {
    console.error(
      "Wallet not found. Please generate a wallet using the wallet generation script."
    );
    process.exit(1);
  }

  console.log("Loading wallet from wallet.json...");
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  return walletData;
};

const loadWallet = (): Keypair => {
  const walletData = loadWalletJson();
  return Keypair.fromSecretKey(Uint8Array.from(walletData.secretKey));
};

// Initialize wallet and connection
const wallet = loadWallet();
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Define constants
const tokenDecimals = 1_000_000n; // Adjust as needed
const metadataUri =
  "https://raw.githubusercontent.com/A91y/sup-metadata/main/ssa/metadata.json";

(async () => {
  try {
    console.log("Step 1: Creating SPL Token Mint...");
    // Step 1: Create a new SPL token mint
    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey, // Mint authority
      wallet.publicKey, // Freeze authority
      6 // Decimals
    );
    console.log(`Token Mint Address: ${mint.toBase58()}`);
    console.log(
      `Explorer Link: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`
    );

    console.log("Step 2: Adding Metadata...");
    // Step 2: Add metadata to the mint
    const umi = createUmi("https://api.devnet.solana.com", "confirmed");
    const keypair = umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(wallet.secretKey)
    );
    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(signerIdentity(signer));

    const metadataAccounts: CreateMetadataAccountV3InstructionAccounts = {
      mint: publicKey(mint.toBase58()),
      mintAuthority: signer,
    };

    const metadataData: DataV2Args = {
      name: "Solana Starter by A91y",
      symbol: "SSA",
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: none<Creator[]>(),
      collection: none<Collection>(),
      uses: none<Uses>(),
    };

    const metadataArgs: CreateMetadataAccountV3InstructionArgs = {
      isMutable: true,
      collectionDetails: null,
      data: metadataData,
    };

    const metadataTx = createMetadataAccountV3(umi, {
      ...metadataAccounts,
      ...metadataArgs,
    });

    const metadataResult = await metadataTx.sendAndConfirm(umi);
    console.log(
      `Metadata Transaction Signature: ${
        base58.deserialize(metadataResult.signature)[0]
      }`
    );
    console.log(
      `Explorer Link: https://explorer.solana.com/tx/${
        base58.deserialize(metadataResult.signature)[0]
      }?cluster=devnet`
    );

    console.log("Step 3: Minting Tokens...");
    // Step 3: Mint tokens to an associated token account (ATA)
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      wallet.publicKey
    );
    console.log(`Associated Token Account: ${ata.address.toBase58()}`);
    console.log(
      `Explorer Link: https://explorer.solana.com/address/${ata.address.toBase58()}?cluster=devnet`
    );

    const mintTx = await mintTo(
      connection,
      wallet,
      mint,
      ata.address,
      wallet.publicKey,
      100n * tokenDecimals // Mint 100 tokens
    );
    console.log(`Mint Transaction Signature: ${mintTx}`);
    console.log(
      `Explorer Link: https://explorer.solana.com/tx/${mintTx}?cluster=devnet`
    );

    console.log("Workflow completed successfully!");
  } catch (error) {
    console.error(`Oops, something went wrong: ${error}`);
  }
})();

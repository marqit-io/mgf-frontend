import { Connection, PublicKey, VersionedTransactionResponse } from "@solana/web3.js";
import { getTokenMetadata } from "@solana/spl-token"
import { MgfMatrix as IDL } from "./idl";


export type MintInfo = {
    mintAddress: string;
    name: string | undefined;
    symbol: string | undefined;
    imageUrl: string | undefined;
    taxRate: number;
    distributionRate: number;
    burnRate: number;
    timestamp: number
}

export function subscribeToTokenTrades(
    onMint: (mint: MintInfo) => void
) {
    const connection = new Connection(
        import.meta.env.VITE_RPC_ENDPOINT,
        'confirmed'
    );

    const programAddress = IDL.address;

    let lastProcessedSignature: string | undefined;

    // Subscribe to all confirmed transactions
    const subscriptionId = connection.onLogs(
        new PublicKey(programAddress),
        async (logsInfo) => {
            const signature = logsInfo.signature;
            // Avoid processing the same transaction twice
            if (lastProcessedSignature === signature) return;
            lastProcessedSignature = signature;

            const isUpdateTransferFee = logsInfo.logs.find(item => item.includes("UpdateTransferFee"));
            if (!isUpdateTransferFee) return;

            try {
                const tx = await connection.getTransaction(signature, {
                    maxSupportedTransactionVersion: 0
                });

                if (tx) {
                    const mintInfo = await parseUpdateFeeTransaction(tx);
                    if (mintInfo) {
                        onMint(mintInfo);
                    }
                }
            } catch (error) {
                console.error('Error processing transaction:', error);
            }
        },
        'confirmed'
    );

    return () => {
        connection.removeOnLogsListener(subscriptionId);
    };
}

const parseUpdateFeeTransaction = async (tx: VersionedTransactionResponse) => {
    // Get the discriminator for updateTransferFee instruction
    const discriminator = IDL.instructions.find(ix => ix.name === "updateTransferFee")?.discriminator;
    if (!discriminator) return null;

    // Convert discriminator to Uint8Array for comparison
    const discriminatorBytes = new Uint8Array(discriminator);

    // Find instruction that starts with our discriminator
    const instruction = tx.transaction.message.compiledInstructions.find(ix => {
        // Convert instruction data to Uint8Array
        const instructionData = new Uint8Array(ix.data);

        // Check if the instruction data starts with our discriminator
        // by comparing the first 8 bytes
        if (instructionData.length < 8) return false;

        for (let i = 0; i < 8; i++) {
            if (instructionData[i] !== discriminatorBytes[i]) {
                return false;
            }
        }
        return true;
    });

    if (!instruction) return null;

    // Get the mint address from the instruction accounts
    // For VersionedTransactionResponse, we need to use accountKeys array
    const mintAddress = tx.transaction.message.staticAccountKeys[instruction.accountKeyIndexes[1]].toString();
    const dataView = new DataView(instruction.data.buffer);

    // Read values at their respective offsets
    const transferFeeBps = dataView.getInt16(8, true);  // true for little-endian
    const distributeFeeBps = dataView.getInt16(10, true);
    const burnFeeBps = dataView.getInt16(12, true);

    const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT, 'confirmed');

    const tokenMetadata = await getTokenMetadata(connection, new PublicKey(mintAddress));

    let imageUrl = "";
    if (tokenMetadata?.uri) {
        try {
            const response = await fetch(tokenMetadata.uri);
            const metadata = await response.json();
            imageUrl = metadata.image || ""; // Most NFT metadata standards use 'image' field
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    }

    return {
        mintAddress,
        name: tokenMetadata?.name,
        symbol: tokenMetadata?.symbol,
        imageUrl: imageUrl,
        taxRate: transferFeeBps / 100,
        distributionRate: distributeFeeBps / 100,
        burnRate: burnFeeBps / 100,
        timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now()
    };
};

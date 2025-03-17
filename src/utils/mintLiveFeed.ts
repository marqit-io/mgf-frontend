import { Connection, PublicKey, VersionedTransactionResponse } from "@solana/web3.js";
import { getTokenMetadata } from "@solana/spl-token"
import { MgfMatrix as IDL } from "./idl";
import { changeGateway } from "./getData";


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

export function subscribeToTokenMints(
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

            const isMintToken = logsInfo.logs.find(item => item.includes("MintToken"));
            if (!isMintToken) return;
            console.log("Here!");
            debugger;
            try {
                const tx = await connection.getTransaction(signature, {
                    maxSupportedTransactionVersion: 0
                });

                if (tx) {
                    const mintInfo = await parseMintTokenTransaction(tx);
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

const parseMintTokenTransaction = async (tx: VersionedTransactionResponse) => {
    // Get the discriminator for updateTransferFee instruction
    const discriminator = IDL.instructions.find(ix => ix.name === "mintToken")?.discriminator;
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
    let offset = 8;
    const uriLen = dataView.getUint32(offset, true);
    offset += 4 + uriLen;
    const symbolLen = dataView.getUint32(offset, true);
    offset += 4 + symbolLen;
    const nameLen = dataView.getUint32(offset, true);
    offset += 4 + nameLen;
    offset += 1;
    const transferFeeBps = dataView.getInt16(offset, true);  // true for little-endian
    offset += 2;
    const distributeFeeBps = dataView.getInt16(offset, true);
    offset += 2;
    const burnFeeBps = dataView.getInt16(offset, true);

    const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT, 'confirmed');

    const tokenMetadata = await getTokenMetadata(connection, new PublicKey(mintAddress));

    let imageUrl = "";
    if (tokenMetadata?.uri) {
        try {
            const response = await fetch(changeGateway(tokenMetadata.uri));
            const metadata = await response.json();
            imageUrl = changeGateway(metadata.image) || ""; // Most NFT metadata standards use 'image' field
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

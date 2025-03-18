import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { Connection } from "@solana/web3.js";

class RaydiumService {
    private static instance: Raydium | null = null;
    private static connection: Connection;

    static async getInstance(): Promise<Raydium> {
        if (!RaydiumService.instance) {
            RaydiumService.connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
            RaydiumService.instance = await Raydium.load({
                connection: RaydiumService.connection,
                cluster: import.meta.env.VITE_CLUSTER
            });
        }
        return RaydiumService.instance;
    }
}

export default RaydiumService; 
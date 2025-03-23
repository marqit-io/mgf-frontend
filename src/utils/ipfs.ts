import { PinataSDK } from "pinata-web3";

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: File;
  extensions: {
    telegram?: string;
    website?: string;
    twitter?: string;
  };
  attributes: {
    transferTax: number;
    taxDistribution: {
      burn: number;
      distribute: number;
    };
    glitchInterval: number;
  };
}

export async function uploadTokenMetadata(metadata: TokenMetadata): Promise<string> {
  try {
    const pinata = new PinataSDK({
      pinataJwt: import.meta.env.VITE_PINATA_JWT,
      pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
      pinataGatewayKey: import.meta.env.VITE_PINATA_GATEWAY_KEY,
    });

    const imageResult = await pinata.upload.file(metadata.image);
    const imageUrl = `https://ipfs.io/ipfs/${imageResult.IpfsHash}`;

    console.log(imageUrl);

    const tokenMetadata = {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      image: imageUrl,
      extensions: metadata.extensions,
      attributes: metadata.attributes
    };

    const metadataResult = await pinata.upload.json(tokenMetadata);

    console.log(`https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`);
    return `https://ipfs.io/ipfs/${metadataResult.IpfsHash}`;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error uploading to IPFS:', error.message);
      throw new Error(`Failed to upload token metadata: ${error.message}`);
    } else {
      console.error('Error uploading to IPFS:', error);
      throw new Error('Failed to upload token metadata: Unknown error');
    }
  }
}
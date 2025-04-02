import { useState, useRef, useEffect } from 'react';
import { X, ArrowUpRight, ArrowLeft, Search, Plus, Flame, Gift, Timer, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadTokenMetadata, TokenMetadata } from '../utils/ipfs';
import { useWallet } from '@solana/wallet-adapter-react';
import { buildMintTokenInstruction, buildCreatePoolInstruction, buildDepositPoolInstruction, buildLockLiquidityInstruction, buildUnwrapSolInstruction, buildWrapSolInstruction, buildBuyInstruction } from '../utils/instructionBuilders';
import {
  Keypair,
  Transaction,
  PublicKey,
  Connection,
  ComputeBudgetProgram,
  SystemProgram
} from '@solana/web3.js';
import bs58 from 'bs58';
import axios from 'axios';
import { calculateLaunchParameters, SOL_PARAMS, getEstimatedTokenAmount } from '../utils/poolConfig';
import { BN } from '@coral-xyz/anchor';
import { getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
interface TokenDistribution {
  address: string;
  name: string;
  symbol: string;
}

function CreateCoinPage() {
  const navigate = useNavigate();
  const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
  const { publicKey: minterPublicKey, signTransaction, connected, signAllTransactions } = useWallet();
  const [step, setStep] = useState<'form' | 'initial-buy'>('form');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    step: string;
    status: 'pending' | 'completed' | 'error';
    error?: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    description: '',
    transferTax: 0,
    taxDistribution: {
      burn: 50,
      distribute: 50
    },
    taxOption: 'none',
    glitchInterval: 300,
    telegramLink: '',
    websiteLink: '',
    twitterLink: '',
    tokenDistribution: {
      enabled: false,
      token: null as TokenDistribution | null
    }
  });

  const [maxSol, setMaxSol] = useState('0');
  const [estimatedTokens, setEstimatedTokens] = useState<string>('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TokenDistribution[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const getTokenProgram = async (tokenMint: PublicKey) => {
    const connection = new Connection(import.meta.env.VITE_RPC_ENDPOINT);
    const tokenAccount = await connection.getAccountInfo(tokenMint);
    if (tokenAccount?.owner.toBase58() != TOKEN_PROGRAM_ID.toBase58() && tokenAccount?.owner.toBase58() != TOKEN_2022_PROGRAM_ID.toBase58()) {
      throw new Error("Token is not a valid SPL token");
    }
    return tokenAccount?.owner;
  }

  const handleTaxTypeSelect = (type: 'none' | 'distribute' | 'burn' | 'both') => {
    setFormData(prev => ({
      ...prev,
      transferTax: type === 'none' ? 0 : 5,
      taxOption: type,
      taxDistribution: type === 'burn'
        ? { burn: 100, distribute: 0 }
        : type === 'distribute'
          ? { burn: 0, distribute: 100 }
          : { burn: 50, distribute: 50 },
      tokenDistribution: {
        enabled: type === 'distribute' || type === 'both',
        token: type === 'distribute' || type === 'both' ? prev.tokenDistribution.token : null
      }
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'transferTax' && parseInt(value) === 0) {
      setFormData(prev => ({
        ...prev,
        transferTax: parseInt(value),
        taxOption: 'none',
        taxDistribution: {
          burn: 50,
          distribute: 50
        },
        tokenDistribution: {
          enabled: false,
          token: null
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'transferTax' ? parseInt(value) : value
      }));
    }
  };

  const handleDistributionChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      taxDistribution: {
        burn: value,
        distribute: 100 - value
      }
    }));
  };

  const handleGlitchIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      glitchInterval: parseInt(e.target.value, 10)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSearchToken = async (query: string) => {
    setSearchQuery(query.trim());
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        axios.get<{ result: Array<any> }>(`https://deep-index.moralis.io/api/v2.2/tokens/search?query=${searchQuery}&chains=solana&limit=3`, { headers: { "X-API-Key": import.meta.env.VITE_MORALIS_API_KEY } }).then((response) => {
          setSearchResults(response.data.result.filter(item => item.securityScore > 50).map(item => {
            return {
              address: item.tokenAddress,
              name: item.name,
              symbol: item.symbol
            }
          }));
          setIsSearching(false);
        }).catch((error) => {
          console.error('Error searching for token:', error);
          setIsSearching(false);
        });
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery])

  const selectDistributionToken = (token: TokenDistribution) => {
    setFormData(prev => ({
      ...prev,
      tokenDistribution: {
        enabled: true,
        token
      }
    }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeDistributionToken = () => {
    setFormData(prev => ({
      ...prev,
      tokenDistribution: {
        enabled: false,
        token: null
      }
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!selectedFile) {
      errors.push('Please upload a token image');
    }

    if (formData.transferTax > 0 && formData.taxOption === 'none') {
      errors.push('Please select a distribution method when tax is enabled');
    }

    if ((formData.taxOption === 'distribute' || formData.taxOption === 'both') &&
      !formData.tokenDistribution.token) {
      errors.push('Please select a token to distribute');
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);

    if (errors.length === 0) {
      setStep('initial-buy');
    }
  };

  // Get unused vanity address from database
  const getUnusedVanityAddress = async () => {
    const response = await axios.get(`${import.meta.env.VITE_BACKEND_API_BASEURL}/v1/keys`);
    return Keypair.fromSecretKey(new Uint8Array(bs58.decode(response.data.private_key)));
  };

  const prepareAllTransactions = async (
    minterPublicKey: PublicKey,
    mintKeypair: Keypair,
    tokenMetadata: any,
    tokenFeeParams: any,
    poolParams: any,
    tokenRewardMint: PublicKey,
    tokenRewardProgram: PublicKey,
    positionNFTMintKeypair: Keypair,
    feeAccountKeypair: Keypair
  ) => {
    // 1. Mint Token Transaction
    const mintTx = new Transaction();
    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: 350000,
    });
    const mintTokenRes = await buildMintTokenInstruction(
      minterPublicKey,
      mintKeypair.publicKey,
      tokenMetadata,
      tokenFeeParams,
      tokenRewardMint,
      tokenRewardProgram
    );
    const mintTokenIx = mintTokenRes.instruction;
    mintTx.add(mintTokenIx);
    mintTx.add(computeBudgetIx);
    mintTx.feePayer = minterPublicKey;

    // 2. Create Pool Transaction
    const createPoolTx = new Transaction();
    const createPoolResult = await buildCreatePoolInstruction(
      minterPublicKey,
      mintKeypair.publicKey,
      new PublicKey("So11111111111111111111111111111111111111112"),
      poolParams.initialSqrtPriceX64,
      new BN(0)
    );
    const createPoolIx = createPoolResult.instruction;
    createPoolTx.add(createPoolIx);
    createPoolTx.feePayer = minterPublicKey;

    // 3. Deposit Pool Transaction
    const depositPoolTx = new Transaction();
    const wrapSolIx = await buildWrapSolInstruction(
      minterPublicKey,
      poolParams.quoteMax
    );
    const depositPoolIx = await buildDepositPoolInstruction(
      minterPublicKey,
      mintKeypair.publicKey,
      new PublicKey("So11111111111111111111111111111111111111112"),
      positionNFTMintKeypair.publicKey,
      {
        baseMax: poolParams.baseMax,
        quoteMax: poolParams.quoteMax,
        maxTick: poolParams.maxTick,
        minTick: poolParams.minTick
      }
    );
    const unwrapSolIx = await buildUnwrapSolInstruction(
      minterPublicKey
    );
    depositPoolTx.add(wrapSolIx);
    depositPoolTx.add(depositPoolIx);
    depositPoolTx.add(unwrapSolIx);
    depositPoolTx.feePayer = minterPublicKey;

    // 4. Lock Pool Transaction
    const lockPoolTx = new Transaction();
    const lockPoolIx = await buildLockLiquidityInstruction(
      minterPublicKey,
      feeAccountKeypair.publicKey,
      positionNFTMintKeypair.publicKey,
    );
    lockPoolTx.add(lockPoolIx);
    lockPoolTx.add(computeBudgetIx);
    lockPoolTx.feePayer = minterPublicKey;

    // 5. Jito fee transaction
    const jitoFeeReceipt = new PublicKey(import.meta.env.VITE_JITO_TIP_ACCOUNT);
    const jitoFeeAmount = Number(import.meta.env.VITE_JITO_TIP_AMOUNT);

    const jitoFeeTx = new Transaction();
    const jitoFeeIx = SystemProgram.transfer({
      fromPubkey: minterPublicKey,
      toPubkey: jitoFeeReceipt,
      lamports: jitoFeeAmount
    });
    jitoFeeTx.add(jitoFeeIx);
    jitoFeeTx.feePayer = minterPublicKey;

    return {
      transactions: [mintTx, createPoolTx, depositPoolTx, lockPoolTx, jitoFeeTx],
      keys: createPoolResult.keys,
      distributionWallet: mintTokenRes.distributionWallet
    };
  };

  const MAX_POLLING_TIME = 120000; // 2 minutes in milliseconds
  const POLLING_INTERVAL = 2000; // 2 seconds between attempts

  async function pollBundleStatus(bundleStatusPayload: any) {
    const startTime = Date.now();

    const jitoBundleEndpoint = `${import.meta.env.VITE_JITO_ENDPOINT}/api/v1`;

    while (Date.now() - startTime < MAX_POLLING_TIME) {
      const bundleStatusResponse = await fetch(`${jitoBundleEndpoint}/getBundleStatuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bundleStatusPayload),
      });

      const response = await bundleStatusResponse.json();

      if (response?.result?.value[0]?.confirmation_status === "confirmed") {
        return true;
      }

      // Wait before next polling attempt
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }

    throw new Error('Bundle confirmation timed out after 2 minutes');
  }

  const handleInitialBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !minterPublicKey || !signTransaction || !signAllTransactions) {
      alert('Please connect your wallet first');
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus({ step: 'Initializing deployment...', status: 'pending' });

    try {
      if (!selectedFile) {
        throw new Error('No image file selected');
      }

      // Upload metadata to IPFS
      setDeploymentStatus({ step: 'Uploading metadata to IPFS...', status: 'pending' });
      const metadata: TokenMetadata = {
        name: formData.name,
        symbol: formData.ticker,
        description: formData.description,
        image: selectedFile,
        extensions: {
          telegram: formData.telegramLink || undefined,
          website: formData.websiteLink || undefined,
          twitter: formData.twitterLink || undefined,
        },
        attributes: {
          transferTax: formData.transferTax,
          taxDistribution: formData.taxDistribution,
          glitchInterval: formData.glitchInterval,
        }
      };

      const ipfsUrl = await uploadTokenMetadata(metadata);
      console.log('Token metadata uploaded to IPFS:', ipfsUrl);
      setDeploymentStatus({ step: 'Metadata uploaded successfully', status: 'completed' });

      // Get mint keypair from database
      setDeploymentStatus({ step: 'Generating token address...', status: 'pending' });
      const mintKeypair = await getUnusedVanityAddress();
      console.log('Using vanity address:', mintKeypair.publicKey.toString());
      setDeploymentStatus({ step: 'Token address generated', status: 'completed' });

      // Create token metadata args
      const tokenMetadata = {
        uri: ipfsUrl,
        name: formData.name,
        symbol: formData.ticker,
      };

      const tokenRewardMint = formData.tokenDistribution.token ? new PublicKey(formData.tokenDistribution.token.address) : new PublicKey("So11111111111111111111111111111111111111112");
      const tokenRewardProgram = await getTokenProgram(tokenRewardMint);

      // Create token params
      const tokenFeeParams = {
        isDistributeToken: formData.tokenDistribution.enabled,
        transferFeeBps: formData.transferTax * 100,
        distributeFeeBps: formData.taxDistribution.distribute * 100,
        burnFeeBps: formData.taxDistribution.burn * 100,
        tokenRewardMint: tokenRewardMint,
        distributionInterval: formData.glitchInterval
      };

      const poolParams = calculateLaunchParameters(SOL_PARAMS, mintKeypair.publicKey);

      const positionNFTMintKeypair = Keypair.generate();
      const feeAccountKeypair = Keypair.generate();

      // Prepare all transactions
      setDeploymentStatus({ step: 'Preparing transactions...', status: 'pending' });
      const { transactions: allTransactions, keys, distributionWallet } = await prepareAllTransactions(
        minterPublicKey,
        mintKeypair,
        tokenMetadata,
        tokenFeeParams,
        poolParams,
        tokenRewardMint,
        tokenRewardProgram,
        positionNFTMintKeypair,
        feeAccountKeypair
      );

      // Get latest blockhash
      let blockhash = await connection.getLatestBlockhash();
      allTransactions.forEach(tx => {
        tx.recentBlockhash = blockhash.blockhash;
      });

      // Add necessary signatures
      allTransactions[0].partialSign(mintKeypair);
      allTransactions[2].partialSign(positionNFTMintKeypair);
      allTransactions[3].partialSign(feeAccountKeypair);

      // Sign all transactions with wallet
      setDeploymentStatus({ step: 'Signing transactions...', status: 'pending' });
      const signedTransactions = await signAllTransactions(allTransactions);

      // Prepare bundle for Jito
      const bundle = signedTransactions.map(tx => tx.serialize().toString('base64'));
      const jitoBundleEndpoint = `${import.meta.env.VITE_JITO_ENDPOINT}/api/v1`;

      // Send bundle to Jito
      setDeploymentStatus({ step: 'Submitting transaction bundle...', status: 'pending' });
      const bundlePayload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sendBundle",
        "params": [
          bundle,
          {
            "encoding": "base64"
          }
        ]
      }

      const response = await fetch(`${jitoBundleEndpoint}/bundles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bundlePayload),
      });

      if (!response) {
        throw new Error('Failed to submit bundle to Jito');
      }

      const { result: bundleId } = await response.json();
      setDeploymentStatus({ step: 'Bundle submitted successfully', status: 'completed' });

      // Wait for bundle confirmation
      setDeploymentStatus({ step: 'Waiting for bundle confirmation...', status: 'pending' });
      const bundleStatusPayload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getBundleStatuses",
        "params": [
          [bundleId]
        ]
      }

      await pollBundleStatus(bundleStatusPayload);

      setDeploymentStatus({ step: 'Bundle confirmed successfully', status: 'completed' });
      const decimal = (await getMint(connection, tokenRewardMint, 'confirmed', tokenRewardProgram)).decimals;

      const tokenPayload = {
        token_mint: mintKeypair.publicKey.toBase58(),
        name: formData.name,
        symbol: formData.ticker,
        tax_rate: formData.transferTax * 100,
        burn_rate: formData.transferTax == 0 ? 0 : formData.taxDistribution.burn * 100,
        distribution_rate: formData.transferTax == 0 ? 0 : formData.taxDistribution.distribute * 100,
        interval: formData.glitchInterval,
        distribution_mint: tokenRewardMint,
        distribution_mint_program: tokenRewardProgram.toBase58(),
        distribution_mint_decimals: decimal,
        distribution_wallet: distributionWallet.toBase58(),
        uri: ipfsUrl,
        pool_token_account: keys.token_0_vault
      }

      setDeploymentStatus({ step: 'Sending info to server...', status: 'pending' });
      const postTokenResult = await fetch(`https://api.moneyglitch.fun/v1/tokens`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokenPayload)
        }
      )

      if (!postTokenResult.ok) {
        console.error("Failed to post token to API");
      }

      const postPoolResult = await fetch(`https://api.moneyglitch.fun/v1/pools`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(keys)
        }
      );

      if (!postPoolResult.ok) {
        console.error('Failed to post pool to API');
      }

      setDeploymentStatus({ step: 'Buying initial tokens', status: 'pending' });

      const buySolAmount = new BN(Number(maxSol) * 10 ** 9);
      const initialBuyTx = new Transaction();
      const wrapSolIx = await buildWrapSolInstruction(minterPublicKey, buySolAmount);
      const initialBuyIx = await buildBuyInstruction(
        minterPublicKey,
        new PublicKey(keys.pool_id),
        new PublicKey("So11111111111111111111111111111111111111112"),
        mintKeypair.publicKey,
        0,
        buySolAmount
      );
      const unwrapSolIx = await buildUnwrapSolInstruction(minterPublicKey);

      initialBuyTx.add(wrapSolIx);
      initialBuyTx.add(initialBuyIx);
      initialBuyTx.add(unwrapSolIx);

      initialBuyTx.feePayer = minterPublicKey;
      const latestBlockhash = await connection.getLatestBlockhash();
      initialBuyTx.recentBlockhash = latestBlockhash.blockhash;

      const signedInitialBuyTx = await signTransaction(initialBuyTx);
      const txHash = await connection.sendRawTransaction(signedInitialBuyTx.serialize());

      const txStatus = await connection.confirmTransaction({
        signature: txHash,
        ...latestBlockhash
      });

      if (txStatus.value.err) {
        throw new Error('Transaction failed');
      }

      setDeploymentStatus({ step: 'Successfully bought initial tokens', status: 'completed' });
      navigate(`/token/${mintKeypair.publicKey.toBase58()}`);
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus({
        step: 'Deployment failed',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const glitchIntervals = [
    { value: 300, label: '5 Minutes' },
    { value: 900, label: '15 Minutes' },
    { value: 1800, label: '30 Minutes' },
    { value: 3600, label: '1 Hour' },
    { value: 7200, label: '2 Hours' },
    { value: 14400, label: '4 Hours' },
    { value: 21600, label: '6 Hours' },
    { value: 43200, label: '12 Hours' },
    { value: 86400, label: '24 Hours' },
    { value: 172800, label: '2 Days' },
    { value: 432000, label: '5 Days' },
    { value: 864000, label: '10 Days' },
    { value: 1728000, label: '20 Days' },
    { value: 2592000, label: '30 Days' }
  ];

  const calculateEstimatedTokens = (solAmount: string) => {
    try {
      const solAmountBN = new BN(Number(solAmount) * 10 ** 9); // Convert to lamports
      const tokenAmount = getEstimatedTokenAmount(SOL_PARAMS, solAmountBN);
      // Format the token amount to a readable string with 2 decimal places
      const formattedAmount = (tokenAmount.toNumber() / 10 ** 6).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setEstimatedTokens(formattedAmount);
    } catch (error) {
      console.error('Error calculating estimated tokens:', error);
      setEstimatedTokens('0');
    }
  };

  const handleMaxSolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxSol(value);
    calculateEstimatedTokens(value);
  };

  if (step === 'initial-buy') {
    return (
      <div className="max-w-2xl mx-auto terminal-card p-6">
        <h1 className="terminal-header text-2xl mb-8">&gt; DEPOSIT_POOL_CONFIGURATION</h1>
        <form onSubmit={handleInitialBuySubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="initialBuyAmount" className="block text-sm mb-2">
                &gt; MAX_SOL_DEPOSIT
              </label>
              <input
                type="number"
                id="depositSOLAmount"
                value={maxSol}
                onChange={handleMaxSolChange}
                min="0"
                max="100"
                step="0.1"
                className="terminal-input w-full px-3 py-2"
                required
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs opacity-70">
                  This amount will be set as the maximum SOL deposit for the initial buy.
                  Maximum: 100 SOL
                </p>
                <p className="text-sm text-[#00ff00]">
                  Estimated token amount: {estimatedTokens} {formData.ticker || 'tokens'}
                </p>
              </div>
            </div>

            <div className="bg-black/30 p-4 rounded border border-[#00ff00]/20">
              <h3 className="text-sm mb-3">&gt; DEPLOYMENT_SUMMARY</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-70">Token Name:</span>
                  <span>{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Token Symbol:</span>
                  <span>{formData.ticker}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Tax Rate:</span>
                  <span>{formData.transferTax}%</span>
                </div>
                {formData.transferTax > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="opacity-70">Distribution Type:</span>
                      <span>
                        {formData.taxOption === 'burn' && 'BURN'}
                        {formData.taxOption === 'distribute' && 'REWARD'}
                        {formData.taxOption === 'both' && 'MIX'}
                        {formData.taxOption === 'none' && 'NONE'}
                      </span>
                    </div>
                    {formData.taxOption === 'both' && (
                      <div className="flex justify-between">
                        <span className="opacity-70">Distribution Ratio:</span>
                        <span>{formData.taxDistribution.burn}% BURN / {formData.taxDistribution.distribute}% REWARD</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="opacity-70">Glitch Interval:</span>
                      <span>{glitchIntervals.find(i => i.value === formData.glitchInterval)?.label}</span>
                    </div>
                    {formData.tokenDistribution.token && (
                      <div className="flex justify-between">
                        <span className="opacity-70">Distribution Token:</span>
                        <span>{formData.tokenDistribution.token.symbol}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 border border-[#00ff00]/50 bg-[#00ff00]/5 rounded-lg">
            <div className="flex items-start gap-3">
              <div>
                <p className="text-sm text-[#00ff00]">
                  {`Token2022 programme will burn ${formData.transferTax}% of supply upon pool creation`}
                </p>
              </div>
            </div>
          </div>

          {deploymentStatus && (
            <div className={`p-4 rounded border ${deploymentStatus.status === 'error'
              ? 'border-red-500 bg-red-500/10'
              : 'border-[#00ff00]/20 bg-black/30'
              }`}>
              <div className="flex items-center gap-2">
                {deploymentStatus.status === 'pending' && (
                  <div className="animate-spin w-4 h-4 border-2 border-[#00ff00] border-t-transparent rounded-full" />
                )}
                {deploymentStatus.status === 'completed' && (
                  <div className="w-4 h-4 text-[#00ff00]">✓</div>
                )}
                {deploymentStatus.status === 'error' && (
                  <div className="w-4 h-4 text-red-500">×</div>
                )}
                <span className={deploymentStatus.status === 'error' ? 'text-red-500' : ''}>
                  {deploymentStatus.step}
                </span>
              </div>
              {deploymentStatus.error && (
                <p className="mt-2 text-sm text-red-400">{deploymentStatus.error}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="terminal-button px-4 py-2 flex-1"
              disabled={isDeploying}
            >
              &gt; BACK
            </button>
            <button
              type="submit"
              className="terminal-button px-4 py-2 flex-1 flex items-center justify-center gap-2"
              disabled={isDeploying}
            >
              {isDeploying ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-[#00ff00] border-t-transparent rounded-full" />
                  <span>DEPLOYING...</span>
                </>
              ) : (
                <>
                  <span>&gt; DEPLOY_TOKEN</span>
                  <ArrowUpRight size={16} className="text-[#00ff00]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto terminal-card p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="terminal-header text-2xl">&gt; CREATE_NEW_TOKEN</h1>
        <button
          onClick={() => navigate('/')}
          className="terminal-button px-3 py-1.5 text-xs flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          BACK
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formErrors.length > 0 && (
          <div className="bg-red-900/20 border border-red-500 rounded p-3">
            {formErrors.map((error, index) => (
              <div key={index} className="text-red-400 text-sm">{error}</div>
            ))}
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm mb-1">
              &gt; NAME <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="terminal-input w-full px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="ticker" className="block text-sm mb-1">
              &gt; TICKER <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="ticker"
              name="ticker"
              value={formData.ticker}
              onChange={handleInputChange}
              className="terminal-input w-full px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm mb-1">
              &gt; DESCRIPTION <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="terminal-input w-full px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              &gt; UPLOAD_MEDIA <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center space-x-4">
              {!selectedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="terminal-button px-4 py-2"
                >
                  SELECT_FILE
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 relative border border-[#00ff00] rounded-lg overflow-hidden">
                    {selectedFile.type.startsWith('image/') ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={previewUrl} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="terminal-button p-2 hover:bg-red-500/10"
                    title="Remove file"
                  >
                    <X size={16} className="text-red-400" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="space-y-4">
          <div className="bg-black/30 p-4 rounded border border-[#00ff00]/20">
            <h3 className="text-lg font-bold mb-2">&gt; TOKENOMICS</h3>
            <p className="text-sm opacity-70 mb-4">Select your token's economic model below</p>

            {/* Tax Type Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleTaxTypeSelect('none')}
                className={`p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.02] border rounded-lg ${formData.taxOption === 'none'
                  ? 'bg-[#00ff00]/10 border-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                  : 'bg-black/30 border-[#00ff00]/20'
                  }`}
              >
                <Timer size={24} className="mx-auto mb-2" />
                <h4 className="font-bold mb-1">NO TAX</h4>
                <p className="text-xs opacity-70">Launch a standard token without any tax mechanism</p>
              </button>

              <button
                type="button"
                onClick={() => handleTaxTypeSelect('distribute')}
                className={`p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.02] border rounded-lg ${formData.taxOption === 'distribute'
                  ? 'bg-[#00ff00]/10 border-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                  : 'bg-black/30 border-[#00ff00]/20'
                  }`}
              >
                <Gift size={24} className="mx-auto mb-2 text-green-400" />
                <h4 className="font-bold mb-1">REWARD</h4>
                <p className="text-xs opacity-70">Distribute rewards to holders in your chosen token</p>
              </button>

              <button
                type="button"
                onClick={() => handleTaxTypeSelect('burn')}
                className={`p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.02] border rounded-lg ${formData.taxOption === 'burn'
                  ? 'bg-[#00ff00]/10 border-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                  : 'bg-black/30 border-[#00ff00]/20'
                  }`}
              >
                <Flame size={24} className="mx-auto mb-2 text-red-400" />
                <h4 className="font-bold mb-1">BURN</h4>
                <p className="text-xs opacity-70">Automatically burn tokens to reduce supply</p>
              </button>

              <button
                type="button"
                onClick={() => handleTaxTypeSelect('both')}
                className={`p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.02] border rounded-lg ${formData.taxOption === 'both'
                  ? 'bg-[#00ff00]/10 border-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                  : 'bg-black/30 border-[#00ff00]/20'
                  }`}
              >
                <Sparkles size={24} className="mx-auto mb-2 text-yellow-400" />
                <h4 className="font-bold mb-1">MIX</h4>
                <p className="text-xs opacity-70">Split tax between burn and rewards</p>
              </button>
            </div>

            {/* Advanced Tax Settings */}
            {formData.taxOption !== 'none' && (
              <div className="space-y-4 pt-4 border-t border-[#00ff00]/20">
                <div>
                  <label htmlFor="transferTax" className="block text-sm mb-2">
                    &gt; TAX_RATE: {formData.transferTax}%
                  </label>
                  <input
                    type="range"
                    id="transferTax"
                    name="transferTax"
                    value={formData.transferTax}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className="w-full accent-[#00ff00]"
                  />
                  <div className="flex justify-between text-xs opacity-70 mt-1">
                    <span>1%</span>
                    <span>100%</span>
                  </div>
                </div>

                {formData.taxOption === 'both' && (
                  <div>
                    <label className="block text-sm mb-2">
                      &gt; DISTRIBUTION_RATIO
                    </label>
                    <input
                      type="range"
                      value={formData.taxDistribution.burn}
                      onChange={(e) => handleDistributionChange(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="w-full accent-[#00ff00]"
                    />
                    <div className="flex justify-between text-sm mt-2">
                      <div className="flex items-center gap-1">
                        <Flame size={14} className="text-red-400" />
                        <span>BURN: {formData.taxDistribution.burn}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gift size={14} className="text-green-400" />
                        <span>REWARD: {formData.taxDistribution.distribute}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Distribution Token Selection */}
                {(formData.taxOption === 'distribute' || formData.taxOption === 'both') && (
                  <div className="space-y-3">
                    <p className="block text-sm">
                      &gt; DISTRIBUTION_TOKEN <span className="text-red-400">*</span>
                    </p>

                    {formData.tokenDistribution.token ? (
                      <div className="bg-black/30 p-3 rounded border border-[#00ff00]/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formData.tokenDistribution.token.symbol}</span>
                            <span className="text-sm opacity-70">{formData.tokenDistribution.token.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeDistributionToken}
                            className="terminal-button p-1.5 hover:bg-red-500/10"
                          >
                            <X size={14} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00ff00] opacity-70" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => handleSearchToken(e.target.value)}
                              placeholder="Search token to distribute (e.g. SOL, USDC, POWSCHE)"
                              className="terminal-input w-full pl-10 pr-3 py-2"
                            />
                          </div>

                          {searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 border border-[#00ff00]/20 rounded-lg z-10 max-h-[200px] overflow-y-auto">
                              {isSearching ? (
                                <div className="p-3 text-center text-sm">
                                  <span className="text-[#00ff00] opacity-70">Searching...</span>
                                </div>
                              ) : searchResults.length > 0 ? (
                                <div className="divide-y divide-[#00ff00]/10">
                                  {searchResults.map((token) => (
                                    <button
                                      key={token.address}
                                      type="button"
                                      onClick={() => selectDistributionToken(token)}
                                      className="w-full p-3 text-left hover:bg-[#00ff00]/10 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <span className="font-semibold">{token.name}</span>
                                          <span className="ml-2 text-xs opacity-70">{token.symbol}</span>
                                          <span className="ml-2 text-sm opacity-70">
                                            {token.address.slice(0, 4)}...{token.address.slice(-4)}
                                          </span>
                                        </div>
                                        <Plus size={14} className="text-[#00ff00]" />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 text-center text-sm opacity-70">
                                  No tokens found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Glitch Interval */}
                <div>
                  <label htmlFor="glitchInterval" className="block text-sm mb-1">
                    &gt; DISTRIBUTION_INTERVAL <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="glitchInterval"
                    value={formData.glitchInterval}
                    onChange={handleGlitchIntervalChange}
                    className="terminal-input w-full px-3 py-2"
                    required={formData.transferTax > 0}
                  >
                    {glitchIntervals.map(interval => (
                      <option key={interval.value} value={interval.value}>
                        {interval.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <div>
            <label htmlFor="telegramLink" className="block text-sm mb-1">&gt; TELEGRAM_LINK</label>
            <input
              type="url"
              id="telegramLink"
              name="telegramLink"
              value={formData.telegramLink}
              onChange={handleInputChange}
              className="terminal-input w-full px-3 py-2"
              placeholder="https://"
            />
          </div>

          <div>
            <label htmlFor="websiteLink" className="block text-sm mb-1">&gt; WEBSITE_LINK</label>
            <input
              type="url"
              id="websiteLink"
              name="websiteLink"
              value={formData.websiteLink}
              onChange={handleInputChange}
              className="terminal-input w-full px-3 py-2"
              placeholder="https://"
            />
          </div>

          <div>
            <label htmlFor="twitterLink" className="block text-sm mb-1">&gt; TWITTER_LINK</label>
            <input
              type="url"
              id="twitterLink"
              name="twitterLink"
              value={formData.twitterLink}
              onChange={handleInputChange}
              className="terminal-input w-full px-3 py-2"
              placeholder="https://"
            />
          </div>
        </div>

        <button
          type="submit"
          className="terminal-button w-full px-4 py-2 mt-8 flex items-center justify-center gap-2"
        >
          <span>&gt; CONTINUE</span>
          <ArrowUpRight size={16} className="text-[#00ff00]" />
        </button>
      </form>
    </div>
  );
}

export default CreateCoinPage;
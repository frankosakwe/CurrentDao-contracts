import { 
  SorobanRpc, 
  TransactionBuilder, 
  Networks, 
  BASE_FEE, 
  Keypair,
  Account,
  Transaction,
  xdr
} from 'soroban-client';

export interface SorobanConfig {
  rpcUrl: string;
  networkPassphrase: string;
  fee: number;
}

export const TESTNET_CONFIG: SorobanConfig = {
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: Networks.TESTNET,
  fee: BASE_FEE
};

export const MAINNET_CONFIG: SorobanConfig = {
  rpcUrl: 'https://soroban-mainnet.stellar.org', // Update with actual mainnet RPC
  networkPassphrase: Networks.PUBLIC,
  fee: BASE_FEE
};

/**
 * Load keypair from environment variables or default file
 */
export function loadKeypair(secret?: string): Keypair {
  const secretKey = secret || process.env.SOROBAN_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('No secret key provided. Set SOROBAN_SECRET_KEY environment variable or pass as parameter');
  }
  
  try {
    return Keypair.fromSecret(secretKey);
  } catch (error) {
    throw new Error(`Invalid secret key: ${error}`);
  }
}

/**
 * Get account information from RPC
 */
export async function getAccount(rpc: SorobanRpc.Server, publicKey: string): Promise<Account> {
  try {
    const account = await rpc.getAccount(publicKey);
    return account;
  } catch (error) {
    throw new Error(`Failed to get account ${publicKey}: ${error}`);
  }
}

/**
 * Submit transaction and wait for confirmation
 */
export async function submitTransaction(
  rpc: SorobanRpc.Server, 
  transaction: Transaction, 
  keypair: Keypair
): Promise<SorobanRpc.GetTransactionResponse> {
  try {
    // Sign transaction
    transaction.sign(keypair);
    
    // Submit to network
    const result = await rpc.sendTransaction(transaction);
    
    if (result.status === 'ERROR') {
      throw new Error(`Transaction failed: ${result.errorResult}`);
    }
    
    // Wait for confirmation
    let txResponse = await rpc.getTransaction(result.hash);
    
    while (txResponse.status === 'PENDING') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      txResponse = await rpc.getTransaction(result.hash);
    }
    
    if (txResponse.status === 'FAILED') {
      throw new Error(`Transaction failed: ${txResponse.result}`);
    }
    
    return txResponse;
  } catch (error) {
    throw new Error(`Transaction submission failed: ${error}`);
  }
}

/**
 * Build and submit a transaction with automatic retry
 */
export async function buildAndSubmitTransaction(
  rpc: SorobanRpc.Server,
  keypair: Keypair,
  operations: any[],
  config: SorobanConfig = TESTNET_CONFIG
): Promise<SorobanRpc.GetTransactionResponse> {
  const account = await getAccount(rpc, keypair.publicKey());
  
  const transaction = new TransactionBuilder(account, {
    fee: config.fee,
    networkPassphrase: config.networkPassphrase
  })
    .addOperation(...operations)
    .setTimeout(30)
    .build();
    
  return await submitTransaction(rpc, transaction, keypair);
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  rpc: SorobanRpc.Server,
  txHash: string,
  maxWaitTime: number = 30000
): Promise<SorobanRpc.GetTransactionResponse> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const response = await rpc.getTransaction(txHash);
    
    if (response.status !== 'PENDING') {
      return response;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Transaction ${txHash} timed out after ${maxWaitTime}ms`);
}

/**
 * Deploy contract WASM
 */
export async function deployContract(
  rpc: SorobanRpc.Server,
  keypair: Keypair,
  wasmBuffer: Buffer,
  config: SorobanConfig = TESTNET_CONFIG
): Promise<string> {
  const account = await getAccount(rpc, keypair.publicKey());
  
  // Upload contract WASM
  const uploadOp = xdr.Operation.uploadContractWasm({
    wasm: wasmBuffer
  });
  
  const uploadTx = new TransactionBuilder(account, {
    fee: config.fee,
    networkPassphrase: config.networkPassphrase
  })
    .addOperation(uploadOp)
    .setTimeout(30)
    .build();
    
  const uploadResult = await submitTransaction(rpc, uploadTx, keypair);
  const wasmHash = uploadResult.result?.xdr;
  
  if (!wasmHash) {
    throw new Error('Failed to get WASM hash from upload result');
  }
  
  return wasmHash;
}

/**
 * Create contract instance
 */
export async function createContract(
  rpc: SorobanRpc.Server,
  keypair: Keypair,
  wasmHash: string,
  config: SorobanConfig = TESTNET_CONFIG
): Promise<string> {
  const account = await getAccount(rpc, keypair.publicKey());
  
  const createOp = xdr.Operation.createCustomContract({
    wasmHash: wasmHash,
    address: keypair.publicKey()
  });
  
  const createTx = new TransactionBuilder(account, {
    fee: config.fee,
    networkPassphrase: config.networkPassphrase
  })
    .addOperation(createOp)
    .setTimeout(30)
    .build();
    
  const createResult = await submitTransaction(rpc, createTx, keypair);
  const contractAddress = createResult.result?.address?.toString();
  
  if (!contractAddress) {
    throw new Error('Failed to get contract address from creation result');
  }
  
  return contractAddress;
}

/**
 * Load WASM file
 */
export function loadWasmFile(filePath: string): Buffer {
  const fs = require('fs');
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`WASM file not found: ${filePath}`);
  }
  
  return fs.readFileSync(filePath);
}

/**
 * Save deployment information
 */
export function saveDeploymentInfo(
  contractName: string,
  deploymentInfo: any,
  deploymentsDir: string = './deployments'
): void {
  const fs = require('fs');
  const path = require('path');
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filePath = path.join(deploymentsDir, `${contractName}.json`);
  const info = {
    ...deploymentInfo,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(filePath, JSON.stringify(info, null, 2));
  console.log(`📄 Deployment info saved to ${filePath}`);
}

/**
 * Load deployment information
 */
export function loadDeploymentInfo(
  contractName: string,
  deploymentsDir: string = './deployments'
): any {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(deploymentsDir, `${contractName}.json`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Deployment info not found: ${filePath}`);
  }
  
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

/**
 * Validate address format
 */
export function validateAddress(address: string): boolean {
  try {
    // Basic validation - would need proper Stellar address validation
    return address.startsWith('G') && address.length === 56;
  } catch {
    return false;
  }
}

/**
 * Format address for display
 */
export function formatAddress(address: string, length: number = 8): string {
  if (address.length <= length * 2) {
    return address;
  }
  
  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}

/**
 * Calculate gas cost estimate
 */
export function estimateGasCost(operations: any[]): number {
  // Simplified gas estimation
  const baseCost = 100;
  const operationCost = operations.length * 50000;
  return baseCost + operationCost;
}

/**
 * Log deployment steps
 */
export function logStep(step: string, message: string): void {
  console.log(`\n${step} ${message}`);
}

/**
 * Log success
 */
export function logSuccess(message: string): void {
  console.log(`✅ ${message}`);
}

/**
 * Log error
 */
export function logError(message: string): void {
  console.error(`❌ ${message}`);
}

/**
 * Log warning
 */
export function logWarning(message: string): void {
  console.warn(`⚠️  ${message}`);
}

/**
 * Log info
 */
export function logInfo(message: string): void {
  console.log(`ℹ️  ${message}`);
}

#!/usr/bin/env node

import { 
  Contract, 
  SorobanRpc, 
  TransactionBuilder, 
  Networks, 
  BASE_FEE, 
  Operation
} from 'soroban-client';
import { 
  loadKeypair, 
  getAccount, 
  submitTransaction 
} from '../src/utils/soroban_helper';

// Configuration
const NETWORK_PASSPHRASE = Networks.TESTNET; // Change to MAINNET for production
const RPC_URL = 'https://soroban-testnet.stellar.org'; // Change to mainnet RPC for production

interface DeploymentConfig {
  adminAddress: string;
  privacyEnabled: boolean;
  network: 'testnet' | 'mainnet';
}

async function deployUsageAnalytics(config: DeploymentConfig): Promise<string> {
  console.log('🚀 Starting Usage Analytics contract deployment...');
  
  // Initialize Soroban client
  const rpc = new SorobanRpc(RPC_URL);
  
  // Load deployer keypair
  const deployerKeypair = loadKeypair();
  const deployerPublicKey = deployerKeypair.publicKey();
  
  console.log(`📋 Deployer: ${deployerPublicKey}`);
  console.log(`🔧 Admin: ${config.adminAddress}`);
  console.log(`🔒 Privacy Enabled: ${config.privacyEnabled}`);
  
  try {
    // Get deployer account
    const deployerAccount = await getAccount(rpc, deployerPublicKey);
    
    // Build the contract
    console.log('🔨 Building Usage Analytics contract...');
    const { execSync } = require('child_process');
    
    try {
      execSync('cargo build --target wasm32-unknown-unknown --release', {
        cwd: './contracts/analytics',
        stdio: 'inherit'
      });
      console.log('✅ Contract built successfully');
    } catch (error) {
      console.error('❌ Failed to build contract:', error);
      throw error;
    }
    
    // Load the compiled WASM
    const fs = require('fs');
    const wasmBuffer = fs.readFileSync('./target/wasm32-unknown-unknown/release/usage_analytics.wasm');
    
    // Upload contract WASM
    console.log('📤 Uploading contract WASM...');
    const uploadOp = Operation.uploadContractWasm({
      wasm: wasmBuffer
    });
    
    const uploadTx = new TransactionBuilder(deployerAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE
    })
      .addOperation(uploadOp)
      .setTimeout(30)
      .build();
    
    const uploadResult = await submitTransaction(rpc, uploadTx, deployerKeypair);
    const wasmHash = uploadResult.results?.[0]?.xdr;
    
    if (!wasmHash) {
      throw new Error('Failed to get WASM hash from upload result');
    }
    
    console.log(`✅ Contract uploaded with hash: ${wasmHash}`);
    
    // Create contract
    console.log('🏗️  Creating contract instance...');
    const createContractOp = Operation.createCustomContract({
      wasmHash: wasmHash,
      address: deployerKeypair.publicKey()
    });
    
    const createTx = new TransactionBuilder(deployerAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE
    })
      .addOperation(createContractOp)
      .setTimeout(30)
      .build();
    
    const createResult = await submitTransaction(rpc, createTx, deployerKeypair);
    const contractAddress = createResult.results?.[0]?.address?.toString();
    
    if (!contractAddress) {
      throw new Error('Failed to get contract address from creation result');
    }
    
    console.log(`✅ Contract created at: ${contractAddress}`);
    
    // Initialize contract
    console.log('⚙️  Initializing contract...');
    const contract = new Contract(contractAddress);
    
    const adminAddress = new Address(config.adminAddress);
    const initializeTx = new TransactionBuilder(deployerAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE
    })
      .addOperation(contract.call(
        'initialize',
        adminAddress,
        config.privacyEnabled
      ))
      .setTimeout(30)
      .build();
    
    await submitTransaction(rpc, initializeTx, deployerKeypair);
    console.log('✅ Contract initialized successfully');
    
    // Verify deployment
    console.log('🔍 Verifying deployment...');
    const verifyTx = new TransactionBuilder(deployerAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE
    })
      .addOperation(contract.call('get_engagement_metrics', 'daily'))
      .setTimeout(30)
      .build();
    
    await submitTransaction(rpc, verifyTx, deployerKeypair);
    console.log('✅ Contract deployment verified');
    
    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      adminAddress: config.adminAddress,
      privacyEnabled: config.privacyEnabled,
      network: config.network,
      deployedAt: new Date().toISOString(),
      deployer: deployerPublicKey
    };
    
    fs.writeFileSync(
      './deployments/usage_analytics.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('📄 Deployment info saved to ./deployments/usage_analytics.json');
    
    return contractAddress;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config: DeploymentConfig = {
    adminAddress: args[0] || process.env.ANALYTICS_ADMIN || '',
    privacyEnabled: args.includes('--privacy') || args.includes('-p'),
    network: args.includes('--mainnet') ? 'mainnet' : 'testnet'
  };
  
  if (!config.adminAddress) {
    console.error('❌ Admin address is required');
    console.log('Usage: npm run deploy:analytics <ADMIN_ADDRESS> [--privacy] [--mainnet]');
    console.log('Or set ANALYTICS_ADMIN environment variable');
    process.exit(1);
  }
  
  // Create deployments directory if it doesn't exist
  const fs = require('fs');
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }
  
  try {
    const contractAddress = await deployUsageAnalytics(config);
    
    console.log('\n🎉 Usage Analytics contract deployed successfully!');
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`👤 Admin: ${config.adminAddress}`);
    console.log(`🔒 Privacy: ${config.privacyEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`🌐 Network: ${config.network}`);
    
    console.log('\n📋 Next steps:');
    console.log('1. Integrate the contract address into your existing contracts');
    console.log('2. Start recording usage events from your contracts');
    console.log('3. Set up monitoring and reporting dashboards');
    console.log('4. Configure automated data cleanup policies');
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error);
    process.exit(1);
  }
}

// Helper function to create Address (would need to be imported from Soroban SDK)
class Address {
  constructor(address: string) {
    this.address = address;
  }
  
  toString(): string {
    return this.address;
  }
}

// Export for use in other scripts
export { deployUsageAnalytics, DeploymentConfig };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

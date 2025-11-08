// x402-server-sdk/src/server.ts - Updated for SOL

import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import {
  X402ServerConfig,
  PaymentRequirements,
  PaymentOption,
  PaymentVerification,
  X402Response,
} from './types';
import {
  SOLANA_DEVNET_RPC,
  SOLANA_MAINNET_RPC,
  USDC_DECIMALS,
  USDC_MAINNET_MINT,
  USDC_DEVNET_MINT,
  X402_VERSION,
} from './constants';

export class SolanaX402Server {
  private connection: Connection;
  private config: X402ServerConfig;
  private usdcMintAddress: PublicKey;

  constructor(config: X402ServerConfig) {
    this.config = config;
    
    // Set RPC URL
    const rpcUrl = config.rpcUrl || 
      (config.network === 'devnet' ? SOLANA_DEVNET_RPC : SOLANA_MAINNET_RPC);
    
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // Set USDC mint address
    const mintAddress = config.usdcMintAddress || 
      (config.network === 'devnet' ? USDC_DEVNET_MINT : USDC_MAINNET_MINT);
    
    try {
      this.usdcMintAddress = new PublicKey(mintAddress);
    } catch (error) {
      throw new Error(`Invalid USDC mint address: ${mintAddress}. ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initialize the server for USDC token payments
   */
  async initialize(): Promise<void> {
    // Verify recipient address is valid
    try {
      new PublicKey(this.config.recipientAddress);
      console.log('✅ Server initialized with recipient:', this.config.recipientAddress);
      console.log('✅ USDC mint address:', this.usdcMintAddress.toBase58());
    } catch (error) {
      throw new Error(`Invalid recipient address: ${this.config.recipientAddress}. ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create payment requirements for HTTP 402 response (USDC)
   */
  async createPaymentRequirements(
    amountInUsdc: number,
    resourceId?: string
  ): Promise<PaymentRequirements> {
    // Ensure USDC mint address is set
    if (!this.usdcMintAddress) {
      throw new Error('USDC mint address not initialized');
    }
    
    const usdcMintAddressString = this.usdcMintAddress.toBase58();
    
    const paymentOption: PaymentOption = {
      id: resourceId || `usdc-${Date.now()}`,
      scheme: 'solana',
      network: this.config.network,
      recipient: this.config.recipientAddress,
      token: usdcMintAddressString, // USDC mint address (not 'native')
      amount: amountInUsdc.toString(),
      decimals: USDC_DECIMALS,
    };

    return {
      version: X402_VERSION,
      paymentOptions: [paymentOption],
    };
  }

  /**
   * Create a proper HTTP 402 response (USDC)
   */
  async create402Response(
    amountInUsdc: number,
    resourceId?: string
  ): Promise<X402Response> {
    const requirements = await this.createPaymentRequirements(amountInUsdc, resourceId);
    
    return {
      statusCode: 402,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': `x402 version="${X402_VERSION}"`,
      },
      body: requirements,
    };
  }

  /**
   * Verify a USDC payment transaction
   */
  async verifyPayment(
    signature: string,
    expectedAmountUsdc: number,
    maxAgeSeconds: number = 300
  ): Promise<PaymentVerification> {
    try {
      // Get transaction
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return {
          valid: false,
          error: 'Transaction not found',
        };
      }

      // Check transaction age
      const now = Math.floor(Date.now() / 1000);
      const txTime = tx.blockTime || 0;
      const age = now - txTime;

      if (age > maxAgeSeconds) {
        return {
          valid: false,
          error: `Transaction too old: ${age}s (max ${maxAgeSeconds}s)`,
        };
      }

      // Check if transaction succeeded
      if (tx.meta?.err) {
        return {
          valid: false,
          error: 'Transaction failed',
        };
      }

      // For USDC token transfers, check token account balance changes
      const usdcMintStr = this.usdcMintAddress.toBase58();
      
      // Get token account balances
      const preTokenBalances = tx.meta?.preTokenBalances || [];
      const postTokenBalances = tx.meta?.postTokenBalances || [];

      // Find the recipient's token account balance change for USDC
      let receivedUsdc = 0;
      let senderAddress = '';

      // Match pre and post token balances by account index
      for (const postBalance of postTokenBalances) {
        if (postBalance.mint === usdcMintStr) {
          const accountIndex = postBalance.accountIndex;
          const owner = postBalance.owner;
          
          // Check if this is the recipient's token account
          if (owner === this.config.recipientAddress) {
            // Find corresponding pre-balance
            const preBalance = preTokenBalances.find(
              (pre) => pre.accountIndex === accountIndex && pre.mint === usdcMintStr
            );
            
            const preAmount = preBalance ? parseFloat(preBalance.uiTokenAmount.uiAmountString || '0') : 0;
            const postAmount = parseFloat(postBalance.uiTokenAmount.uiAmountString || '0');
            receivedUsdc = postAmount - preAmount;
            
            // Find sender by looking for token account that decreased
            for (const preBalanceItem of preTokenBalances) {
              if (preBalanceItem.mint === usdcMintStr && preBalanceItem.accountIndex !== accountIndex) {
                const preSenderAmount = parseFloat(preBalanceItem.uiTokenAmount.uiAmountString || '0');
                const postSenderBalance = postTokenBalances.find(
                  (post) => post.accountIndex === preBalanceItem.accountIndex && post.mint === usdcMintStr
                );
                const postSenderAmount = postSenderBalance ? parseFloat(postSenderBalance.uiTokenAmount.uiAmountString || '0') : 0;
                
                if (preSenderAmount > postSenderAmount && preSenderAmount - postSenderAmount === receivedUsdc) {
                  senderAddress = preBalanceItem.owner || '';
                  break;
                }
              }
            }
            
            // Fallback: use first signer if sender not found from token balances
            if (!senderAddress) {
              const accountKeys = tx.transaction.message.getAccountKeys();
              if (accountKeys.staticAccountKeys.length > 0) {
                senderAddress = accountKeys.staticAccountKeys[0].toBase58();
              }
            }
            break;
          }
        }
      }

      if (receivedUsdc <= 0) {
        return {
          valid: false,
          error: 'No USDC transfer found to recipient address',
        };
      }

      // Check amount (allow small tolerance for rounding)
      const tolerance = 0.0001;

      if (Math.abs(receivedUsdc - expectedAmountUsdc) > tolerance) {
        return {
          valid: false,
          error: `Amount mismatch: expected ${expectedAmountUsdc} USDC, got ${receivedUsdc} USDC`,
        };
      }

      return {
        valid: true,
        signature,
        amount: receivedUsdc,
        token: 'USDC',
        from: senderAddress,
        to: this.config.recipientAddress,
        timestamp: txTime,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: `Verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Helper: Check if a signature has already been used (prevent replay attacks)
   */
  async isSignatureUsed(signature: string): Promise<boolean> {
    // TODO: Implement database check
    const tx = await this.connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    return tx !== null;
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(signature: string): Promise<{
    confirmed: boolean;
    finalized: boolean;
  }> {
    const confirmedTx = await this.connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    const finalizedTx = await this.connection.getTransaction(signature, {
      commitment: 'finalized',
      maxSupportedTransactionVersion: 0,
    });

    return {
      confirmed: confirmedTx !== null,
      finalized: finalizedTx !== null,
    };
  }

  /**
   * Check recipient USDC balance
   */
  async getRecipientBalance(): Promise<number> {
    // Note: This would require finding the associated token account
    // For now, this is a placeholder - full implementation would need
    // to derive the associated token account address and query its balance
    throw new Error('getRecipientBalance not yet implemented for USDC token accounts');
  }
}
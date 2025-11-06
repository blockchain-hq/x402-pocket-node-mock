# Pocket node Mock

n8n community node for Solana x402 payment protocol. Return HTTP 402 Payment Required responses for native payments on Solana.

[n8n](https://n8n.io/) is a workflow automation platform.

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `@blockchainhq-xyz/n8n-nodes-pocket-mock`
4. Click **Install**

### Manual Installation
```bash
npm install @blockchainhq-xyz/n8n-nodes-pocket-mock
```

## Operations

### Return 402 Payment Required

Returns an HTTP 402 status with payment requirements for clients to pay in Solana SOL.

**Parameters:**
- **Amount (SOL)**: Amount required (e.g., 0.01 for 1 cent)
- **Resource ID**: Optional unique identifier

**Output:**
```json
{
  "statusCode": 402,
  "headers": {
    "Content-Type": "application/json",
    "WWW-Authenticate": "x402 version=\"1.0\""
  },
  "body": {
    "version": "1.0",
    "paymentOptions": [{
      "network": "devnet",
      "recipient": "YOUR_WALLET",
      "amount": "0.01"
    }]
  }
}
```

### Verify Payment

Verifies a Solana SOL payment transaction on-chain.

**Parameters:**
- **Transaction Signature**: Solana transaction signature
- **Expected Amount**: Amount to verify (SOL)
- **Max Age**: Maximum transaction age in seconds

**Output:**
```json
{
  "valid": true,
  "signature": "5VERv...",
  "amount": 0.01,
  "from": "PAYER_ADDRESS",
  "to": "RECIPIENT_ADDRESS"
}
```

## Credentials

### Pocket Mock API

**Required fields:**
- **Network**: `devnet` or `mainnet-beta`
- **Recipient Address**: Your Solana wallet address to receive payments
- **RPC URL** (optional): Custom RPC endpoint

## Use Cases

- Monetize API endpoints
- Content paywalls
- Pay-per-use services
- Premium features

## Example Workflow

Webhook
↓
IF: Has X-Payment header?
→ No: Pocket node Mock (Return 402)
→ Yes: Pocket node Mock (Verify Payment)
↓
IF: Valid?
→ Yes: Serve content
→ No: Return 403

## Resources

- [x402 Protocol](https://x402.org/)
- [Solana Docs](https://docs.solana.com/)
- [GitHub Repository](https://github.com/blockchain-hq/x402-pocket-node-mock)

## License

MIT

## Support

- [GitHub Issues](https://github.com/blockchain-hq/x402-pocket-node-mock/issues)
- [n8n Community](https://community.n8n.io/)
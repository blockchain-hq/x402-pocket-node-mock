# Pocket node Mock

**Mock server node** for testing x402 payment flows in n8n. Test payment logic without creating actual APIs!

[![npm version](https://badge.fury.io/js/@blockchainhq-xyz%2Fn8n-nodes-pocket-mock.svg)](https://www.npmjs.com/package/@blockchainhq-xyz%2Fn8n-nodes-pocket-mock)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What It Does

This is a **mock server node** that simulates a payment-required API server directly in n8n:

- Return HTTP 402 Payment Required (without building an API)
- Verify SOL payments on-chain
- Test payment flows in n8n
- No separate API server needed
- Perfect for development and prototyping

**Why Mock?** Test your payment logic end-to-end in n8n without deploying actual APIs. Great for learning, testing, and prototyping!

### Manual Installation (For Development)

**Note:** This installs from source code, not npm.

```bash
# 1. Clone the server node repository
git clone https://github.com/blockchain-hq/x402-pocket-node-mock.git
cd x402-pocket-node-mock

# 2. Install dependencies
npm install

# 3. Link the server SDK
npm link x402-server-sdk

# 4. Build the node
npm run build

# 5. Set custom extensions path
# If running both server and client nodes, set path to parent folder:
export N8N_CUSTOM_EXTENSIONS="$HOME/x402-n8n-nodes"
# Make it permanent:
echo 'export N8N_CUSTOM_EXTENSIONS="$HOME/x402-n8n-nodes"' >> ~/.zshrc

# Note: Your folder structure should be:
# ~/x402-n8n-nodes/
#   ├── x402-pocket-node-mock/         (this server node)
#   └── n8n-nodes-solana-x402-client/  (client node, if needed)

# 6. Start n8n
n8n start

# 7. In n8n, search for: "Pocket node Mock"
```


## Operations

### 1. Return 402 Payment Required

Returns 402 response requiring SOL payment.

**Input:**
- Amount (SOL): e.g., 0.01
- Resource ID: optional

**Output:**
```json
{
  "statusCode": 402,
  "body": {
    "paymentOptions": [{
      "amount": "0.01",
      "recipient": "YOUR_WALLET",
      "token": "native"
    }]
  }
}
```

### 2. Verify Payment

Verifies SOL payment on-chain.

**Input:**
- Transaction Signature
- Expected Amount (SOL)
- Max Age (seconds)

**Output:**
```json
{
  "valid": true,
  "signature": "5VERv8...",
  "amount": 0.01,
  "from": "PAYER_ADDRESS",
  "to": "YOUR_WALLET"
}
```

## Credentials

**Pocket Mock API:**
- Network: Devnet or Mainnet
- Recipient Address: Your wallet
- RPC URL: (optional)

## Mock Server Workflow

**Test payment flows without building an API:**

```
Manual Trigger → Pocket node Mock (Mock Server)
                  Return 402 with requirements
    ↓
Solana x402 Client → Parse and Pay
                      (makes real payment on devnet)
    ↓
Pocket node Mock (Mock Server) → Verify Payment
                             (checks real transaction)
    ↓
IF Valid → Return Mock Content
    ↓
IF Invalid → Return 403 Error
```

**This simulates:** Client requesting paid content → Server requiring payment → Client paying → Server verifying → Access granted

**No real API needed!** Perfect for testing, learning, and prototyping.

## Use Cases

| Use Case | Description |
|----------|-------------|
| **Learning x402** | Understand payment protocol without APIs |
| **Testing Payment Flows** | Validate payment logic in n8n |
| **Prototyping** | Quick proof-of-concept for paid features |
| **Development** | Test before building real API |
| **Demo** | Show payment flows to stakeholders |

**Real-world deployment:** Use the x402 Server SDK in your actual Node.js/Express API. This mock node is for testing!

## Security

**Always:**
- Set Max Age (recommended: 300s)
- Store used signatures in database
- Use environment variables for wallet
- Enable rate limiting

**Example:**
```javascript
Max Age: 300  // 5 minutes
```

## Networks

**Devnet (Testing):**
```bash
solana airdrop 2 YOUR_ADDRESS --url devnet
```

**Mainnet (Production):**
- Use real wallet
- Test on devnet first

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Node not visible | Restart n8n, clear browser cache |
| Transaction not found | Wait, check network |
| Amount mismatch | Verify exact amount |
| Transaction too old | Increase Max Age |

## Resources

- [n8n Docs](https://docs.n8n.io/)
- [x402 Protocol](https://x402.org/)

## Requirements

- n8n: v0.220.0+
- Node.js: v18+

## License

MIT

## Support

- [GitHub Issues](https://github.com/blockchain-hq/x402-pocket-node-mock/issues)
- [n8n Community](https://community.n8n.io/)

---

**Star if useful!**
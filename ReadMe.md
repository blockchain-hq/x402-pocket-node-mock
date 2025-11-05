# n8n-nodes-solana-x402

**Mock server node** for testing x402 payment flows in n8n. Test payment logic without creating actual APIs!

[![npm version](https://badge.fury.io/js/n8n-nodes-solana-x402.svg)](https://www.npmjs.com/package/n8n-nodes-solana-x402)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What It Does

This is a **mock server node** that simulates a payment-required API server directly in n8n:

- ✅ Return HTTP 402 Payment Required (without building an API)
- ✅ Verify SOL payments on-chain
- ✅ Test payment flows in n8n
- ✅ No separate API server needed
- ✅ Perfect for development and prototyping

**Why Mock?** Test your payment logic end-to-end in n8n without deploying actual APIs. Great for learning, testing, and prototyping!

## 📦 Installation

### In n8n (Recommended)

1. Go to **Settings > Community Nodes**
2. Click **Install**
3. Enter: `n8n-nodes-solana-x402`
4. Click **Install**

### Manual Installation

```bash
# 1. Install the package
npm install x402-server-sdk

# 2. Link for development
npm link

# 3. Set custom extensions path
export N8N_CUSTOM_EXTENSIONS="$HOME/x402-n8n-nodes"

# 4. Start n8n
n8n start

# 5. In n8n, search for: "Solana x402"
# The node will appear with a Solana icon
```

## 🚀 Operations

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

## 🔐 Credentials

**Solana x402 API:**
- Network: Devnet or Mainnet
- Recipient Address: Your wallet
- RPC URL: (optional)

## 📋 Mock Server Workflow

**Test payment flows without building an API:**

```
Manual Trigger → Solana x402 (Mock Server)
                  Return 402 with requirements
    ↓
Solana x402 Client → Parse and Pay
                      (makes real payment on devnet)
    ↓
Solana x402 (Mock Server) → Verify Payment
                             (checks real transaction)
    ↓
IF Valid → Return Mock Content ✅
    ↓
IF Invalid → Return 403 Error
```

**This simulates:** Client requesting paid content → Server requiring payment → Client paying → Server verifying → Access granted

**No real API needed!** Perfect for testing, learning, and prototyping.

## 🎓 Use Cases

| Use Case | Description |
|----------|-------------|
| **Learning x402** | Understand payment protocol without APIs |
| **Testing Payment Flows** | Validate payment logic in n8n |
| **Prototyping** | Quick proof-of-concept for paid features |
| **Development** | Test before building real API |
| **Demo** | Show payment flows to stakeholders |

**Real-world deployment:** Use the x402 Server SDK in your actual Node.js/Express API. This mock node is for testing!

## 🔒 Security

**Always:**
- Set Max Age (recommended: 300s)
- Store used signatures in database
- Use environment variables for wallet
- Enable rate limiting

**Example:**
```javascript
Max Age: 300  // 5 minutes
```

## 🌐 Networks

**Devnet (Testing):**
```bash
solana airdrop 2 YOUR_ADDRESS --url devnet
```

**Mainnet (Production):**
- Use real wallet
- Test on devnet first

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Node not visible | Restart n8n, clear browser cache |
| Transaction not found | Wait, check network |
| Amount mismatch | Verify exact amount |
| Transaction too old | Increase Max Age |

## 📚 Resources

- [n8n Docs](https://docs.n8n.io/)
- [Example Workflows](https://github.com/YOUR_USERNAME/n8n-nodes-solana-x402/tree/main/examples)
- [x402 Protocol](https://x402.org/)

## 🎯 Requirements

- n8n: v0.220.0+
- Node.js: v18+

## 📄 License

MIT

## 💬 Support

- [GitHub Issues](https://github.com/blockchain-hq/x402-n8n-mock-node/issues)
- [n8n Community](https://community.n8n.io/)

---

**⭐ Star if useful!**
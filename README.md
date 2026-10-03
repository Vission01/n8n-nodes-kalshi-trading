# n8n-nodes-kalshi

[![npm version](https://img.shields.io/npm/v/n8n-nodes-kalshi.svg)](https://www.npmjs.com/package/n8n-nodes-kalshi)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-kalshi.svg)](https://www.npmjs.com/package/n8n-nodes-kalshi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is an n8n community node that lets you interact with the [Kalshi](https://kalshi.com) prediction markets API in your n8n workflows.

[Kalshi](https://kalshi.com) is a federally regulated prediction market exchange where you can trade on real-world events. This node enables you to:

- 📊 Fetch market data and prices
- 💰 Place and manage orders
- 📈 Monitor your portfolio
- 🔍 Scan markets for opportunities
- 🤖 Build automated trading strategies
- 📉 Analyze historical data

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

---


## Installation

### Via n8n Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in n8n
2. Select **Install**
3. Enter `n8n-nodes-kalshi` in **Enter npm package name**
4. Agree to the risks and click **Install**

### Manual Installation

```bash
npm install n8n-nodes-kalshi
```

---

## Credentials

### Creating an API Key

Kalshi API keys are separate for each environment (a demo key will not work in production).

1. Log in to [demo.kalshi.co](https://demo.kalshi.co) (testing, no real money) or [kalshi.com](https://kalshi.com) (real trading)
2. Go to **Account & security > API Keys** and click **Create Key**
3. Save the **API Key ID** and the downloaded **private key** (PEM file). The private key cannot be retrieved again.

### Setting Up in n8n

1. In n8n, go to **Credentials > New**
2. Search for **Kalshi API**
3. Enter your credentials:
   - **API Key ID:** The key ID shown by Kalshi
   - **Private Key:** The full contents of the PEM file, including the `BEGIN`/`END` lines (RSA and Ed25519 keys are supported; encrypted keys are not)
   - **Environment:** Demo or Production
4. Click **Create**

Each request is signed locally with your private key. The private key itself is never sent to Kalshi.

**Security Note:** n8n encrypts stored credentials. Use a dedicated key for n8n and revoke it in Kalshi if it is ever exposed.

---

## Operations

### 📊 Market Resource

| Operation | Description |
|-----------|-------------|
| **Get Markets** | Retrieve multiple markets with extensive filters |
| **Get Market** | Get detailed information about a specific market |
| **Get Market Orderbook** | Get the current bid/ask spread and depth |
| **Get Market Candlesticks** | Get historical price data |
| **Get Trades** | Get recent trade history |
| **Batch Get Candlesticks** | Get candlesticks for multiple markets |

### 📅 Event Resource

| Operation | Description |
|-----------|-------------|
| **Get Events** | List all events with filters |
| **Get Event** | Get detailed event information |
| **Get Event Metadata** | Get event metadata and rules |
| **Get Event Candlesticks** | Get candlestick data for an event |

### 💰 Order Resource

| Operation | Description |
|-----------|-------------|
| **Create Order** | Place a new order (market or limit) |
| **Get Orders** | Retrieve your orders with filters |
| **Get Order** | Get details of a specific order |
| **Cancel Order** | Cancel an existing order |
| **Batch Create Orders** | Create multiple orders at once |
| **Batch Cancel Orders** | Cancel multiple orders at once |
| **Amend Order** | Modify an existing order |
| **Decrease Order** | Decrease the quantity of an order |

### 📈 Portfolio Resource

| Operation | Description |
|-----------|-------------|
| **Get Balance** | Get your account balance |
| **Get Positions** | Get your current positions |
| **Get Fills** | Get your order execution history |
| **Get Settlements** | Get settlement history |

### 🏛️ Exchange Resource

| Operation | Description |
|-----------|-------------|
| **Get Status** | Get current exchange status |
| **Get Announcements** | Get exchange announcements |
| **Get Schedule** | Get exchange operating schedule |

### 📑 Series Resource

| Operation | Description |
|-----------|-------------|
| **Get Series List** | Get list of all series |
| **Get Series** | Get detailed series information |

---

## Quick Start

### 1. Get Exchange Status

Test your connection with a simple operation:

```
Resource: Exchange
Operation: Get Status
```

### 2. Browse Markets

See what's available to trade:

```
Resource: Market
Operation: Get Markets
Additional Fields:
  Status: open
  Limit: 100
```

### 3. Place Your First Order (Demo Only!)

```
Resource: Order
Operation: Create Order
Ticker: MARKET-TICKER-HERE
Action: buy
Side: yes
Type: limit
Count: 1
Yes Price: 50
```

---

## Example Workflows

### 1. Price Monitoring Bot

Monitor a market and get alerted when price moves:

**Nodes:**
1. Schedule Trigger (every 5 minutes)
2. Kalshi - Get Market
3. IF - Check price threshold
4. Send Email/Slack notification

### 2. Automated Trading Strategy

Execute trades based on conditions:

**Nodes:**
1. Schedule Trigger
2. Kalshi - Get Markets (filter by criteria)
3. Function - Analyze opportunities
4. Kalshi - Create Order
5. Database - Log trade

### 3. Portfolio Dashboard

Daily portfolio summary:

**Nodes:**
1. Schedule Trigger (daily at 9 AM)
2. Kalshi - Get Balance
3. Kalshi - Get Positions
4. Kalshi - Get Fills
5. Google Sheets - Update dashboard
6. Email - Daily summary

### 4. Market Scanner

Find trading opportunities:

**Nodes:**
1. Kalshi - Get Markets (all open)
2. Function - Filter by volume/spread
3. Kalshi - Get Market Orderbook (for each)
4. Function - Calculate metrics
5. IF - Filter opportunities
6. Notification - Alert on opportunities

**See [EXAMPLE_WORKFLOWS.md](./EXAMPLE_WORKFLOWS.md) for detailed configurations!**

---

## Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get up and running in 5 minutes
- **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)** - Detailed setup instructions
- **[EXAMPLE_WORKFLOWS.md](./EXAMPLE_WORKFLOWS.md)** - 8 practical workflow examples
- **[FILE_CHECKLIST.md](./FILE_CHECKLIST.md)** - Complete file checklist
- **[Kalshi API Documentation](https://docs.kalshi.com)** - Official API docs

---

## Development

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/n8n-nodes-kalshi.git
cd n8n-nodes-kalshi

# Install dependencies
npm install

# Build
npm run build

# Watch mode for development
npm run dev
```

### Testing Locally

```bash
# Link the package
npm link

# In your n8n directory
npm link n8n-nodes-kalshi

# Restart n8n to see changes
```

### Building

```bash
npm run build        # Build project
npm run lint         # Run linter
npm run lintfix      # Fix linting issues
npm run format       # Format code with Prettier
```

### Publishing

```bash
# Update version
npm version patch    # 1.0.0 -> 1.0.1
npm version minor    # 1.0.0 -> 1.1.0
npm version major    # 1.0.0 -> 2.0.0

# Publish to npm
npm publish
```

---

## Compatibility

- **n8n version:** 0.198.0 or above
- **Node.js version:** 18.0.0 or above
- **Tested with:** n8n 1.0.0+

---

## Resources

### Kalshi
- [Kalshi Homepage](https://kalshi.com)
- [Kalshi API Documentation](https://docs.kalshi.com)
- [Kalshi Trading Rules](https://kalshi.com/rules)
- [Kalshi Learn Center](https://kalshi.com/learn)

### n8n
- [n8n Homepage](https://n8n.io)
- [n8n Documentation](https://docs.n8n.io)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [n8n Community Forum](https://community.n8n.io)

---

## Support

### Issues and Feature Requests

Please [open an issue](https://github.com/yourusername/n8n-nodes-kalshi/issues) on GitHub.

### Questions

- For n8n questions: [n8n Community Forum](https://community.n8n.io)
- For Kalshi API questions: [Kalshi Documentation](https://docs.kalshi.com)

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Changelog

### Version 1.0.0 (2025-01-11)

#### Features
- ✨ Complete Kalshi API v2 integration
- 📊 Market data operations (6 operations)
- 📅 Event operations (4 operations)
- 💰 Order management (8 operations including batch)
- 📈 Portfolio tracking (4 operations)
- 🏛️ Exchange info (3 operations)
- 📑 Series operations (2 operations)
- 🔐 Secure authentication with API key signing (RSA/Ed25519)
- 🌍 Support for Demo and Production environments
- 📝 Comprehensive documentation and examples
- 🎯 30+ total operations

#### Documentation
- Complete setup guide
- 8 example workflows
- Quick start guide
- API reference

---

## Roadmap

Future enhancements planned:

- [ ] WebSocket support for real-time data
- [ ] Advanced order types
- [ ] Portfolio analytics
- [ ] Strategy backtesting
- [ ] Risk management tools
- [ ] Multi-account support
- [ ] Advanced filtering options
- [ ] Export/import workflows

---

## License

[MIT](LICENSE.md)

Copyright (c) 2025 n8n-nodes-kalshi Contributors

---

## Disclaimer

**⚠️ Important:**

- This is an **unofficial** community node
- **Not affiliated** with Kalshi or n8n
- Use at your **own risk**
- Always test with **Demo environment** first
- Understand the **risks** of automated trading
- The authors are **not responsible** for any trading losses
- Read and understand [Kalshi's Terms of Service](https://kalshi.com/terms)

**Trading involves risk. Only trade with funds you can afford to lose.**

---

## Acknowledgments

- Thanks to [Kalshi](https://kalshi.com) for their excellent API
- Thanks to [n8n](https://n8n.io) for the amazing automation platform
- Thanks to all contributors and users of this node

---

## Star History

If you find this project useful, please give it a ⭐ on GitHub!

---

**Made with ❤️ for the n8n and Kalshi communities**

**Happy Trading! 🚀**

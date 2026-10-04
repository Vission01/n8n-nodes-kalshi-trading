# n8n-nodes-kalshi-trading

[![npm version](https://img.shields.io/npm/v/n8n-nodes-kalshi-trading.svg)](https://www.npmjs.com/package/n8n-nodes-kalshi-trading)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-kalshi-trading.svg)](https://www.npmjs.com/package/n8n-nodes-kalshi-trading)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An [n8n](https://n8n.io) community node for the [Kalshi](https://kalshi.com) prediction-market API. Use it to:

- 📊 Read markets, events, order books, trades and price history (candlesticks)
- 💰 Place, cancel, decrease and batch orders (Kalshi V2 order endpoints)
- 📈 Check balance, positions and fills
- 🤖 Build automated trading workflows

Requests are signed locally with your Kalshi API key (RSA or Ed25519). Your private key is never sent to Kalshi.

---

## Installation

### n8n Community Nodes (recommended)

1. In n8n, go to **Settings > Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-kalshi-trading`
4. Accept the risk notice and click **Install**

See the n8n guide: [Install community nodes](https://docs.n8n.io/integrations/community-nodes/installation/).

### Manual installation (self-hosted)

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-kalshi-trading
# restart n8n
```

---

## Credentials

### Create an API key

Kalshi API keys belong to one environment. A demo key will not work in production, and vice versa.

1. Log in to [demo.kalshi.co](https://demo.kalshi.co) (testing, no real money) or [kalshi.com](https://kalshi.com) (real money)
2. Go to **Account & security > API Keys** and click **Create Key**
3. Save the **API Key ID** and the downloaded **private key** (PEM file). Kalshi will not show the private key again.

Kalshi's guide: [Authenticated requests](https://docs.kalshi.com/getting_started/quick_start_authenticated_requests).

### Add the credential in n8n

1. Go to **Credentials > New** and search for **Kalshi API**
2. Fill in:
   - **API Key ID**: the key ID shown by Kalshi
   - **Private Key**: the full PEM file contents, including the `BEGIN`/`END` lines (RSA and Ed25519 keys are supported; encrypted keys are not)
   - **Environment**: **Demo** or **Production**. The environment is set here, on the credential, not on the node.
3. Click **Save**

> **Tip:** Keep two credentials ("Kalshi Demo" and "Kalshi Production") and switch a workflow between them to move from testing to live trading.

> **Clock sync:** Kalshi rejects signed requests whose timestamp is more than a few seconds off (`header timestamp expired`). Make sure the machine running n8n keeps its clock synced (NTP).

---

## Operations

### Market

| Operation | Description |
|-----------|-------------|
| **Get** | Get one market by ticker |
| **Get Many** | List markets. Filters: series, event, status (`open`, `unopened`, `closed`, `settled`), min/max close time, ticker, limit, cursor |
| **Get History** | Price history as candlesticks (1 minute, 1 hour or 1 day). The series ticker is looked up automatically if you leave it empty |
| **Get Orderbook** | Current YES/NO bids, with optional depth |
| **Get Trades** | Recent public trades for a market |

### Event

| Operation | Description |
|-----------|-------------|
| **Get** | Get one event by ticker |
| **Get Many** | List events, filtered by series and status |

### Order

| Operation | Description |
|-----------|-------------|
| **Create** | Place a limit or market order |
| **Cancel** | Cancel an order |
| **Decrease** | Reduce the remaining quantity of an order |
| **Get** | Get one order |
| **Get Many** | List your orders, filtered by ticker, event or status |
| **Batch Create** | Place several orders in one request |
| **Batch Cancel** | Cancel several orders by ID |

### Position

| Operation | Description |
|-----------|-------------|
| **Get Many** | Your positions. Filters: count (`All`, `Open Position`, `Ever Traded`), settlement status, ticker, event |

### Portfolio

| Operation | Description |
|-----------|-------------|
| **Get Balance** | Account balance |
| **Get Fills** | Your executed trades |

### Exchange

| Operation | Description |
|-----------|-------------|
| **Get Status** | Whether the exchange and trading are active |
| **Get Schedule** | Exchange trading hours |

---

## Placing orders

**Create Order** fields:

| Field | Meaning |
|-------|---------|
| **Action** | `Buy` or `Sell` |
| **Side** | `Yes` or `No` |
| **Type** | `Limit`, or `Market`. Market orders always cross the book and use Immediate or Cancel |
| **Count** | Number of contracts |
| **Price (Cents)** | Limit price, 1–99, **for the side you selected**. Side `No` at `90` buys NO contracts at 90¢ |

**Order Options**:

| Option | Meaning |
|--------|---------|
| **Time In Force** | `Good Till Canceled` (default), `Immediate or Cancel`, or `Fill or Kill` |
| **Expiration TS** | Unix time (seconds) when a Good Till Canceled order expires |
| **Client Order ID** | Your own ID for deduplication. Generated automatically if empty |
| **Post Only** | Reject the order if it would match immediately (maker only) |
| **Reduce Only** | Only reduce an existing position (Kalshi requires Immediate or Cancel) |

Under the hood the node uses Kalshi's [V2 order endpoint](https://docs.kalshi.com/api-reference/orders/create-order-v2). V2 has a single YES order book: buying YES is a `bid`, and buying NO is an `ask` (selling YES) at `100 − price`. The node handles this conversion for you. Kalshi explains it in [Order direction](https://docs.kalshi.com/getting_started/order_direction).

For **Cancel** and **Decrease**, also fill in **Market Ticker** so Kalshi can route the request.

**Batch Create** takes a JSON array of V2 order objects, for example:

```json
[
  {
    "ticker": "KXTEMPNYCHS-26OCT0400-T60.99",
    "side": "bid",
    "count": "1.00",
    "price": "0.5000",
    "time_in_force": "good_till_canceled",
    "self_trade_prevention_type": "taker_at_cross"
  }
]
```

Here `side` is `bid` (buy YES) or `ask` (sell YES / buy NO), and `price` is the YES price in dollars.

> **Note:** a new order can take a second or two to appear in **Order > Get** / **Get Many**. Use the `order_id` from the Create response right away; don't re-query immediately.

---

## Quick start

### 1. Test the connection

```
Resource:  Exchange
Operation: Get Status
```

### 2. Browse markets

```
Resource:  Market
Operation: Get Many
Filters:   Series Ticker = KXTEMPNYCHS, Status = Open
```

### 3. Place your first order (use a Demo credential!)

```
Resource:  Order
Operation: Create
Ticker:    <market ticker>
Action:    Buy
Side:      Yes
Type:      Limit
Count:     1
Price:     50
```

---

## Example workflows

**Price alert:** Schedule Trigger → Kalshi *Market > Get* → IF (price crosses your level) → Email/Slack.

**Automated strategy:** Schedule Trigger → Kalshi *Market > Get Many* (use *Max Close TS* to fetch only markets closing soon) → Kalshi *Position > Get Many* (skip markets you already hold) → Code (your rules) → Kalshi *Order > Create* (Immediate or Cancel) → log to a Data Table.

**Daily portfolio summary:** Schedule Trigger → Kalshi *Portfolio > Get Balance* → *Position > Get Many* → *Portfolio > Get Fills* → Google Sheets / Email.

---

## Development

```bash
git clone https://github.com/Vission01/n8n-nodes-kalshi-trading.git
cd n8n-nodes-kalshi-trading
npm install --ignore-scripts
npm run build      # compile TypeScript to dist/
npm run dev        # rebuild on change
npm run format     # Prettier
```

`--ignore-scripts` skips a native build step in a dev dependency that isn't needed to compile the node.

### Test in a local n8n

```bash
npm run build
npm link
cd ~/.n8n/nodes && npm link n8n-nodes-kalshi-trading
# restart n8n
```

### Publish

```bash
npm version minor   # or patch / major
npm publish         # runs the build first (prepublishOnly)
```

---

## Compatibility

- Built against `n8n-workflow` 1.x
- Tested on self-hosted **n8n 2.42.2** (Node.js 26)
- Uses the Kalshi Trade API v2, including the V2 order endpoints (`/portfolio/events/orders`)

---

## Resources

**Kalshi**
- [Kalshi](https://kalshi.com)
- [Kalshi API documentation](https://docs.kalshi.com)
- [Kalshi regulatory documents (rulebook, member agreement)](https://kalshi.com/regulatory)
- [Kalshi demo environment](https://demo.kalshi.co)

**n8n**
- [n8n](https://n8n.io)
- [n8n documentation](https://docs.n8n.io)
- [Community nodes](https://docs.n8n.io/integrations/community-nodes/)
- [n8n community forum](https://community.n8n.io)

---

## Support

Report bugs or request features in [GitHub Issues](https://github.com/Vission01/n8n-nodes-kalshi-trading/issues).

---

## Changelog

### 1.2.0

Kalshi retired several endpoints, which broke order placement and some market operations. This release moves the node to the current API.

**Fixed**
- **Order > Create** now uses the V2 endpoint (`POST /portfolio/events/orders`). The old endpoint is rejected by Kalshi ("Please switch to the V2 endpoints").
- **Order > Cancel / Decrease / Batch Create / Batch Cancel** now use the V2 endpoints.
- **Market > Get History** returns candlesticks (the old `/history` endpoint returns 404).
- **Market > Get Trades** uses `/markets/trades?ticker=` (the old path returns 404).
- **Market > Get Many**: the status filter `Active` was rejected by Kalshi. Options are now Open (default), Unopened, Closed and Settled.
- **Position > Get Many**: the count filter `Non-Zero` was rejected by Kalshi. Options are now All, Open Position and Ever Traded (existing workflows using `Non-Zero` are mapped automatically).

**Changed**
- **Price (Cents)** is now the price **of the selected side**. Previously it was always sent as the YES price, so a `No` order at 90 actually priced NO at 10¢.

**Added**
- Order options: **Time In Force**, **Post Only**, **Reduce Only**; Expiration TS now works with Good Till Canceled orders
- **Market Ticker** field for Cancel and Decrease (shard routing)
- History options: **Period** (1 min / 1 hour / 1 day), **Start TS**, **End TS**, **Series Ticker**

**Removed**
- Order option **Sell Position Floor** (not supported by the V2 endpoint)

### 1.1.0
- Authenticate with a Kalshi API key and signed requests (RSA or Ed25519)
- Copy the node icon into `dist` on build

---

## License

[MIT](LICENSE)

---

## Disclaimer

- This is an **unofficial** community node, **not affiliated** with Kalshi or n8n.
- Use at your own risk. Test with the **Demo** environment first.
- Automated trading can lose money quickly. The authors are not responsible for trading losses.
- Read Kalshi's [regulatory documents](https://kalshi.com/regulatory) before trading.

**Only trade with money you can afford to lose.**

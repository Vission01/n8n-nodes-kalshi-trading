import { randomUUID } from 'crypto';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { kalshiApiRequest } from './GenericFunctions';

export class Kalshi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kalshi',
		name: 'kalshi',
		icon: 'file:kalshi.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Kalshi prediction markets API',
		defaults: {
			name: 'Kalshi',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'kalshiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Market', value: 'market' },
					{ name: 'Event', value: 'event' },
					{ name: 'Order', value: 'order' },
					{ name: 'Position', value: 'position' },
					{ name: 'Portfolio', value: 'portfolio' },
					{ name: 'Exchange', value: 'exchange' },
				],
				default: 'market',
			},

			// Market Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['market'] } },
				options: [
					{ name: 'Get', value: 'get', description: 'Get a market by ticker', action: 'Get a market' },
					{ name: 'Get Many', value: 'getAll', description: 'Get many markets', action: 'Get many markets' },
					{ name: 'Get History', value: 'getHistory', description: 'Get market price history (candlesticks)', action: 'Get market history' },
					{ name: 'Get Orderbook', value: 'getOrderbook', description: 'Get market orderbook', action: 'Get market orderbook' },
					{ name: 'Get Trades', value: 'getTrades', description: 'Get market trades', action: 'Get market trades' },
				],
				default: 'get',
			},

			// Event Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['event'] } },
				options: [
					{ name: 'Get', value: 'get', description: 'Get an event by ticker', action: 'Get an event' },
					{ name: 'Get Many', value: 'getAll', description: 'Get many events', action: 'Get many events' },
				],
				default: 'get',
			},

			// Order Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['order'] } },
				options: [
					{ name: 'Create', value: 'create', description: 'Create a new order', action: 'Create an order' },
					{ name: 'Cancel', value: 'cancel', description: 'Cancel an order', action: 'Cancel an order' },
					{ name: 'Decrease', value: 'decrease', description: 'Decrease order quantity', action: 'Decrease an order' },
					{ name: 'Get', value: 'get', description: 'Get an order', action: 'Get an order' },
					{ name: 'Get Many', value: 'getAll', description: 'Get many orders', action: 'Get many orders' },
					{ name: 'Batch Create', value: 'batchCreate', description: 'Create multiple orders', action: 'Batch create orders' },
					{ name: 'Batch Cancel', value: 'batchCancel', description: 'Cancel multiple orders', action: 'Batch cancel orders' },
				],
				default: 'create',
			},

			// Position Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['position'] } },
				options: [
					{ name: 'Get Many', value: 'getAll', description: 'Get all positions', action: 'Get many positions' },
				],
				default: 'getAll',
			},

			// Portfolio Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['portfolio'] } },
				options: [
					{ name: 'Get Balance', value: 'getBalance', description: 'Get portfolio balance', action: 'Get portfolio balance' },
					{ name: 'Get Fills', value: 'getFills', description: 'Get portfolio fills', action: 'Get portfolio fills' },
				],
				default: 'getBalance',
			},

			// Exchange Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['exchange'] } },
				options: [
					{ name: 'Get Status', value: 'getStatus', description: 'Get exchange status', action: 'Get exchange status' },
					{ name: 'Get Schedule', value: 'getSchedule', description: 'Get exchange schedule', action: 'Get exchange schedule' },
				],
				default: 'getStatus',
			},

			// Market Fields
			{
				displayName: 'Ticker',
				name: 'ticker',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['market'], operation: ['get', 'getHistory', 'getOrderbook', 'getTrades'] } },
				default: '',
				description: 'The market ticker symbol',
			},

			// Market Get All Filters
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['market'], operation: ['getAll'] } },
				options: [
					{ displayName: 'Event Ticker', name: 'event_ticker', type: 'string', default: '', description: 'Filter by event ticker' },
					{ displayName: 'Series Ticker', name: 'series_ticker', type: 'string', default: '', description: 'Filter by series ticker' },
					{
						displayName: 'Status', name: 'status', type: 'options',
						options: [
							{ name: 'Open', value: 'open' },
							{ name: 'Unopened', value: 'unopened' },
							{ name: 'Closed', value: 'closed' },
							{ name: 'Settled', value: 'settled' },
						],
						default: 'open', description: 'Filter by market status',
					},
					{ displayName: 'Limit', name: 'limit', type: 'number', default: 100, description: 'Max number of results to return' },
					{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', description: 'Pagination cursor' },
					{ displayName: 'Ticker', name: 'ticker', type: 'string', default: '', description: 'Search by ticker' },
					{ displayName: 'Max Close TS', name: 'max_close_ts', type: 'number', default: 0, description: 'Maximum close timestamp' },
					{ displayName: 'Min Close TS', name: 'min_close_ts', type: 'number', default: 0, description: 'Minimum close timestamp' },
				],
			},

			// Market History (candlesticks) Options
			{
				displayName: 'History Options',
				name: 'historyOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['market'], operation: ['getHistory'] } },
				options: [
					{ displayName: 'Series Ticker', name: 'series_ticker', type: 'string', default: '', description: 'Series of the market (e.g. KXTEMPNYCHS). Looked up automatically when empty.' },
					{
						displayName: 'Period', name: 'period_interval', type: 'options',
						options: [
							{ name: '1 Minute', value: 1 },
							{ name: '1 Hour', value: 60 },
							{ name: '1 Day', value: 1440 },
						],
						default: 60, description: 'Candlestick length',
					},
					{ displayName: 'Start TS', name: 'start_ts', type: 'number', default: 0, description: 'Start time (Unix seconds). Defaults to 24 hours ago.' },
					{ displayName: 'End TS', name: 'end_ts', type: 'number', default: 0, description: 'End time (Unix seconds). Defaults to now.' },
				],
			},

			// Orderbook Fields
			{
				displayName: 'Depth',
				name: 'depth',
				type: 'number',
				default: 10,
				displayOptions: { show: { resource: ['market'], operation: ['getOrderbook'] } },
				description: 'Order book depth',
			},

			// Trades Options
			{
				displayName: 'Trades Options',
				name: 'tradesOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['market'], operation: ['getTrades'] } },
				options: [
					{ displayName: 'Limit', name: 'limit', type: 'number', default: 100, description: 'Max number of trades' },
					{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', description: 'Pagination cursor' },
					{ displayName: 'Min TS', name: 'min_ts', type: 'number', default: 0, description: 'Minimum timestamp' },
					{ displayName: 'Max TS', name: 'max_ts', type: 'number', default: 0, description: 'Maximum timestamp' },
				],
			},

			// Event Fields
			{
				displayName: 'Event Ticker',
				name: 'eventTicker',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['event'], operation: ['get'] } },
				default: '',
				description: 'The event ticker',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['event'], operation: ['getAll'] } },
				options: [
					{ displayName: 'Series Ticker', name: 'series_ticker', type: 'string', default: '', description: 'Filter by series ticker' },
					{
						displayName: 'Status', name: 'status', type: 'options',
						options: [
							{ name: 'Open', value: 'open' },
							{ name: 'Closed', value: 'closed' },
							{ name: 'Settled', value: 'settled' },
						],
						default: 'open', description: 'Filter by event status',
					},
					{ displayName: 'Limit', name: 'limit', type: 'number', default: 100, description: 'Max number of results' },
					{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', description: 'Pagination cursor' },
				],
			},

			// Order Create Fields
			{
				displayName: 'Ticker',
				name: 'ticker',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['order'], operation: ['create'] } },
				default: '',
				description: 'Market ticker',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				required: true,
				displayOptions: { show: { resource: ['order'], operation: ['create'] } },
				options: [
					{ name: 'Buy', value: 'buy' },
					{ name: 'Sell', value: 'sell' },
				],
				default: 'buy',
				description: 'Order action',
			},
			{
				displayName: 'Side',
				name: 'side',
				type: 'options',
				required: true,
				displayOptions: { show: { resource: ['order'], operation: ['create'] } },
				options: [
					{ name: 'Yes', value: 'yes' },
					{ name: 'No', value: 'no' },
				],
				default: 'yes',
				description: 'Order side',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				required: true,
				displayOptions: { show: { resource: ['order'], operation: ['create'] } },
				options: [
					{ name: 'Market', value: 'market' },
					{ name: 'Limit', value: 'limit' },
				],
				default: 'limit',
				description: 'Order type',
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				required: true,
				displayOptions: { show: { resource: ['order'], operation: ['create'] } },
				default: 1,
				description: 'Number of contracts',
			},
			{
				displayName: 'Price (Cents)',
				name: 'price',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 99 },
				displayOptions: { show: { resource: ['order'], operation: ['create'], type: ['limit'] } },
				default: 50,
				description: 'Limit price in cents (1-99) for the selected side. E.g. Side "No" at 90 buys NO contracts at 90¢.',
			},
			{
				displayName: 'Order Options',
				name: 'orderOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['order'], operation: ['create'] } },
				options: [
					{
						displayName: 'Time In Force', name: 'time_in_force', type: 'options',
						options: [
							{ name: 'Good Till Canceled', value: 'good_till_canceled' },
							{ name: 'Immediate or Cancel', value: 'immediate_or_cancel' },
							{ name: 'Fill or Kill', value: 'fill_or_kill' },
						],
						default: 'good_till_canceled', description: 'How long the order stays active. Market orders always use Immediate or Cancel.',
					},
					{ displayName: 'Expiration TS', name: 'expiration_ts', type: 'number', default: 0, description: 'Unix timestamp (seconds) when a Good Till Canceled order expires' },
					{ displayName: 'Client Order ID', name: 'client_order_id', type: 'string', default: '', description: 'Custom order ID for deduplication (auto-generated when empty)' },
					{ displayName: 'Post Only', name: 'post_only', type: 'boolean', default: false, description: 'Whether to reject the order if it would immediately match (maker only)' },
					{ displayName: 'Reduce Only', name: 'reduce_only', type: 'boolean', default: false, description: 'Whether the order may only reduce an existing position (requires Immediate or Cancel)' },
				],
			},

			// Order Cancel/Decrease/Get Fields
			{
				displayName: 'Order ID',
				name: 'orderId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['order'], operation: ['cancel', 'decrease', 'get'] } },
				default: '',
				description: 'The order ID',
			},
			{
				displayName: 'Market Ticker',
				name: 'marketTicker',
				type: 'string',
				displayOptions: { show: { resource: ['order'], operation: ['cancel', 'decrease'] } },
				default: '',
				description: 'Ticker of the order\'s market. Recommended: lets Kalshi route the request to the right exchange shard.',
			},
			{
				displayName: 'Reduce By',
				name: 'reduceBy',
				type: 'number',
				required: true,
				displayOptions: { show: { resource: ['order'], operation: ['decrease'] } },
				default: 1,
				description: 'Number of contracts to reduce by',
			},

			// Order Get All Filters
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['order'], operation: ['getAll'] } },
				options: [
					{ displayName: 'Ticker', name: 'ticker', type: 'string', default: '', description: 'Filter by ticker' },
					{ displayName: 'Event Ticker', name: 'event_ticker', type: 'string', default: '', description: 'Filter by event ticker' },
					{
						displayName: 'Status', name: 'status', type: 'options',
						options: [
							{ name: 'Resting', value: 'resting' },
							{ name: 'Canceled', value: 'canceled' },
							{ name: 'Executed', value: 'executed' },
						],
						default: 'resting', description: 'Filter by order status',
					},
					{ displayName: 'Limit', name: 'limit', type: 'number', default: 100, description: 'Max number of results' },
					{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', description: 'Pagination cursor' },
				],
			},

			// Batch Order Create
			{
				displayName: 'Orders',
				name: 'orders',
				type: 'json',
				required: true,
				displayOptions: { show: { resource: ['order'], operation: ['batchCreate'] } },
				default: '[]',
				description: 'JSON array of V2 order objects, e.g. [{"ticker":"…","side":"bid","count":"1.00","price":"0.5000","time_in_force":"good_till_canceled","self_trade_prevention_type":"taker_at_cross"}]. side: bid = buy YES, ask = sell YES (buy NO); price is the YES price in dollars.',
			},

			// Batch Order Cancel
			{
				displayName: 'Order IDs',
				name: 'orderIds',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['order'], operation: ['batchCancel'] } },
				default: '',
				description: 'Comma-separated list of order IDs to cancel',
			},

			// Position Filters
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['position'], operation: ['getAll'] } },
				options: [
					{ displayName: 'Ticker', name: 'ticker', type: 'string', default: '', description: 'Filter by ticker' },
					{ displayName: 'Event Ticker', name: 'event_ticker', type: 'string', default: '', description: 'Filter by event ticker' },
					{ displayName: 'Limit', name: 'limit', type: 'number', default: 100, description: 'Max number of results' },
					{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', description: 'Pagination cursor' },
					{
						displayName: 'Count Filter', name: 'count_filter', type: 'options',
						options: [
							{ name: 'All', value: 'all' },
							{ name: 'Open Position', value: 'position' },
							{ name: 'Ever Traded', value: 'total_traded' },
						],
						default: 'all', description: 'Only return positions with a non-zero open position or traded count',
					},
					{
						displayName: 'Settlement Status', name: 'settlement_status', type: 'options',
						options: [
							{ name: 'All', value: 'all' },
							{ name: 'Settled', value: 'settled' },
							{ name: 'Unsettled', value: 'unsettled' },
						],
						default: 'all', description: 'Filter by settlement status',
					},
				],
			},

			// Portfolio Fills Filters
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['portfolio'], operation: ['getFills'] } },
				options: [
					{ displayName: 'Ticker', name: 'ticker', type: 'string', default: '', description: 'Filter by ticker' },
					{ displayName: 'Order ID', name: 'order_id', type: 'string', default: '', description: 'Filter by order ID' },
					{ displayName: 'Min TS', name: 'min_ts', type: 'number', default: 0, description: 'Minimum timestamp' },
					{ displayName: 'Max TS', name: 'max_ts', type: 'number', default: 0, description: 'Maximum timestamp' },
					{ displayName: 'Limit', name: 'limit', type: 'number', default: 100, description: 'Max number of results' },
					{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', description: 'Pagination cursor' },
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: any[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'market') {
					if (operation === 'get') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						const response = await kalshiApiRequest.call(this, 'GET', `/trade-api/v2/markets/${encodeURIComponent(ticker)}`);
						returnData.push(response);
					}
					if (operation === 'getAll') {
						const filters = this.getNodeParameter('filters', i) as any;
						const qs: any = {};
						Object.keys(filters).forEach((key) => {
							if (filters[key]) qs[key] = filters[key];
						});
						const response = await kalshiApiRequest.call(this, 'GET', '/trade-api/v2/markets', {}, qs);
						returnData.push(response);
					}
					if (operation === 'getHistory') {
						// Kalshi replaced /markets/{ticker}/history with candlesticks under the series path.
						const ticker = this.getNodeParameter('ticker', i) as string;
						const options = this.getNodeParameter('historyOptions', i) as any;
						let seriesTicker = (options.series_ticker as string) || '';
						if (!seriesTicker) {
							const marketRes = await kalshiApiRequest.call(this, 'GET', `/trade-api/v2/markets/${encodeURIComponent(ticker)}`);
							const eventTicker = marketRes?.market?.event_ticker as string;
							const eventRes = await kalshiApiRequest.call(this, 'GET', `/trade-api/v2/events/${encodeURIComponent(eventTicker)}`);
							seriesTicker = eventRes?.event?.series_ticker || eventTicker.split('-')[0];
						}
						const now = Math.floor(Date.now() / 1000);
						const qs = {
							start_ts: options.start_ts || now - 86400,
							end_ts: options.end_ts || now,
							period_interval: options.period_interval || 60,
						};
						const response = await kalshiApiRequest.call(
							this,
							'GET',
							`/trade-api/v2/series/${encodeURIComponent(seriesTicker)}/markets/${encodeURIComponent(ticker)}/candlesticks`,
							{},
							qs,
						);
						returnData.push(response);
					}
					if (operation === 'getOrderbook') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						const depth = this.getNodeParameter('depth', i) as number;
						const response = await kalshiApiRequest.call(this, 'GET', `/trade-api/v2/markets/${encodeURIComponent(ticker)}/orderbook`, {}, { depth });
						returnData.push(response);
					}
					if (operation === 'getTrades') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						const options = this.getNodeParameter('tradesOptions', i) as any;
						const qs: any = { ticker };
						Object.keys(options).forEach((key) => {
							if (options[key]) qs[key] = options[key];
						});
						const response = await kalshiApiRequest.call(this, 'GET', '/trade-api/v2/markets/trades', {}, qs);
						returnData.push(response);
					}
				}

				if (resource === 'event') {
					if (operation === 'get') {
						const eventTicker = this.getNodeParameter('eventTicker', i) as string;
						const response = await kalshiApiRequest.call(this, 'GET', `/trade-api/v2/events/${encodeURIComponent(eventTicker)}`);
						returnData.push(response);
					}
					if (operation === 'getAll') {
						const filters = this.getNodeParameter('filters', i) as any;
						const qs: any = {};
						Object.keys(filters).forEach((key) => {
							if (filters[key]) qs[key] = filters[key];
						});
						const response = await kalshiApiRequest.call(this, 'GET', '/trade-api/v2/events', {}, qs);
						returnData.push(response);
					}
				}

				if (resource === 'order') {
					if (operation === 'create') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						const action = this.getNodeParameter('action', i) as string;
						const side = this.getNodeParameter('side', i) as string;
						const type = this.getNodeParameter('type', i) as string;
						const count = this.getNodeParameter('count', i) as number;
						const options = this.getNodeParameter('orderOptions', i) as any;

						// Kalshi V2 orders use a single YES book: "bid" buys YES, "ask" sells YES (= buys NO).
						// The price is always the YES price in fixed-point dollars.
						const bidYes = (action === 'buy' && side === 'yes') || (action === 'sell' && side === 'no');
						let yesCents: number;
						if (type === 'limit') {
							const sideCents = Number(this.getNodeParameter('price', i));
							if (!(sideCents >= 1 && sideCents <= 99)) {
								throw new NodeOperationError(this.getNode(), 'Price must be between 1 and 99 cents', { itemIndex: i });
							}
							yesCents = side === 'yes' ? sideCents : 100 - sideCents;
						} else {
							// Market order: cross the whole book, IOC so nothing rests.
							yesCents = bidYes ? 99 : 1;
						}

						const body: any = {
							ticker,
							side: bidYes ? 'bid' : 'ask',
							count: Number(count).toFixed(2),
							price: (yesCents / 100).toFixed(4),
							time_in_force: type === 'market' ? 'immediate_or_cancel' : options.time_in_force || 'good_till_canceled',
							self_trade_prevention_type: 'taker_at_cross',
							client_order_id: options.client_order_id || randomUUID(),
						};
						if (options.post_only) body.post_only = true;
						if (options.reduce_only) body.reduce_only = true;
						if (options.expiration_ts && body.time_in_force === 'good_till_canceled') body.expiration_time = options.expiration_ts;

						const response = await kalshiApiRequest.call(this, 'POST', '/trade-api/v2/portfolio/events/orders', body);
						returnData.push(response);
					}
					if (operation === 'cancel') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const marketTicker = this.getNodeParameter('marketTicker', i, '') as string;
						const qs: any = marketTicker ? { market_ticker: marketTicker } : {};
						const response = await kalshiApiRequest.call(this, 'DELETE', `/trade-api/v2/portfolio/events/orders/${encodeURIComponent(orderId)}`, {}, qs);
						returnData.push(response);
					}
					if (operation === 'decrease') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const reduceBy = this.getNodeParameter('reduceBy', i) as number;
						const marketTicker = this.getNodeParameter('marketTicker', i, '') as string;
						const body: any = { reduce_by: Number(reduceBy).toFixed(2) };
						if (marketTicker) body.market_ticker = marketTicker;
						const response = await kalshiApiRequest.call(this, 'POST', `/trade-api/v2/portfolio/events/orders/${encodeURIComponent(orderId)}/decrease`, body);
						returnData.push(response);
					}
					if (operation === 'get') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const response = await kalshiApiRequest.call(this, 'GET', `/trade-api/v2/portfolio/orders/${encodeURIComponent(orderId)}`);
						returnData.push(response);
					}
					if (operation === 'getAll') {
						const filters = this.getNodeParameter('filters', i) as any;
						const qs: any = {};
						Object.keys(filters).forEach((key) => {
							if (filters[key]) qs[key] = filters[key];
						});
						const response = await kalshiApiRequest.call(this, 'GET', '/trade-api/v2/portfolio/orders', {}, qs);
						returnData.push(response);
					}
					if (operation === 'batchCreate') {
						const ordersJson = this.getNodeParameter('orders', i) as string;
						let orders: unknown;
						try {
							orders = typeof ordersJson === 'string' ? JSON.parse(ordersJson) : ordersJson;
						} catch {
							throw new NodeOperationError(this.getNode(), 'Orders must be valid JSON', { itemIndex: i });
						}
						if (!Array.isArray(orders)) {
							throw new NodeOperationError(this.getNode(), 'Orders must be a JSON array', { itemIndex: i });
						}
						const response = await kalshiApiRequest.call(this, 'POST', '/trade-api/v2/portfolio/events/orders/batched', { orders });
						returnData.push(response);
					}
					if (operation === 'batchCancel') {
						const orderIds = this.getNodeParameter('orderIds', i) as string;
						const orders = orderIds
							.split(',')
							.map((id: string) => id.trim())
							.filter((id: string) => id)
							.map((order_id: string) => ({ order_id }));
						const response = await kalshiApiRequest.call(this, 'DELETE', '/trade-api/v2/portfolio/events/orders/batched', { orders });
						returnData.push(response);
					}
				}

				if (resource === 'position') {
					if (operation === 'getAll') {
						const filters = this.getNodeParameter('filters', i) as any;
						const qs: any = {};
						Object.keys(filters).forEach((key) => {
							if (filters[key]) qs[key] = filters[key];
						});
						// 'all' means no filter; 'non_zero' was the pre-1.2 value and is not accepted by Kalshi.
						if (qs.count_filter === 'all') delete qs.count_filter;
						if (qs.count_filter === 'non_zero') qs.count_filter = 'position';
						const response = await kalshiApiRequest.call(this, 'GET', '/trade-api/v2/portfolio/positions', {}, qs);
						returnData.push(response);
					}
				}

				if (resource === 'portfolio') {
					if (operation === 'getBalance') {
						const response = await kalshiApiRequest.call(this, 'GET', '/trade-api/v2/portfolio/balance');
						returnData.push(response);
					}
					if (operation === 'getFills') {
						const filters = this.getNodeParameter('filters', i) as any;
						const qs: any = {};
						Object.keys(filters).forEach((key) => {
							if (filters[key]) qs[key] = filters[key];
						});
						const response = await kalshiApiRequest.call(this, 'GET', '/trade-api/v2/portfolio/fills', {}, qs);
						returnData.push(response);
					}
				}

				if (resource === 'exchange') {
					if (operation === 'getStatus') {
						const response = await kalshiApiRequest.call(this, 'GET', '/trade-api/v2/exchange/status');
						returnData.push(response);
					}
					if (operation === 'getSchedule') {
						const response = await kalshiApiRequest.call(this, 'GET', '/trade-api/v2/exchange/schedule');
						returnData.push(response);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({ error: errorMessage });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}

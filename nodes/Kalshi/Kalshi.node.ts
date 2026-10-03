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
					{ name: 'Get History', value: 'getHistory', description: 'Get market history', action: 'Get market history' },
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
							{ name: 'Active', value: 'active' },
							{ name: 'Closed', value: 'closed' },
							{ name: 'Settled', value: 'settled' },
						],
						default: 'active', description: 'Filter by market status',
					},
					{ displayName: 'Limit', name: 'limit', type: 'number', default: 100, description: 'Max number of results to return' },
					{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', description: 'Pagination cursor' },
					{ displayName: 'Ticker', name: 'ticker', type: 'string', default: '', description: 'Search by ticker' },
					{ displayName: 'Max Close TS', name: 'max_close_ts', type: 'number', default: 0, description: 'Maximum close timestamp' },
					{ displayName: 'Min Close TS', name: 'min_close_ts', type: 'number', default: 0, description: 'Minimum close timestamp' },
				],
			},

			// Market History Options
			{
				displayName: 'History Options',
				name: 'historyOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['market'], operation: ['getHistory'] } },
				options: [
					{ displayName: 'Limit', name: 'limit', type: 'number', default: 100, description: 'Max number of results' },
					{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', description: 'Pagination cursor' },
					{ displayName: 'Min TS', name: 'min_ts', type: 'number', default: 0, description: 'Minimum timestamp' },
					{ displayName: 'Max TS', name: 'max_ts', type: 'number', default: 0, description: 'Maximum timestamp' },
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
				displayOptions: { show: { resource: ['order'], operation: ['create'], type: ['limit'] } },
				default: 50,
				description: 'Limit price in cents (1-99)',
			},
			{
				displayName: 'Order Options',
				name: 'orderOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['order'], operation: ['create'] } },
				options: [
					{ displayName: 'Expiration TS', name: 'expiration_ts', type: 'number', default: 0, description: 'Order expiration timestamp' },
					{ displayName: 'Client Order ID', name: 'client_order_id', type: 'string', default: '', description: 'Custom order ID' },
					{ displayName: 'Sell Position Floor', name: 'sell_position_floor', type: 'number', default: 0, description: 'Minimum position to maintain' },
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
				description: 'Array of order objects to create',
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
							{ name: 'Non-Zero', value: 'non_zero' },
						],
						default: 'all', description: 'Filter positions by count',
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
						const ticker = this.getNodeParameter('ticker', i) as string;
						const options = this.getNodeParameter('historyOptions', i) as any;
						const qs: any = {};
						Object.keys(options).forEach((key) => {
							if (options[key]) qs[key] = options[key];
						});
						const response = await kalshiApiRequest.call(this, 'GET', `/trade-api/v2/markets/${encodeURIComponent(ticker)}/history`, {}, qs);
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
						const qs: any = {};
						Object.keys(options).forEach((key) => {
							if (options[key]) qs[key] = options[key];
						});
						const response = await kalshiApiRequest.call(this, 'GET', `/trade-api/v2/markets/${encodeURIComponent(ticker)}/trades`, {}, qs);
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

						const body: any = { ticker, action, side, type, count };

						if (type === 'limit') {
							body.yes_price = this.getNodeParameter('price', i) as number;
						}

						Object.keys(options).forEach((key) => {
							if (options[key]) body[key] = options[key];
						});

						const response = await kalshiApiRequest.call(this, 'POST', '/trade-api/v2/portfolio/orders', body);
						returnData.push(response);
					}
					if (operation === 'cancel') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const response = await kalshiApiRequest.call(this, 'DELETE', `/trade-api/v2/portfolio/orders/${encodeURIComponent(orderId)}`);
						returnData.push(response);
					}
					if (operation === 'decrease') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const reduceBy = this.getNodeParameter('reduceBy', i) as number;
						const response = await kalshiApiRequest.call(this, 'POST', `/trade-api/v2/portfolio/orders/${encodeURIComponent(orderId)}/decrease`, { reduce_by: reduceBy });
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
						const response = await kalshiApiRequest.call(this, 'POST', '/trade-api/v2/portfolio/orders/batches', { orders });
						returnData.push(response);
					}
					if (operation === 'batchCancel') {
						const orderIds = this.getNodeParameter('orderIds', i) as string;
						const ids = orderIds.split(',').map((id: string) => id.trim());
						const response = await kalshiApiRequest.call(this, 'DELETE', '/trade-api/v2/portfolio/orders/batches', { ids });
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

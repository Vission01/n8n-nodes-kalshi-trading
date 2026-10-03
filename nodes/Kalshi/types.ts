export interface IKalshiMarket {
	ticker: string;
	event_ticker: string;
	series_ticker: string;
	title: string;
	subtitle: string;
	status: string;
	yes_bid: number;
	yes_ask: number;
	no_bid: number;
	no_ask: number;
	last_price: number;
	volume: number;
	open_interest: number;
}

export interface IKalshiOrder {
	order_id: string;
	ticker: string;
	action: string;
	side: string;
	type: string;
	count: number;
	yes_price?: number;
	status: string;
}

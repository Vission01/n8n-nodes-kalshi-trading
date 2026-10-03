import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';

type KalshiContext = IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions;

const BASE_URLS: Record<string, string> = {
	production: 'https://external-api.kalshi.com',
	demo: 'https://external-api.demo.kalshi.co',
};

export async function kalshiApiRequest(
	this: KalshiContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('kalshiApi');
	const baseUrl = BASE_URLS[credentials.environment as string] ?? BASE_URLS.demo;

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		qs,
		json: true,
	};

	if (Object.keys(body).length > 0) {
		options.body = body;
	}

	try {
		// Signing headers are added by the credential's authenticate().
		return await this.helpers.httpRequestWithAuthentication.call(this, 'kalshiApi', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function kalshiApiRequestAllItems(
	this: KalshiContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<any[]> {
	const returnData: any[] = [];
	const query: IDataObject = { ...qs };
	let cursor: string | undefined;

	do {
		if (cursor) query.cursor = cursor;
		const responseData = await kalshiApiRequest.call(this, method, endpoint, body, query);

		if (responseData.markets) returnData.push(...responseData.markets);
		else if (responseData.events) returnData.push(...responseData.events);
		else if (responseData.orders) returnData.push(...responseData.orders);
		else if (responseData.positions) returnData.push(...responseData.positions);
		else if (responseData.fills) returnData.push(...responseData.fills);
		else returnData.push(responseData);

		cursor = responseData.cursor || undefined;
	} while (cursor);

	return returnData;
}

import {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';
import { createSignature, loadPrivateKey } from '../nodes/Kalshi/signing';

export class KalshiApi implements ICredentialType {
	name = 'kalshiApi';
	displayName = 'Kalshi API';
	documentationUrl = 'https://docs.kalshi.com/getting_started/quick_start_authenticated_requests';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key ID',
			name: 'apiKeyId',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'The API Key ID shown when you create a key in Kalshi (Account & security > API Keys)',
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: { password: true, rows: 5 },
			default: '',
			required: true,
			description:
				'The full contents of the PEM private key file downloaded from Kalshi, including the BEGIN and END lines',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Production', value: 'production' },
				{ name: 'Demo', value: 'demo' },
			],
			default: 'demo',
			description:
				'The Kalshi environment to use. API keys are not shared between environments. Use Demo for testing without real money.',
		},
	];

	// Requests are signed per call, so a function is used instead of static headers.
	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const apiKeyId = String(credentials.apiKeyId ?? '').trim();
		const privateKey = loadPrivateKey(String(credentials.privateKey ?? ''));

		const url = requestOptions.url ?? '';
		const target = /^https?:\/\//i.test(url)
			? url
			: `${(requestOptions.baseURL ?? '').replace(/\/+$/, '')}${url}`;

		// Only the path is signed; query parameters are excluded.
		const { pathname } = new URL(target);
		const timestamp = Date.now().toString();
		const signature = createSignature(privateKey, timestamp, requestOptions.method ?? 'GET', pathname);

		requestOptions.headers = {
			...requestOptions.headers,
			'KALSHI-ACCESS-KEY': apiKeyId,
			'KALSHI-ACCESS-TIMESTAMP': timestamp,
			'KALSHI-ACCESS-SIGNATURE': signature,
		};

		return requestOptions;
	}

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.environment === "production" ? "https://external-api.kalshi.com" : "https://external-api.demo.kalshi.co"}}',
			url: '/trade-api/v2/portfolio/balance',
			method: 'GET',
		},
	};
}

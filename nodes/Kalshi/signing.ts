import { constants, createPrivateKey, KeyObject, sign } from 'crypto';

const PEM_PATTERN = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/;

/**
 * Parses a PEM private key. Tolerates keys pasted with literal "\n" sequences
 * or with line breaks collapsed into spaces, which is common in credential forms.
 */
export function loadPrivateKey(rawKey: string): KeyObject {
	const normalized = rawKey.trim().replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r/g, '');
	const match = PEM_PATTERN.exec(normalized);
	if (!match) {
		throw new Error('The Kalshi private key must be a PEM file containing BEGIN/END markers.');
	}

	const body = match[2].replace(/\s+/g, '');
	const lines = body.match(/.{1,64}/g) ?? [];
	const pem = `-----BEGIN ${match[1]}-----\n${lines.join('\n')}\n-----END ${match[1]}-----\n`;

	let key: KeyObject;
	try {
		key = createPrivateKey({ key: pem, format: 'pem' });
	} catch {
		// The underlying error is deliberately dropped so key material is never echoed.
		throw new Error(
			'The Kalshi private key could not be parsed. Use the unencrypted PEM file downloaded from Kalshi.',
		);
	}

	if (key.asymmetricKeyType !== 'rsa' && key.asymmetricKeyType !== 'ed25519') {
		throw new Error('Unsupported Kalshi private key type. Only RSA and Ed25519 keys are supported.');
	}

	return key;
}

/** Signs `timestamp + METHOD + path` as required by the Kalshi API; query strings must not be included. */
export function createSignature(
	privateKey: KeyObject,
	timestamp: string,
	method: string,
	path: string,
): string {
	const message = Buffer.from(`${timestamp}${method.toUpperCase()}${path}`, 'utf8');

	if (privateKey.asymmetricKeyType === 'ed25519') {
		return sign(null, message, privateKey).toString('base64');
	}

	return sign('sha256', message, {
		key: privateKey,
		padding: constants.RSA_PKCS1_PSS_PADDING,
		saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
	}).toString('base64');
}

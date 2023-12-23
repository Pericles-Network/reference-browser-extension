import { FailableResult, asFailable, safeParseJson } from '@flagpoonage/tools';

export async function generateSigningKeyPair(exportable = true) {
  return asFailable(() =>
    globalThis.crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        hash: 'SHA-256',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
      },
      exportable,
      ['sign', 'verify'],
    ),
  );
}

export async function generateEncryptingKeyPair(exportable = true) {
  return asFailable(() =>
    globalThis.crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        hash: 'SHA-256',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
      },
      exportable,
      ['encrypt', 'decrypt'],
    ),
  );
}

export async function exportJsonWebKey(key: CryptoKey) {
  return asFailable(() => globalThis.crypto.subtle.exportKey('jwk', key));
}

export async function importJsonWebKeyFromString(
  value: string,
  usage: 'sign' | 'verify' | 'encrypt',
) {
  const json = safeParseJson(value);

  if (!json.success) {
    return json;
  }

  return importJsonWebKey(json.value as JsonWebKey, usage);
}

export async function importJsonWebKey(
  value: JsonWebKey,
  usage: 'sign' | 'verify' | 'encrypt',
) {
  return asFailable(() =>
    globalThis.crypto.subtle.importKey(
      'jwk',
      value,
      {
        name: 'RSA-PSS',
        hash: 'SHA-256',
      },
      false,
      [usage],
    ),
  );
}

export type CryptoKeyInput = string | JsonWebKey | CryptoKey;
export type SignatureInfoInput =
  | SignatureInfo
  | ArrayBuffer
  | Uint8Array
  | string;

export interface SignatureInfo {
  buffer: ArrayBuffer;
  bytes: Uint8Array;
  base64: string;
}

export async function getCryptoKeyFromValue(
  key: CryptoKeyInput,
  usage: 'sign' | 'verify' | 'encrypt',
) {
  if (typeof key === 'string') {
    return importJsonWebKeyFromString(key, usage);
  }
  if (key instanceof CryptoKey) {
    return asFailable(async () => key);
  }
  return importJsonWebKey(key, usage);
}

export async function signPayloadWithJsonWebKey(
  payload: string,
  key: CryptoKeyInput,
): Promise<FailableResult<SignatureInfo>> {
  const signing_key_result = await getCryptoKeyFromValue(key, 'sign');

  if (!signing_key_result.success) {
    return signing_key_result;
  }

  return asFailable(async () => {
    const signing_key = signing_key_result.value;
    const identity_bytes = new TextEncoder().encode(payload);
    const signature = await globalThis.crypto.subtle.sign(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      signing_key,
      identity_bytes,
    );

    const bytes_of_signature = new Uint8Array(signature);
    const b64_of_signature = btoa(
      String.fromCharCode.apply(
        null,
        bytes_of_signature as unknown as number[],
      ),
    );

    return {
      buffer: signature,
      bytes: bytes_of_signature,
      base64: b64_of_signature,
    } as SignatureInfo;
  });
}

export async function encryptPayloadWithJsonWebKey(
  payload: string,
  key: CryptoKeyInput,
): Promise<FailableResult<SignatureInfo>> {
  const signing_key_result = await getCryptoKeyFromValue(key, 'encrypt');

  if (!signing_key_result.success) {
    return signing_key_result;
  }

  return asFailable(async () => {
    const signing_key = signing_key_result.value;
    const identity_bytes = new TextEncoder().encode(payload);
    const signature = await globalThis.crypto.subtle.encrypt(
      {
        name: 'RSA-PSS',
      },
      signing_key,
      identity_bytes,
    );

    const bytes_of_signature = new Uint8Array(signature);
    const b64_of_signature = btoa(
      String.fromCharCode.apply(
        null,
        bytes_of_signature as unknown as number[],
      ),
    );

    return {
      buffer: signature,
      bytes: bytes_of_signature,
      base64: b64_of_signature,
    } as SignatureInfo;
  });
}

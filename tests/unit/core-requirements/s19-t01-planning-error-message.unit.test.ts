import assert from 'node:assert/strict';
import { ApiClientError, getApiErrorMessage } from '../../../frontend/api/api-client';

assert.equal(
  getApiErrorMessage(new Error('network unavailable'), 'fallback'),
  'network unavailable'
);
assert.equal(
  getApiErrorMessage(new ApiClientError('', { statusCode: 502, details: { stack: 'secret' } }), 'fallback'),
  'fallback',
  'Empty API messages must use the safe fallback'
);
assert.equal(
  getApiErrorMessage({ message: 'Structured request failed', stack: '/internal/path' }, 'fallback'),
  'Structured request failed',
  'Structured errors expose only their message'
);
assert.equal(
  getApiErrorMessage({ message: '' }, 'fallback'),
  'fallback'
);
assert.equal(
  getApiErrorMessage('raw secret-like failure', 'fallback'),
  'fallback',
  'Non-Error thrown values must not be rendered'
);

console.log('PASS: S19-T01 planning error messages are explicit, safe, and fail closed.');

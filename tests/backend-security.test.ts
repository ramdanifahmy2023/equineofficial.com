import assert from 'node:assert/strict'
import test from 'node:test'
import { hashPassword, sessionHash, verifyPassword } from '../server/utils/auth'
import { isValidEmail, isValidPassword } from '../server/utils/auth-validation'
import { createRateLimiter } from '../server/utils/rate-limit'

const createError = (input: unknown) => Object.assign(new Error('validation failed'), input)
Object.assign(globalThis, { createError })

test('password hashes verify without accepting malformed or incorrect values', () => {
  const hash = hashPassword('correct horse battery staple', '00112233445566778899aabbccddeeff')
  assert.equal(verifyPassword('correct horse battery staple', hash), true)
  assert.equal(verifyPassword('wrong password', hash), false)
  assert.equal(verifyPassword('password', 'malformed'), false)
  assert.equal(verifyPassword('password', 'salt:00'), false)
  assert.match(sessionHash('token'), /^[0-9a-f]{64}$/)
})

test('auth validation bounds email and password input', () => {
  assert.equal(isValidEmail('user@example.com'), true)
  assert.equal(isValidEmail('invalid'), false)
  assert.equal(isValidEmail(`${'a'.repeat(250)}@x.com`), false)
  assert.equal(isValidPassword('12345678'), true)
  assert.equal(isValidPassword('1234567'), false)
  assert.equal(isValidPassword('x'.repeat(129)), false)
})

test('rate limiter blocks excess attempts and resets its window', () => {
  const limit = createRateLimiter(2, 1_000)
  assert.deepEqual(limit('client', 0), { allowed: true, remaining: 1, retryAfter: 0 })
  assert.deepEqual(limit('client', 10), { allowed: true, remaining: 0, retryAfter: 0 })
  assert.deepEqual(limit('client', 20), { allowed: false, remaining: 0, retryAfter: 1 })
  assert.equal(limit('other-client', 20).allowed, true)
  assert.deepEqual(limit('client', 1_000), { allowed: true, remaining: 1, retryAfter: 0 })
})

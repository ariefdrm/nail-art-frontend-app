import { describe, expect, it } from 'vitest'

import { urlBase64ToUint8Array } from './vapid'

describe('urlBase64ToUint8Array', () => {
  it('decodes base64url without padding', () => {
    // "hello" is aGVsbG8 in unpadded base64url.
    expect(Array.from(urlBase64ToUint8Array('aGVsbG8'))).toEqual([104, 101, 108, 108, 111])
  })

  it('handles the url-safe alphabet', () => {
    // 0xfb 0xff 0xbf is "-_-_" in base64url ("+/+/" in plain base64).
    expect(Array.from(urlBase64ToUint8Array('-_-_'))).toEqual([0xfb, 0xff, 0xbf])
  })

  it('returns bytes for a typical 65 byte VAPID key', () => {
    const key = 'BEl62iUYgUivxIkv69yViEuiBIa-ib37J8xQmrTvG0'
    expect(urlBase64ToUint8Array(key).length).toBeGreaterThan(20)
  })
})

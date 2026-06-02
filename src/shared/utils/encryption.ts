// Utility for encrypting/decrypting backup data using Web Crypto API

async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('designhub-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptData(data: string, password: string): Promise<string> {
  const key = await deriveKey(password)
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(data)
  )
  
  const encryptedBuffer = new Uint8Array(encryptedContent)
  const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.length)
  combinedBuffer.set(iv)
  combinedBuffer.set(encryptedBuffer, iv.length)
  
  // Convert to Base64
  return btoa(String.fromCharCode.apply(null, Array.from(combinedBuffer)))
}

export async function decryptData(encryptedBase64: string, password: string): Promise<string> {
  const key = await deriveKey(password)
  const combinedBuffer = new Uint8Array(
    atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
  )
  
  const iv = combinedBuffer.slice(0, 12)
  const encryptedContent = combinedBuffer.slice(12)
  
  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedContent
  )
  
  const dec = new TextDecoder()
  return dec.decode(decryptedContent)
}

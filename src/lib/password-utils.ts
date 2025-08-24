/**
 * Password hashing utility functions for secure admin authentication
 * Uses browser-compatible Web Crypto API
 */

export interface PasswordHashResult {
  hash: string
  salt: string
}

/**
 * Generate a secure random salt using browser crypto
 */
export const generateSalt = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Convert string to Uint8Array
 */
const stringToUint8Array = (str: string): Uint8Array => {
  return new TextEncoder().encode(str)
}

/**
 * Convert Uint8Array to hex string
 */
const uint8ArrayToHex = (array: Uint8Array): string => {
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash a password with a salt using browser-compatible PBKDF2
 */
export const hashPassword = async (password: string, salt?: string): Promise<PasswordHashResult> => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }

  const saltToUse = salt || generateSalt()
  const iterations = 100000
  const keyLength = 64

  try {
    // Import the password as a key
    const passwordBuffer = stringToUint8Array(password)
    const saltBuffer = stringToUint8Array(saltToUse)

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    )

    // Derive the key using PBKDF2
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      keyLength * 8 // Convert bytes to bits
    )

    const hashArray = new Uint8Array(derivedKey)
    const hash = uint8ArrayToHex(hashArray)

    return {
      hash: `${iterations}:SHA-256:${hash}`,
      salt: saltToUse
    }
  } catch (error) {
    console.error('Password hashing error:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify a password against a stored hash using browser crypto
 */
export const verifyPassword = async (password: string, storedHash: string, salt: string): Promise<boolean> => {
  try {
    if (!password || !storedHash || !salt) {
      return false
    }

    const [iterations, digest, hash] = storedHash.split(':')
    
    if (!iterations || !digest || !hash) {
      return false
    }

    // Hash the provided password with the same parameters
    const passwordBuffer = stringToUint8Array(password)
    const saltBuffer = stringToUint8Array(salt)

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    )

    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: parseInt(iterations),
        hash: digest
      },
      keyMaterial,
      hash.length * 4 // hex string is 2 chars per byte
    )

    const verifyHash = uint8ArrayToHex(new Uint8Array(derivedKey))
    return hash === verifyHash
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!password) {
    errors.push('Password is required')
    return { valid: false, errors }
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Generate a secure random password using browser crypto
 */
export const generateSecurePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const allChars = uppercase + lowercase + numbers + symbols

  let password = ''
  
  // Generate random values using browser crypto
  const randomArray = new Uint8Array(length)
  crypto.getRandomValues(randomArray)
  
  // Ensure at least one character from each category
  const categoryRandoms = new Uint8Array(4)
  crypto.getRandomValues(categoryRandoms)
  
  password += uppercase[categoryRandoms[0] % uppercase.length]
  password += lowercase[categoryRandoms[1] % lowercase.length]
  password += numbers[categoryRandoms[2] % numbers.length]
  password += symbols[categoryRandoms[3] % symbols.length]

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[randomArray[i] % allChars.length]
  }

  // Shuffle the password using Fisher-Yates algorithm with crypto random
  const passwordArray = password.split('')
  const shuffleRandoms = new Uint8Array(passwordArray.length)
  crypto.getRandomValues(shuffleRandoms)
  
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = shuffleRandoms[i] % (i + 1)
    ;[passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]]
  }

  return passwordArray.join('')
}

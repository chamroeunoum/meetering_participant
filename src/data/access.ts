export const portalAccessCodes = [
  'Q2S-2026-001',
  'OCM-2026',
  'MEET-607A',
  'VIP-708',
  'GUEST-001',
]

export function isValidPortalCode(code: string): boolean {
  return portalAccessCodes.includes(code.trim().toUpperCase())
}

/** Simulated: send a 6-digit OTP to phone/email. Returns the OTP. */
export function sendOtp(contact: string): string {
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  console.log(`[OTP] Sent to ${contact}: ${otp}`)
  return otp
}

/** Validate a 6-digit OTP */
export function isValidOtp(input: string, expected: string): boolean {
  return input.trim() === expected
}

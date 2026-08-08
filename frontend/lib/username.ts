export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,50}$/

export function isValidUsername(username: string) {
  return USERNAME_PATTERN.test(username)
}

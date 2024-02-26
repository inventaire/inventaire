import { checkEmailAvailability, checkUsernameAvailability } from '#controllers/user/lib/availability'

export const usernameAvailability = {
  sanitization: { username: {} },
  controller: async ({ username }) => {
    // Checks for validity, availability, reserved words
    await checkUsernameAvailability(username)
    return { username, status: 'available' }
  },
}

export const emailAvailability = {
  sanitization: { email: {} },
  controller: async ({ email }) => {
    // Checks for validity, availability
    await checkEmailAvailability(email)
    return { email, status: 'available' }
  },
}

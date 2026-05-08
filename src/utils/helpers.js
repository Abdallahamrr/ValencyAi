export const generateInviteCode = () => {
  // Generates a random 6-character alphanumeric string
  // We use .toUpperCase() to make it easier to read
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};
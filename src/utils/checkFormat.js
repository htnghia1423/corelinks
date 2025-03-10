/**
 * Validates the date format (YYYY-MM-DD)
 * @param {string} date - The date string to validate
 * @returns {boolean} - True if the date is valid, false otherwise
 */
function isValidDate(date) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
}

/**
 * Validates the time format (HH:MM)
 * @param {string} time - The time string to validate
 * @returns {boolean} - True if the time is valid, false otherwise
 */
function isValidTime(time) {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

module.exports = {
  isValidDate,
  isValidTime,
};

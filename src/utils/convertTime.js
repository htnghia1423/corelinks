const moment = require("moment-timezone");

function convertToTimezone(date, timezone) {
  return moment(date).tz(timezone).format("MMMM Do YYYY, h:mm:ss a");
}

function convertToPlus7(date) {
  return convertToTimezone(date, "Asia/Ho_Chi_Minh");
}

function convertToUTC(date) {
  return convertToTimezone(date, "UTC");
}

module.exports = {
  convertToTimezone,
  convertToPlus7,
  convertToUTC,
};

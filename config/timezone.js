import moment from "moment-timezone";

// Set default timezone to IST for the entire application
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

// Utility functions for consistent timezone handling
export const getISTTime = () => {
  return moment().tz(DEFAULT_TIMEZONE);
};

export const convertToIST = (date) => {
  return moment(date).tz(DEFAULT_TIMEZONE);
};

export const convertFromIST = (istDateString) => {
  return moment.tz(istDateString, DEFAULT_TIMEZONE).utc().toDate();
};

export const formatForIST = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).tz(DEFAULT_TIMEZONE).format(format);
};

export const isWithinMinute = (date1, date2) => {
  const m1 = moment(date1).tz(DEFAULT_TIMEZONE);
  const m2 = moment(date2).tz(DEFAULT_TIMEZONE);
  
  return m1.isSame(m2, 'minute');
};

// Initialize timezone logging
export const logTimezoneInfo = () => {
  console.log("🌍 Timezone Configuration:");
  console.log(`Default timezone: ${DEFAULT_TIMEZONE}`);
  console.log(`System timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  console.log(`Current system time: ${new Date().toISOString()}`);
  console.log(`Current IST time: ${getISTTime().format('YYYY-MM-DD HH:mm:ss')}`);
};

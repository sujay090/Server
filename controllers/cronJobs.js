import cron from "node-cron";
import Schedule from "../models/Schedule.js";
import sendWhatsApp from "../utils/sendWhatsaap.js";
import Customer from "../models/Customer.js";
import moment from "moment-timezone";
import { DEFAULT_TIMEZONE, getISTTime, formatForIST, logTimezoneInfo } from "../config/timezone.js";

// Run every minute
cron.schedule("* * * * *", async () => {
  console.log("⏱️ Checking scheduled messages...");

  // Get current time in IST timezone regardless of server location
  const nowIST = getISTTime();
  console.log(`Current IST time: ${formatForIST(nowIST)}`);

  // Format current date and time strings in IST
  const currentDateStr = nowIST.format('YYYY-MM-DD');
  const currentTimeStr = nowIST.format('HH:mm');
  console.log(`Checking for schedules at IST date ${currentDateStr} and time ${currentTimeStr}`);
  try {
    // Fetch pending schedules and filter by matching IST date/time strings
    const pendingSchedules = await Schedule.find({ status: 'Pending' }).populate('customerId');
    const schedules = pendingSchedules.filter(sch => {
      if (!sch.date || !sch.time) return false;
      // Combine date and time strings into IST moment
      const schedMoment = moment.tz(
        `${sch.date} ${sch.time}`,
        'YYYY-MM-DD HH:mm',
        DEFAULT_TIMEZONE
      );
      // Check if within this current minute window
      return schedMoment.isBetween(
        nowIST.clone().startOf('minute'),
        nowIST.clone().endOf('minute'),
        null,
        '[]'
      );
    });
    
    console.log(`Found ${schedules.length} schedules to process`);
    
    if (schedules.length === 0) {
      console.log("No pending messages to send at this time.");
      return;
    }

  for (const schedule of schedules) {
    try {
      const customer = schedule.customerId;

      if (!customer || !customer.whatsapp) {
        console.error(`Schedule ${schedule._id}: Customer WhatsApp number not found`);
        schedule.status = "Failed";
        await schedule.save();
        continue;
      }

      const scheduleTimeIST = moment(schedule.date).tz(DEFAULT_TIMEZONE);
      console.log(`Processing schedule ${schedule._id} for ${customer.companyName} at ${formatForIST(scheduleTimeIST)} IST`);
      
      const phoneNumber = customer.whatsapp;

      // ✅ FIX: Construct the real media URL
      // const mediaUrl = `https://marketing.gs3solution.us/api/uploads/posters/6867f2cd75d28587cc3d19a7_1752719080050_68779a5d63358be1472c71c1.jpg`;
      // const mediaUrl = `https://marketing.gs3solution.us/api/uploads/posters/${schedule.posterId}.jpg`;

      // 6867f2cd75d28587cc3d19a7_1752719080050_68779a5d63358be1472c71c1
      const mediaUrl = `https://www.msgwapi.com/users/1/avatar.png`;
      await sendWhatsApp(phoneNumber, mediaUrl);

      schedule.status = "Sent";
      await schedule.save();

      console.log(`✅ Sent poster to ${phoneNumber} for customer ${customer.companyName} at ${formatForIST(scheduleTimeIST)} IST`);
    } catch (err) {
      schedule.status = "Failed";
      await schedule.save();

      console.error(`❌ Failed to send poster for schedule ${schedule._id}: ${err.message}`);
    }
  }

  } catch (err) {
    console.error("❌ Error fetching schedules:", err.message);
  }
});

// Initialize timezone logging on startup
logTimezoneInfo();
console.log("📅 Cron job initialized - Will check for scheduled messages every minute in IST timezone");

import cron from "node-cron";
import Schedule from "../models/Schedule.js";
import GeneratedPoster from "../models/GeneratedPoster.js";
import sendWhatsApp from "../utils/sendWhatsaap.js";
import moment from "moment-timezone";
import {
  DEFAULT_TIMEZONE,
  getISTTime,
  formatForIST,
  logTimezoneInfo,
} from "../config/timezone.js";

// Run every minute
cron.schedule("* * * * *", async () => {
  console.log("⏱️ Checking scheduled messages...");

  // Get current time in IST timezone regardless of server location
  const nowIST = getISTTime();
  console.log(`Current IST time: ${formatForIST(nowIST)}`);

  // Format current date and time strings in IST
  const currentDateStr = nowIST.format("YYYY-MM-DD");
  const currentTimeStr = nowIST.format("HH:mm");
  console.log(
    `Checking for schedules at IST date ${currentDateStr} and time ${currentTimeStr}`
  );
  try {
    // Fetch pending schedules and filter by matching IST date/time strings
    const pendingSchedules = await Schedule.find({
      status: "Pending",
    }).populate("customerId");
    const schedules = pendingSchedules.filter((sch) => {
      if (!sch.date || !sch.time) return false;
      // Combine date and time strings into IST moment
      const schedMoment = moment.tz(
        `${sch.date} ${sch.time}`,
        "YYYY-MM-DD HH:mm",
        DEFAULT_TIMEZONE
      );
      // Check if within this current minute window
      return schedMoment.isBetween(
        nowIST.clone().startOf("minute"),
        nowIST.clone().endOf("minute"),
        null,
        "[]"
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
          console.error(
            `Schedule ${schedule._id}: Customer WhatsApp number not found`
          );
          schedule.status = "Failed";
          await schedule.save();
          continue;
        }

        console.log(
          `Processing schedule ${schedule._id} for ${customer.companyName}`
        );

        const phoneNumber = customer.whatsapp;

        // Find generated poster
        const genaratePoster = await GeneratedPoster.findById(schedule.posterId);
        
        if (!genaratePoster) {
          console.error(`Schedule ${schedule._id}: Generated poster not found`);
          schedule.status = "Failed";
          await schedule.save();
          continue;
        }

        // Use the actual generated poster URL
        const baseUrl = process.env.SERVER_URL || process.env.BASE_URL || "https://marketing.gs3solution.us";
        const mediaUrl = `${baseUrl}/${genaratePoster.generatedImagePath}`;
        
        console.log(`📸 Sending poster: ${mediaUrl}`);
        
        await sendWhatsApp(phoneNumber, mediaUrl);

        schedule.status = "Sent";
        await schedule.save();

        console.log(
          `✅ Sent poster to ${phoneNumber} for customer ${customer.companyName}`
        );
      } catch (err) {
        schedule.status = "Failed";
        await schedule.save();

        console.error(
          `❌ Failed to send poster for schedule ${schedule._id}: ${err.message}`
        );
      }
    }
  } catch (err) {
    console.error("❌ Error fetching schedules:", err.message);
  }
});

// Initialize timezone logging on startup
logTimezoneInfo();
console.log(
  "📅 Cron job initialized - Will check for scheduled messages every minute in IST timezone"
);

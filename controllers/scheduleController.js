import Schedule from "../models/Schedule.js";
import nodeSchedule from "node-schedule";
import axios from "axios";
import dotenv from "dotenv";
import moment from "moment-timezone";
import { DEFAULT_TIMEZONE, convertToIST, formatForIST } from "../config/timezone.js";

dotenv.config();
const postSchedule = (
  postTime,
  content = "Test",
  imageUrls = [],
  phoneNumber
) => {
  const scheduledDate = new Date(postTime);
  console.log(phoneNumber, imageUrls);
  if (isNaN(scheduledDate)) {
    console.error("Invalid date provided to postSchedule:", postTime);
    return null;
  }

  const job = nodeSchedule.scheduleJob(scheduledDate, () => {
    console.log("----- Whatsapp Schedule Start -------");
    if (phoneNumber) {
      for (const imageUrl of imageUrls) {
        axios
          .get(
            `https://www.msgwapi.com/api/whatsapp/send?receiver=${phoneNumber}&msgtext=${content}&token=${process.env.WHATSAPP_API_TOKEN}&mediaurl=${imageUrl}`
          )
          .then((res) => {
            console.log(res.data);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      console.log("Phone number not found.");
    }
    console.log("----- Whatsapp Schedule End -------");
  });

  return job;
};

export const createSchedule = async (req, res) => {
  try {
    const { customerId, schedules, customerPhoneNumber } = req.body;
    console.log("Create SS", customerPhoneNumber, schedules);
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res
        .status(400)
        .json({ message: "Schedules must be a non-empty array" });
    }

    const entries = [];

    schedules.forEach((item) => {
      const { posterId, categories, dates, selectedPosterUrls } = item;

      categories.forEach((category) => {
        dates.forEach((date) => {
          // ✅ Proper timezone handling for IST
          let parseDate;
          
          if (typeof date === 'string') {
            // If date comes as ISO string from frontend
            parseDate = new Date(date);
          } else {
            // If date comes as moment object or other format
            parseDate = moment.tz(date, DEFAULT_TIMEZONE).toDate();
          }
          
          // Ensure we have a valid date
          if (isNaN(parseDate.getTime())) {
            throw new Error(`Invalid date format: ${date}`);
          }

          // Log the date conversion for debugging
          console.log(`Original date: ${date}, Parsed date UTC: ${parseDate.toISOString()}, IST: ${formatForIST(parseDate)}`);

          // Convert parsed date to IST date and time strings
          const dateTZ = moment(parseDate).tz(DEFAULT_TIMEZONE);
          const dateStr = dateTZ.format('YYYY-MM-DD');
          const timeStr = dateTZ.format('HH:mm');
          entries.push({
            customerId,
            posterId,
            category,
            date: dateStr, // Store date string
            time: timeStr, // Store time string
          });
          

          // Schedule the job
          // postSchedule(
          //   date,
          //   `Poster ID: ${posterId} - Category: ${category}`,
          //   selectedPosterUrls,
          //   customerPhoneNumber
          // );
        });
      });
    });

    const createdSchedules = await Schedule.insertMany(entries);

    res.status(201).json({
      message: "Posters scheduled successfully",
      schedules: createdSchedules,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getScheduleByCustomer = async (req, res) => {
  try {
    const schedules = await Schedule.find({
      customerId: req.params.customerId,
    }).populate("posterId");
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate("customerId", "companyName") // ✅ Fetch customer name
      .populate("posterId", "title"); // Optional: fetch poster title

    // ✅ Add timezone information to response for frontend debugging
    const schedulesWithTimezone = schedules.map(schedule => {
      // Normalize date and time strings
      let dateUTC, timeUTC;
      if (schedule.time) {
        dateUTC = schedule.date;
        timeUTC = schedule.time;
      } else {
        const parsed = new Date(schedule.date);
        dateUTC = parsed.toISOString().split('T')[0];
        timeUTC = parsed.toISOString().split('T')[1].substr(0,5);
      }
      // Compute IST display from UTC date/time
      const dateIST = formatForIST(new Date(`${dateUTC}T${timeUTC}:00Z`));
      return {
        ...schedule.toObject(),
        dateUTC,
        timeUTC,
        dateIST
      };
    });

    console.log("All scheduled jobs:");
    console.log(Object.keys(nodeSchedule.scheduledJobs));
    console.log(`Returning ${schedulesWithTimezone.length} schedules with timezone info`);
    
    res.json(schedulesWithTimezone);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules", error });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Schedule not found" });
    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

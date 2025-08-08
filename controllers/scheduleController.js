import Schedule from "../models/Schedule.js";
import GeneratedPoster from "../models/GeneratedPoster.js";
import mongoose from "mongoose";
import nodeSchedule from "node-schedule";
import axios from "axios";
import dotenv from "dotenv";
import moment from "moment-timezone";
import { DEFAULT_TIMEZONE, convertToIST, formatForIST } from "../config/timezone.js";
import fs from 'fs';
import path from 'path';

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
    const { includePosters } = req.query;
    
    // Get base URL for images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    let query = Schedule.find().populate("customerId", "companyName phoneNumber");
    
    // If poster info is requested, populate both poster types
    if (includePosters === 'true') {
      query = query
        .populate("posterId", "title imageUrl _id")
        .populate("generatedPosterId", "generatedImagePath _id customer category originalPosterId");
    }
    
    const schedules = await query;

    // Since GeneratedPoster collection is empty, we'll work directly with files on disk
    const generatedPosterLookup = {};
    if (includePosters === 'true') {
      // Read all files from the generated directory and create lookup
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'generated');
        const files = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.png'));
        
        files.forEach(filename => {
          // Extract customer ID from filename (format: customerId_posterId.png)
          const parts = filename.replace('.png', '').split('_');
          if (parts.length >= 2) {
            const customerId = parts[0];
            const posterId = parts.slice(1).join('_'); // In case there are multiple underscores
            
            // For now, we'll assume all are 'offers' category since we don't have DB data
            // This could be enhanced by parsing the filename or checking file metadata
            const key = `${customerId}_offers`;
            if (!generatedPosterLookup[key]) {
              generatedPosterLookup[key] = [];
            }
            generatedPosterLookup[key].push({
              _id: posterId, // Use the posterId part as _id
              generatedImagePath: filename,
              category: 'offers',
              filename: filename
            });
          }
        });
        
        console.log('File-based Generated Poster Lookup created for files:', files.length);
        console.log('Lookup keys:', Object.keys(generatedPosterLookup));
      } catch (error) {
        console.error('Error reading generated files directory:', error);
      }
    }

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
      
      const result = {
        ...schedule.toObject(),
        dateUTC,
        timeUTC,
        dateIST
      };
      
      // Add poster info if available (try multiple approaches)
      if (schedule.generatedPosterId) {
        result.poster = {
          _id: schedule.generatedPosterId._id,
          imageUrl: `${baseUrl}/uploads/generated/${schedule.generatedPosterId.generatedImagePath.split('/').pop()}`,
          type: 'generated'
        };
        console.log(`Found generatedPosterId for schedule ${schedule._id}:`, result.poster);
      } else if (schedule.posterId) {
        result.poster = {
          _id: schedule.posterId._id,
          imageUrl: schedule.posterId.imageUrl.startsWith('http') ? schedule.posterId.imageUrl : `${baseUrl}${schedule.posterId.imageUrl}`,
          title: schedule.posterId.title,
          type: 'original'
        };
        console.log(`Found posterId for schedule ${schedule._id}:`, result.poster);
      } else {
        // Try to find matching generated poster by customer and category
        const lookupKey = `${schedule.customerId._id}_${schedule.category.toLowerCase()}`;
        const matchingPosters = generatedPosterLookup[lookupKey];
        console.log(`Looking for poster with key: ${lookupKey}, found:`, matchingPosters ? matchingPosters.length : 0);
        
        if (matchingPosters && matchingPosters.length > 0) {
          const poster = matchingPosters[0]; // Use the first matching poster
          const filename = poster.filename;
          
          result.poster = {
            _id: poster._id,
            imageUrl: `${baseUrl}/uploads/generated/${filename}`,
            type: 'generated',
            category: poster.category
          };
          console.log(`File-based matched poster for schedule ${schedule._id}, using filename: ${filename}`);
        } else {
          console.log(`No poster file found for schedule ${schedule._id} (customer: ${schedule.customerId?.companyName}, category: ${schedule.category})`);
        }
      }
      
      return result;
    });

    console.log("All scheduled jobs:");
    console.log(Object.keys(nodeSchedule.scheduledJobs));
    console.log(`Returning ${schedulesWithTimezone.length} schedules with timezone info`);
    
    // Debug logging for posters
    console.log("Poster info debug:", schedulesWithTimezone.map(s => ({
      scheduleId: s._id,
      customer: s.customerId?.companyName,
      category: s.category,
      posterId: s.posterId,
      generatedPosterId: s.generatedPosterId,
      poster: s.poster
    })));
    
    res.json(schedulesWithTimezone);
  } catch (error) {
    console.error("Error in getAllSchedules:", error);
    res.status(500).json({ message: "Error fetching schedules", error: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the existing schedule
    const existingSchedule = await Schedule.findById(id);
    if (!existingSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Update the schedule
    const updatedSchedule = await Schedule.findByIdAndUpdate(id, updateData, { 
      new: true 
    }).populate("customerId", "companyName phoneNumber").populate("posterId", "title imageUrl _id");

    // Cancel existing scheduled job if it exists
    const jobKey = `schedule-${id}`;
    if (nodeSchedule.scheduledJobs[jobKey]) {
      nodeSchedule.scheduledJobs[jobKey].cancel();
      delete nodeSchedule.scheduledJobs[jobKey];
    }

    // Reschedule with updated time if the schedule is in the future
    const scheduleDate = new Date(`${updatedSchedule.date}T${updatedSchedule.time}:00`);
    if (scheduleDate > new Date()) {
      const customerPhoneNumber = updatedSchedule.customerId?.phoneNumber;
      const posterImageUrl = updatedSchedule.posterId?.imageUrl;
      
      if (customerPhoneNumber && posterImageUrl) {
        postSchedule(
          scheduleDate,
          `Scheduled post for ${updatedSchedule.customerId.companyName}`,
          [posterImageUrl],
          customerPhoneNumber
        );
      }
    }

    res.json({ 
      message: "Schedule updated successfully", 
      schedule: updatedSchedule 
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({ message: "Error updating schedule", error: error.message });
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

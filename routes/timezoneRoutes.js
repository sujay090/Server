import express from "express";
import { getISTTime, formatForIST, DEFAULT_TIMEZONE } from "../config/timezone.js";

const router = express.Router();

// GET /api/timezone/info - Get current timezone information
router.get("/info", (req, res) => {
  try {
    const currentTime = new Date();
    const istTime = getISTTime();
    
    res.json({
      success: true,
      timezone: {
        server: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          time: currentTime.toISOString(),
          localTime: currentTime.toString()
        },
        ist: {
          timezone: DEFAULT_TIMEZONE,
          time: istTime.toISOString(),
          formatted: formatForIST(istTime),
          offset: istTime.format('Z')
        },
        utc: {
          time: new Date().toISOString(),
          timestamp: Date.now()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting timezone info",
      error: error.message
    });
  }
});

// POST /api/timezone/test - Test date conversion
router.post("/test", (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required"
      });
    }
    
    const inputDate = new Date(date);
    const istTime = getISTTime();
    
    res.json({
      success: true,
      conversion: {
        input: {
          original: date,
          parsed: inputDate.toISOString(),
          isValid: !isNaN(inputDate.getTime())
        },
        ist: {
          formatted: formatForIST(inputDate),
          iso: inputDate.toISOString(),
          timestamp: inputDate.getTime()
        },
        current: {
          server: new Date().toISOString(),
          ist: formatForIST(istTime)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error testing date conversion",
      error: error.message
    });
  }
});

export default router;

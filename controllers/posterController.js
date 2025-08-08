import fs from "fs";
import path from "path";
import sharp from "sharp";
import Poster from "../models/Poster.js";
import GeneratedPoster from "../models/GeneratedPoster.js";
import Customer from "../models/Customer.js";

// Utility to ensure directory exists
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 1. Upload poster with placeholders
export const uploadPoster = async (req, res) => {
  try {
    const { category, placeholders } = req.body;
    if (!category || !req.file) {
      return res
        .status(400)
        .json({ message: "Missing category or image file" });
    }

    // Parse placeholders JSON string to array, fallback to empty array
    const parsedPlaceholders = JSON.parse(placeholders || "[]");
    const posterImagePath = req.file.path;

    // Get image metadata for width & height
    const imageMeta = await sharp(posterImagePath).metadata();

    // Create SVG overlay with all placeholders in their positions/styles
    const svgOverlay = `
      <svg width="${imageMeta.width}" height="${
      imageMeta.height
    }" xmlns="http://www.w3.org/2000/svg">
        ${parsedPlaceholders
          .map((ph) => {
            const style = ph.style || {};
            const fontFamily = style.fontFamily || "Arial";
            const fontSize = parseInt(style.fontSize) || 24;
            const color = style.color || "#000000";
            const fontWeight = style.fontWeight || "normal";

            // Escape text content for safety (basic)
            const text = String(ph.text || "")
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");

            return `<text x="${ph.x}" y="${
              ph.y
            }" font-family="${fontFamily}" font-size="${fontSize}" fill="${color}" font-weight="${fontWeight}">${""}</text>`;
          })
          .join("")}
      </svg>
    `;

    // Composite original image with SVG overlay
    const finalImageBuffer = await sharp(posterImagePath)
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .toBuffer();

    // Ensure processed folder exists
    const outputFolder = path.join("uploads", "processed");
    ensureDirExists(outputFolder);

    const outputFilePath = path.join(outputFolder, `${Date.now()}-final.png`);

    // Save final composited image
    await sharp(finalImageBuffer).toFile(outputFilePath);

    // Save poster record in DB
    const poster = await Poster.create({
      category,
      originalImagePath: posterImagePath,
      finalImagePath: outputFilePath,
      placeholders: parsedPlaceholders,
    });

    res.status(201).json({ message: "Poster uploaded and processed", poster });
  } catch (error) {
    console.error("Upload poster error:", error);
    res
      .status(500)
      .json({ message: "Server error during upload", error: error.message });
  }
};

// 2. Generate posters for customer by category replacing placeholders with customer data
export const generatePostersForCustomerByCategory = async (req, res) => {
  try {
    const { category, customerId, posterId } = req.body;
    if (!category || !customerId) {
      return res
        .status(400)
        .json({ message: "Missing category or customerId" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Use posterId to filter if provided, otherwise get all posters in category
    const query = { category };
    if (posterId) {
      query._id = posterId;
    }
    
    const posters = await Poster.find(query).sort({ createdAt: -1 });
    if (!posters.length) {
      return res
        .status(404)
        .json({ message: posterId ? "Poster not found" : "No posters found for this category" });
    }

    const outputFolder = path.join("uploads", "generated");
    ensureDirExists(outputFolder);

    const generatedPosters = [];

    for (const poster of posters) {
      try {
        if (
          !poster.originalImagePath ||
          !fs.existsSync(poster.originalImagePath)
        ) {
          console.error(`Original image missing: ${poster.originalImagePath}`);
          continue;
        }
        if (!Array.isArray(poster.placeholders)) {
          console.error(`Invalid placeholders for poster ID: ${poster._id}`);
          continue;
        }

        const imageMeta = await sharp(poster.originalImagePath).metadata();

        // Dynamic placeholder replacement mapping
        const placeholderMap = {
          "{companyname}": customer.companyName || "",
          "{whatsapp}": customer.whatsapp || "",
          "{website}": customer.website || "",
          "{logourl}": customer.logoUrl || "",
          "{name}": customer.name || "",
          "{email}": customer.email || "",
          "{phone}": customer.phone || "",
        };
        
        // Build SVG overlay
        const svgOverlay = `
          <svg width="${imageMeta.width}" height="${
          imageMeta.height
        }" xmlns="http://www.w3.org/2000/svg">
            ${poster.placeholders
              .map((ph) => {
                let text = ph.text || "";
                console.log(ph);
                // 👇 Normalize and replace placeholder
                const lowerText = text.toLowerCase();
                if (placeholderMap[lowerText]) {
                  text = placeholderMap[lowerText];
                }

                const style = ph.style || {};
                const fontFamily = style.fontFamily || "Arial";
                const fontSize = parseInt(style.fontSize) || 24;
                const color = style.color || "#000000";
                const fontWeight = style.fontWeight || "normal";
                const fontStyle = style.fontStyle || "normal";
                const safeText = String(text)
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;");
                return `<text x="${ph.x}" y="${ph.y}" font-family="${fontFamily}" font-size="${fontSize}" fill="${color}" font-weight="${fontWeight}" font-style="${fontStyle}">${safeText}</text>`;
              })
              .join("")}
          </svg>
        `;

        const fileName = `${customer._id}_${poster._id}.png`;
        const outputPath = path.join(outputFolder, fileName);

        // 📸 Composite image
        await sharp(poster.originalImagePath)
          .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
          .png()
          .toFile(outputPath);

        // 💾 Save in DB
        const saved = await GeneratedPoster.create({
          customer: customer._id,
          category,
          originalPosterId: poster._id,
          generatedImagePath: `uploads/generated/${fileName}`,
        });

        generatedPosters.push({
          _id: saved._id,
          imageUrl: `https://marketing.gs3solution.us/uploads/generated/${fileName}`,
          // "https://marketing.gs3solution.us"
        });
      } catch (innerErr) {
        console.error(
          `Failed generating poster ${poster._id}:`,
          innerErr.message
        );
      }
    }

    res.json({ customerId: customer._id, category, posters: generatedPosters });
  } catch (error) {
    console.error("Poster generation error:", error);
    res.status(500).json({ message: "Generate failed", error: error.message });
  }
};

// 3. Download generated poster by ID
export const downloadPoster = async (req, res) => {
  try {
    const poster = await GeneratedPoster.findById(req.params.id);
    if (!poster) return res.status(404).send("Poster not found");

    const filePath = path.join(process.cwd(), poster.generatedImagePath);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

    res.download(filePath);
  } catch (error) {
    console.error("Download poster error:", error);
    res.status(500).json({ error: "Download failed" });
  }
};

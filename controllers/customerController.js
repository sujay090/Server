import Customer from "../models/Customer.js";
import fs from "fs";
import path from "path";

const serverURL = process.env.SERVER_URL || "http://localhost:5000";

export const addCustomer = async (req, res) => {
  try {
    const { companyName, whatsapp, website } = req.body;
    const logoUrl = req.file
      ? `${serverURL}/uploads/${req.file.filename}`
      : null;

    const newCustomer = new Customer({
      companyName,
      whatsapp,
      website,
      logoUrl,
    });
    await newCustomer.save();

    res.status(201).json(newCustomer);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add customer", error: error.message });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch customers", error: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    if (customer.logoUrl) {
      const filename = customer.logoUrl.split("/uploads/")[1];
      const filePath = path.join("uploads", filename);
      fs.unlink(filePath, (err) => {
        if (err) console.warn("Logo delete error:", err.message);
      });
    }

    await customer.deleteOne();
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete customer", error: error.message });
  }
};

export const editCustomer = async (req, res) => {
  try {
    const { companyName, whatsapp, website } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    if (req.file && customer.logoUrl) {
      const oldFile = customer.logoUrl.split("/uploads/")[1];
      const filePath = path.join("uploads", oldFile);
      fs.unlink(filePath, (err) => {
        if (err) console.warn("Old logo delete failed:", err.message);
      });
    }

    customer.companyName = companyName;
    customer.whatsapp = whatsapp;
    customer.website = website;
    if (req.file)
      customer.logoUrl = `${serverURL}/uploads/${req.file.filename}`;

    await customer.save();
    res.json(customer);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update customer", error: error.message });
  }
};

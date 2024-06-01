const express = require("express");
const axios = require("axios");
const redisClient = require("../redisClint");
const Alert = require("../models/Alert");
require("dotenv").config();

const Router = express.Router();

// Fetch Bitcoin price from DIA Data API
const fetchBitcoinPrice = async () => {
  try {
    const { data } = await axios.get(
      `${process.env.DIADATA_API_URL}/Bitcoin/0x0000000000000000000000000000000000000000` //https://api.diadata.org/v1/quotedAssets
    );
    return data.Price;
  } catch (error) {
    console.error("Error fetching Bitcoin price:", error);
    return null;
  }
};

// Update Bitcoin price in Redis cache
const updatePrices = async () => {
  const price = await fetchBitcoinPrice();
  if (price !== null) {
    try {
      await redisClient.setEx("bitcoinPrice", 60, price.toString());
      console.log("Bitcoin price updated:", price);
    } catch (error) {
      console.error("Error setting price in Redis:", error);
    }
  }
};

// Check alerts against current Bitcoin price
const checkAlerts = async () => {
  redisClient.get("bitcoinPrice", async (err, reply) => {
    if (err) {
      console.error("Error fetching from Redis:", err);
      return;
    }
    if (!reply) {
      console.log("No Bitcoin price in Redis.");
      return;
    }
    const currentPrice = parseFloat(reply);
    console.log("Current Bitcoin price:", currentPrice);

    try {
      const alerts = await Alert.find({ notified: false });
      console.log("Fetched alerts from MongoDB:", alerts.length);

      for (const alert of alerts) {
        if (
          (alert.direction === "above" && currentPrice > alert.targetPrice) ||
          (alert.direction === "below" && currentPrice < alert.targetPrice)
        ) {
          console.log(
            `Alert triggered: Bitcoin is ${alert.direction} ${alert.targetPrice}`
          );
          alert.notified = true;
          await alert.save();
          console.log("Alert updated in MongoDB:", alert);
        }
      }
    } catch (error) {
      console.error("Error checking alerts:", error);
    }
  });
};

// Periodically update prices and check alerts
setInterval(async () => {
  try {
    await updatePrices();
    await checkAlerts();
  } catch (error) {
    console.error("Error in interval function:", error);
  }
}, 60000);

// Create a new alert
Router.post("/alert", async (req, res) => {
  const { userId, targetPrice, direction } = req.body;
  const newAlert = new Alert({ userId, targetPrice, direction });
  try {
    await newAlert.save();
    res.send("Alert created");
  } catch (error) {
    console.error("Error creating alert:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Get all alerts
Router.get("/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = Router;

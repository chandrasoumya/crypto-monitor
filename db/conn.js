const mongoose = require("mongoose");
require("dotenv").config();

// Connecting to the database
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database is connected to " + process.env.MONGO_URI);
  })
  .catch((err) => {
    console.error("Database connection error: ", err);
  });

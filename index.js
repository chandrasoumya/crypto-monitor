const express = require("express");
const app = express();
const cors = require("cors");
const Router = require("./db/routers/Router");
const dotenv = require("dotenv");

dotenv.config();

const port = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());

// database connection
require("./db/conn");

app.use(Router);

app.listen(port, () => {
  console.log("Server is live on " + port);
});

const dotenv = require("dotenv");
const connectDB = require("./db");
const { app } = require("./app");

const environment = process.env.NODE_ENV || "development";

dotenv.config({
  path: environment === "production" ? ".env.production" : ".env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`❤ Server running on PORT :- ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("❌ Could not connect to MongoDB", error);
  });

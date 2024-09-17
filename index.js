const dotenv = require("dotenv");
const connectDB = require("./db");
const { app } = require("./app");

dotenv.config({});

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`❤ Server running on PORT :- ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("❌ Could not connect to MongoDB", error);
  });

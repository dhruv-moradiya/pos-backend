const fs = require("fs");
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config({});

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
// app.use(require("./middlewares/log.middleware").logRequest);

app.get("/", (req, res) => {
  res.send("Welcome to the POS Backend!");
});

const AdminRouter = require("./routes/admin.route");
const UserRouter = require("./routes/user.route");
const TableRouter = require("./routes/table.route");
const DishRouter = require("./routes/dish.route");
const OrderRouter = require("./routes/order.route");

app.use("/api/v1/admin", AdminRouter);
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/table", TableRouter);
app.use("/api/v1/dish", DishRouter);
app.use("/api/v1/order", OrderRouter);

module.exports = { app };

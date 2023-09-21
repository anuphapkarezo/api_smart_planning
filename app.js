const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const compression = require("compression"); // นำเข้า compression

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const smart_machine_connect_list = require("./routes/10.17.66.122/iot/smart/SmartFactoryLinkPage/smart_machine_connect_list");
const smart_overall_require_08003809 = require("./routes/10.17.66.122/iot/smart/SMARTFactoryOverrallRequiments/smart_overall_require_08003809");
const smart_overall_require_08003809_action = require("./routes/10.17.66.122/iot/smart/SMARTFactoryOverrallRequiments/smart_overall_require_08003809_action");
const smart_man_working_status = require("./routes/10.17.66.122/iot/smart/SmartFactoryManWorking/smart_man_working_status");
const smart_man_master_process = require("./routes/10.17.66.121/iot/smart/SmartFacManWorkingInput/smart_man_master_process");
const smart_man_working_input = require("./routes/10.17.66.121/iot/smart/SmartFacManWorkingInput/smart_man_working_input");
const fpc_holdingtime_ab = require("./routes/10.17.66.230/iot/public/Holding time/fpc_holdingtime_ab");
const foxsystem_daily_report = require("./routes/10.17.66.122/iot/fox/foxsystem_daily_report");

const app = express();

// app.use(compression()); // ใช้งาน compression middleware
app.use(cors());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/smart_machine_connect_list", smart_machine_connect_list);
app.use("/api/smart_overall_require", smart_overall_require_08003809);
app.use(
  "/api/smart_overall_require_08003809_action",
  smart_overall_require_08003809_action
);
app.use("/api/smart_man_working_status", smart_man_working_status);
app.use("/api/smart_man_master_process", smart_man_master_process);
app.use("/api/smart_man_working_input", smart_man_working_input);
app.use("/api/fpc_holdingtime_ab", fpc_holdingtime_ab);
app.use("/api/foxsystem_daily_report", foxsystem_daily_report);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

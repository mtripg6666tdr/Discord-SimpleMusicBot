// @ts-check
require("dotenv").config();
const { Routes } = require("discord-api-types/v9");
require("./register")(Routes.applicationCommands(process.env.CLIENT_ID));
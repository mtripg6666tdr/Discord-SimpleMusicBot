// @ts-check
require("dotenv").config();
const { Routes } = require("discord-api-types/v9");
require("./delete")(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID));
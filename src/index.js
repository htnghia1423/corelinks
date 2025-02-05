const { CommandKit } = require("commandkit");
const { Client } = require("discord.js");
const { default: mongoose } = require("mongoose");
const path = require("path");

require("dotenv/config");

const client = new Client({
  intents: [
    "Guilds",
    "GuildMembers",
    "GuildMessages",
    "MessageContent",
    "GuildPresences",
  ],
});

(async () => {
  try {
    mongoose.set("strictQuery", false);
    mongoose.connect(process.env.MONGODB_URL);

    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB: ", error);
  }

  new CommandKit({
    client,
    commandsPath: path.join(__dirname, "commands"),
    eventsPath: path.join(__dirname, "events"),
    validationsPath: path.join(__dirname, "validations"),
    devGuildIds: [process.env.GUILD_ID],
    devUserIds: process.env.DEVS_ID.split(","),
  });

  await client.login(process.env.BOT_TOKEN);
})();

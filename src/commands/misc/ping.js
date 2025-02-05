const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  run: async ({ interaction, client, handler }) => {
    await interaction.reply("Pong!");
  },

  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),

  options: {
    devOnly: true,
    //deleted: true,
  },
};

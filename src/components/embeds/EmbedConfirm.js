const { EmbedBuilder } = require("discord.js");

module.exports = (title, description, footerContent) => {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor("Random")
    .setTimestamp(new Date())
    .setFooter({ text: footerContent });
};

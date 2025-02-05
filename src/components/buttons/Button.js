const { ButtonBuilder } = require("discord.js");

module.exports = (customId, label, style, emoji) => {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setEmoji(emoji);
};

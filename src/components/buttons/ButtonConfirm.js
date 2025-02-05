const { ButtonBuilder, ButtonStyle } = require("discord.js");
const Button = require("./Button");

const ButtonsConfirmDelete = [
  Button("confirm", "Confirm", ButtonStyle.Danger, "🗑️"),
  Button("cancel", "Cancel", ButtonStyle.Secondary, "❌"),
];

const ButtonsConfirmCreate = [
  Button("create", "Create", ButtonStyle.Success, "🆕"),
  Button("cancel", "Cancel", ButtonStyle.Secondary, "❌"),
];

module.exports = {
  ButtonsConfirmDelete,
  ButtonsConfirmCreate,
};

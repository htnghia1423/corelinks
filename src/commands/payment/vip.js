const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
} = require("discord.js");
const checkAndCreateUser = require("../../utils/checkAndCreateUser");
const User = require("../../models/User");
const createPayment = require("../../services/createPayment");

// Data for the command
const data = new SlashCommandBuilder()
  .setName("vip")
  .setDescription("VIP Payment");

// Function to run the command
/**
 *
 * @param {Object} param0
 * @param {ChatInputCommandInteraction} param0.interaction
 * @param {Client} param0.client
 *
 */
async function run({ interaction, client, handler }) {
  await checkAndCreateUser(interaction);

  const userId = interaction.user.id;
  const user = await User.findOne({ userId: userId });

  if (user.userType === "premium") {
    return interaction.reply({
      content: "You are already a premium user",
      ephemeral: true,
    });
  }

  interaction.deferReply();

  const paymentLink = (await createPayment(userId)).paymentUrl;

  interaction.editReply({
    content: `Click [here](${paymentLink}) to pay for VIP`,
  });
}

module.exports = {
  data,

  run,

  options: {
    // Option for delete command
    // deleted: true,
  },
};

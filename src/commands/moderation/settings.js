const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} = require("discord.js");
const ms = require("ms");
const OverdueNoti = require("../../models/OverdueNoti");

const data = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("Settings for the server")
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("notification")
      .setDescription("Notification settings")

      // Notification for due date setting command
      .addSubcommand((subcommand) =>
        subcommand
          .setName("overdue")
          .setDescription("Set the notification for overdue tasks")
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription(
                "The channel you want to set as notification channel"
              )
              .setRequired(true)
          )
      )
  );

/**
 *
 * @param {Object} param0
 * @param {ChatInputCommandInteraction} param0.interaction
 */
async function run({ interaction, client, handler }) {
  if (!interaction.inGuild()) {
    return interaction.reply("This command can only be used in a server.");
  }

  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  if (subcommandGroup) {
    switch (subcommandGroup) {
      case "notification":
        switch (subcommand) {
          case "overdue":
            await handleOverdueNotiFication(interaction);
            break;
        }
        break;
    }
  } else {
    switch (subcommand) {
    }
  }
}

module.exports = {
  data,

  run,

  options: {
    // Option for delete command
    // deleted: true,
  },
};

// Function to handle due date notification
async function handleOverdueNotiFication(interaction) {
  const channel = interaction.options.getChannel("channel");

  if (!channel) {
    interaction.reply("Please provide a channel");
  }

  // Save the notification to database
  const notification = new OverdueNoti({
    guildId: interaction.guild.id,
    channelId: channel.id,
  });

  await notification.save();

  interaction.reply(
    `Notification channel has been set to <#${channel.id}>. I will notify you when a task is overdue.`
  );
}

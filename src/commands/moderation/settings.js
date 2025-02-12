const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  ActionRowBuilder,
} = require("discord.js");
const ms = require("ms");
const OverdueNoti = require("../../models/OverdueNoti");
const Project = require("../../models/Project");
const EmbedConfirm = require("../../components/embeds/EmbedConfirm");
const {
  ButtonsConfirmDelete,
} = require("../../components/buttons/ButtonConfirm");

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
          .addStringOption((option) =>
            option
              .setName("project")
              .setDescription("The project you want to set the notification")
              .setRequired(true)
              .setAutocomplete(true)
          )
      )

      // Remove due date notification setting command
      .addSubcommand((subcommand) =>
        subcommand
          .setName("remove")
          .setDescription("Remove the notification for overdue tasks")
          .addStringOption((option) =>
            option
              .setName("project")
              .setDescription("The project you want to remove the notification")
              .setRequired(true)
              .setAutocomplete(true)
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
      // Notification setting commands
      case "notification":
        switch (subcommand) {
          // Due date notification setting command
          case "overdue":
            await handleOverdueNotiFication(interaction);
            break;

          // Remove due date notification setting command
          case "remove":
            await handleRemoveOverdueNotiFication(interaction);
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

  if (channel.type !== ChannelType.GuildText) {
    interaction.reply("Please provide a text channel");
  }

  const projectId = interaction.options.getString("project");

  const project = await Project.findOne({
    _id: projectId,
  });

  if (!project) {
    interaction.reply("Please choose a project");
  }

  // Check if the notification already exists
  const existingNotification = await OverdueNoti.findOne({
    projectId: projectId,
  });

  if (existingNotification) {
    interaction.reply(
      `Notification channel for project **${project.name}** is already set to <#${channel.id}>. Please remove the existing notification first by using \`/settings notification remove\``
    );
  }

  // Save the notification to database
  const notification = new OverdueNoti({
    guildId: interaction.guild.id,
    channelId: channel.id,
    projectId: projectId,
  });

  await notification.save();

  interaction.reply(
    `Notification channel for project **${project.name}** has been set to <#${channel.id}>. I will notify you when a task is overdue.`
  );
}

// Function to remove due date notification
async function handleRemoveOverdueNotiFication(interaction) {
  const projectId = interaction.options.getString("project");

  const project = await Project.findOne({
    _id: projectId,
  });

  if (!project) {
    interaction.reply("Please choose a project");
  }

  const notification = await OverdueNoti.findOne({
    projectId: projectId,
  });

  if (!notification) {
    interaction.reply(
      `Notification for project **${project.name}** is not set. Please set the notification first by using \`/settings notification overdue\``
    );
  }

  const embed = EmbedConfirm(
    "Remove Notification",
    `Are you sure you want to remove the notification for project **${project.name}**?`,
    "You have 60 seconds to confirm."
  );

  const buttonsConfirm = ButtonsConfirmDelete;

  const actionRow = new ActionRowBuilder().addComponents(buttonsConfirm);

  await interaction.deferReply();

  const reply = await interaction.editReply({
    embeds: [embed],
    components: [actionRow],
  });

  const collector = reply.createMessageComponentCollector({
    filter: (i) => i.user.id === interaction.user.id,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "confirm") {
      await notification.deleteOne();

      i.update({
        content: `Notification for project **${project.name}** has been removed.`,
        embeds: [],
        components: [],
      });
    } else if (i.customId === "cancel") {
      i.update({
        content: "Remove notification has been cancelled.",
        embeds: [],
        components: [],
      });
    }
  });
}

const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ChannelType,
  ComponentType,
} = require("discord.js");
const Project = require("../../models/Project");
const {
  ButtonsConfirmCreate,
  ButtonsConfirmDelete,
} = require("../../components/buttons/ButtonConfirm");
const { ListChannelWrorkSpace } = require("../../components/list/ListData");
const EmbedConfirm = require("../../components/embeds/EmbedConfirm");
const checkAndCreateUser = require("../../utils/checkAndCreateUser");

//Data for the command
const data = new SlashCommandBuilder()
  .setName("workspace")
  .setDescription("Workspace configuration!")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("create")
      .setDescription("Create a workspace!")
      .addStringOption((option) =>
        option
          .setName("project")
          .setDescription("The project you want to create a workspace for")
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("delete")
      .setDescription("Delete a workspace!")
      .addStringOption((option) =>
        option
          .setName("project")
          .setDescription("The project you want to delete a workspace for")
          .setRequired(true)
          .setAutocomplete(true)
      )
  );

//Function run when the command is called
/**
 *
 * @param {Object} param0
 * @param {ChatInputCommandInteraction} param0.interaction
 * @param {Client} param0.client
 */
async function run({ interaction, client, handler }) {
  const subcommand = interaction.options.getSubcommand();

  await checkAndCreateUser(interaction);

  switch (subcommand) {
    //Create workspace command
    case "create":
      await handleCreateWorkspace(interaction);
      break;

    //Delete workspace command
    case "delete":
      await handleDeleteWorkspace(interaction);
      break;
  }
}

module.exports = {
  data,

  run,

  options: {
    //Options for the delete command
    // deleted: true,
    premiumOnly: true,
  },
};

//Function to handle create workspace for project
async function handleCreateWorkspace(interaction) {
  const projectId = interaction.options.getString("project");

  if (!projectId) {
    interaction.reply({
      content: "Please choose a project to create a workspace for.",
      ephemeral: true,
    });
  }

  const project = await Project.findOne({
    guildId: interaction.guild.id,
    _id: projectId,
  });

  await interaction.deferReply();

  if (!project) {
    interaction.editReply({
      content: `Project does not exist. Please use command \`/project list\` to see all your projects.`,
    });
    return;
  }

  if (project.workSpaceId) {
    interaction.editReply({
      content: `Workspace for project **${project.name}** already exists. Please try another project.`,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Create Workspace")
    .setColor("Random")
    .setDescription(`I will create the structure for your workspace in project **${
    project.name
  }** like this: \n
                    🔽 **${project.name
                      .toUpperCase()
                      .trim()
                      .replace(/ /g, "-")}**\n
                    **#** notification\n
                    **#** chat\n
                    **#** reports\n
                    🔈voice-meeting`);

  const buttonsComfirm = ButtonsConfirmCreate;

  const actionRow = new ActionRowBuilder().addComponents(buttonsComfirm);

  const reply = await interaction.editReply({
    embeds: [embed],
    components: [actionRow],
  });

  const collector = reply.createMessageComponentCollector({
    filter: (i) => i.user.id === interaction.user.id,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "create") {
      const categoryChannel = await i.guild.channels.create({
        name: project.name,
        type: ChannelType.GuildCategory,
      });

      const channels = ListChannelWrorkSpace;

      for (const channel of channels) {
        await categoryChannel.children.create({
          name: channel.name,
          type: channel.type,
        });
      }

      await project.updateOne({ workSpaceId: categoryChannel.id });

      await i.update({
        content: `Workspace for project **${project.name}** created successfully.`,
        embeds: [],
        components: [],
      });
    } else if (i.customId === "cancel") {
      await i.update({
        content: `Workspace creation canceled.`,
        embeds: [],
        components: [],
      });
    }
  });
}

//Function to handle delete workspace for project
async function handleDeleteWorkspace(interaction) {
  const projectId = interaction.options.getString("project");

  if (!projectId) {
    interaction.reply({
      content: "Please choose a project to delete a workspace for.",
      ephemeral: true,
    });
  }

  const project = await Project.findOne({
    guildId: interaction.guild.id,
    _id: projectId,
  });

  const embedConfirm = EmbedConfirm(
    "Delete Workspace",
    `Are you sure you want to delete the workspace for project **${project.name}**?`,
    "You have 60 seconds to confirm."
  );

  const buttonsConfirm = ButtonsConfirmDelete;

  const actionRow = new ActionRowBuilder().addComponents(buttonsConfirm);

  await interaction.deferReply();

  const reply = await interaction.editReply({
    embeds: [embedConfirm],
    components: [actionRow],
  });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === interaction.user.id,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "confirm") {
      const categoryChannel = interaction.guild.channels.cache.get(
        project.workSpaceId
      );

      if (categoryChannel) {
        for (const channel of categoryChannel.children.cache.values()) {
          await channel.delete();
        }
        await categoryChannel.delete();
      }

      await project.updateOne({ workSpaceId: null });

      i.update({
        content: `Workspace for project **${project.name}** has been removed.`,
        embeds: [],
        components: [],
      });
    } else if (i.customId === "cancel") {
      i.update({
        content: "Remove workspace has been cancelled.",
        embeds: [],
        components: [],
      });
    }
  });
}

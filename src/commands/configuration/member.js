const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ComponentType,
  UserSelectMenuBuilder,
} = require("discord.js");
const Project = require("../../models/Project");
const EmbedProjectInfo = require("../../components/embeds/EmbedProjectInfo");
const { invalidMembersAddingToProject } = require("../../utils/member");
const { getProjectsFromInteraction } = require("../../utils/project");
const EmbedConfirm = require("../../components/embeds/EmbedConfirm");
const {
  ButtonsConfirmDelete,
} = require("../../components/buttons/ButtonConfirm");
const MenuProject = require("../../components/menuSelect/MenuProject");
const checkAndCreateUser = require("../../utils/checkAndCreateUser");

// Data for the command
const data = new SlashCommandBuilder()
  .setName("member")
  .setDescription("Member configuration in project!")

  // Add member subcommand
  .addSubcommand((subcommand) =>
    subcommand.setName("add").setDescription("Add members to join the project")
  )

  // Remove member subcommand
  .addSubcommand((subcommand) =>
    subcommand
      .setName("remove")
      .setDescription("Remove member from the project")
      .addStringOption((option) =>
        option
          .setName("project")
          .setDescription("The project you want to remove member from")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("The member you want to remove from the project")
          .setRequired(true)
      )
  );

// Function run when the command is called
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
    //Add member to project command
    case "add":
      await handleAddMember(interaction);
      break;

    //Remove member from project command
    case "remove":
      await handleRemoveMember(interaction);
      break;
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

// Function to handle add member
async function handleAddMember(interaction) {
  await interaction.deferReply();

  const embed = new EmbedBuilder()
    .setTitle("Add Member")
    .setDescription(
      "Please choose the project you want to add member to in the dropdown menu below"
    )
    .setColor("Random");

  const projects = await Project.find({
    guildId: interaction.guild.id,
    ownerId: interaction.user.id,
  });

  const menuProjects = MenuProject(projects);

  const actionRow = new ActionRowBuilder().addComponents(menuProjects);

  const reply = await interaction.editReply({
    embeds: [embed],
    components: [actionRow],
  });

  const collectorProject = reply.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    filter: (i) => i.user.id === interaction.user.id,
    time: 60_000,
  });

  collectorProject.on("collect", async (i) => {
    if (i.values.length === 0) {
      return i.reply({
        content: "Please select a project to add member to",
        flags: 64,
      });
    }

    const project = await Project.findById(i.values[0]);

    const embedProject = EmbedProjectInfo(project, interaction);
    embedProject.setFooter({
      text: "Please don't add yourself, members who are already in the project or bots",
    });

    const menuMembers = new UserSelectMenuBuilder()
      .setCustomId("members")
      .setPlaceholder("Select members to add to the project")
      .setMinValues(1)
      .setMaxValues(10);
    const actionRowMembers = new ActionRowBuilder().addComponents(menuMembers);

    const reply = await i.update({
      content: "Select members to add to the project",
      embeds: [embedProject],
      components: [actionRowMembers],
    });

    const collectorMembers = reply.createMessageComponentCollector({
      componentType: ComponentType.UserSelect,
      filter: (i) => i.user.id === interaction.user.id,
      time: 60_000 * 3,
    });

    collectorMembers.on("collect", async (i) => {
      if (i.values.length === 0) {
        return i.reply({
          content: "Please select members to add to the project",
          flags: 64,
        });
      }

      const members = i.values;

      const invalidMembers = invalidMembersAddingToProject(
        members,
        project,
        interaction
      );

      if (invalidMembers.length > 0) {
        await i.reply({
          content: `You can't add: ${invalidMembers.join(", ")}`,
          flags: 64,
        });
        return;
      }

      for (const memberId of members) {
        const member = interaction.guild.members.cache.get(memberId);
        project.members.push(member.id);

        if (project.roleId) {
          const role = interaction.guild.roles.cache.get(project.roleId);

          await member.roles.add(role);
        }
      }

      await project.save();

      const embedProjectUpdated = EmbedProjectInfo(project, interaction);

      embedProjectUpdated.setColor("Green");

      await i.update({
        content: "Members added to the project successfully",
        embeds: [embedProjectUpdated],
        components: [],
      });
    });
  });
}

// Function to handle remove member
async function handleRemoveMember(interaction) {
  const targetProjectId = interaction.options.getString("project");

  const projects = await getProjectsFromInteraction(interaction);

  const project = projects.find(
    (project) => project._id.toString() === targetProjectId
  );

  if (!project) {
    return interaction.reply({
      content: "Project not found",
      ephemeral: true,
    });
  }

  if (project.ownerId !== interaction.user.id) {
    return interaction.reply({
      content: "You are not the owner of this project",
      ephemeral: true,
    });
  }

  const targetMember = interaction.options.getUser("member");

  if (!targetMember) {
    return interaction.reply({
      content: "Member not found",
      ephemeral: true,
    });
  }

  const targetMemberId = targetMember.id;

  const members = project.members;

  if (!members.includes(targetMemberId)) {
    return interaction.reply({
      content: "Member not found in the project",
      ephemeral: true,
    });
  }

  if (targetMemberId === interaction.user.id) {
    return interaction.reply({
      content: "You can't remove yourself from the project",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const embedConfirmation = EmbedConfirm(
    "Remove Member",
    `Are you sure you want to remove <@${targetMemberId}> from the project **${project.name}**?`,
    "You have 30 seconds to confirm this action"
  );

  const buttonsConfirm = ButtonsConfirmDelete;

  const actionRow = new ActionRowBuilder().addComponents(buttonsConfirm);

  await interaction.editReply({
    embeds: [embedConfirmation],
    components: [actionRow],
  });

  const collector = interaction.channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === interaction.user.id,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "confirm") {
      const member = interaction.guild.members.cache.get(targetMemberId);
      const role = interaction.guild.roles.cache.get(project.roleId);
      if (role) {
        member.roles.remove(role);
      }

      project.members = members.filter((member) => member !== targetMemberId);

      await project.save();

      const embedProjectUpdated = EmbedProjectInfo(project, interaction);

      embedProjectUpdated.setColor("Green");

      await i.update({
        content: `**${targetMember.username}** removed from the project successfully`,
        embeds: [embedProjectUpdated],
        components: [],
      });
    } else if (i.customId === "cancel") {
      await i.update({
        content: "Remove member action cancelled",
        embeds: [],
        components: [],
      });
    }
  });

  collector.on("end", async (collected, reason) => {
    if (reason === "time") {
      await interaction.editReply({
        content: "Confirmation timed out. Please try again",
        embeds: [],
        components: [],
      });
    }
  });
}

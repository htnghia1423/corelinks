const {
  Client,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  ChatInputCommandInteraction,
} = require("discord.js");
const Project = require("../../models/Project");
const { convertToPlus7 } = require("../../utils/convertTime");
const EmbedProjectInfo = require("../../components/embeds/EmbedProjectInfo");
const {
  ButtonsConfirmDelete,
  ButtonsConfirmCreate,
} = require("../../components/buttons/ButtonConfirm");
const { getProjectsFromInteraction } = require("../../utils/project");
const { getAllMembers } = require("../../utils/member");

//Function to handle the slash command run
/**
 * @param {Object} param0
 * @param {ChatInputCommandInteraction} param0.interaction
 * @param {Client} param0.client
 */
async function run({ interaction, client, handler }) {
  //Check if the command is run in a server
  if (!interaction.inGuild()) {
    interaction.reply({
      content: "This command is only available in servers.",
      ephemeral: true,
    });
  }

  const subCommandGroup = interaction.options.getSubcommandGroup();
  const subCommand = interaction.options.getSubcommand();

  if (subCommandGroup) {
    switch (subCommandGroup) {
      //Run command delete
      case "delete":
        switch (subCommand) {
          case "one":
            handleDeleteOne(interaction, client);
            break;

          case "all":
            handleDeleteAll(interaction, client);
            break;
        }
        break;

      //Run command role
      case "role":
        switch (subCommand) {
          case "create":
            await handleCreateRole(interaction);
            break;
        }
        break;
    }
  } else {
    switch (subCommand) {
      //Run command create
      case "create":
        handleCreate(interaction);
        break;

      //Run command list
      case "list":
        handleList(interaction);
        break;

      //Run command view
      case "view":
        handleView(interaction);
        break;
    }
  }
}

//Data for the slash commands
const data = new SlashCommandBuilder()
  .setName("project")
  .setDescription("Configuration for project")

  //Create project command
  .addSubcommand((subcommand) =>
    subcommand
      .setName("create")
      .setDescription("Create a project")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("The name of the project you want to create!")
          .setRequired(true)
      )
  )

  //Delete project commands
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("delete")
      .setDescription("Delete a project")

      //Delete one project command
      .addSubcommand((subCommand) =>
        subCommand
          .setName("one")
          .setDescription("Delete a project")
          .addStringOption((option) =>
            option
              .setName("name")
              .setDescription("The name of the project you want to delete!")
              .setRequired(true)
          )
      )

      //Delete all projects command
      .addSubcommand((subCommand) =>
        subCommand.setName("all").setDescription("Delete all projects")
      )
  )

  //List all projects command
  .addSubcommand((subcommand) =>
    subcommand.setName("list").setDescription("List all projects")
  )

  //View project command
  .addSubcommand((subcommand) =>
    subcommand
      .setName("view")
      .setDescription("View a project")
      .addStringOption((option) =>
        option
          .setName("project")
          .setDescription("The project you want to view!")
          .setRequired(true)
          .setAutocomplete(true)
      )
  )

  //Role configuration for project commands
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("role")
      .setDescription("Role configuration for project")

      //Create role for project command
      .addSubcommand((subcommand) =>
        subcommand
          .setName("create")
          .setDescription("Create a role for the project")
          .addStringOption((option) =>
            option
              .setName("project")
              .setDescription("The project you want to create a role for!")
              .setRequired(true)
              .setAutocomplete(true)
          )
      )
  );

module.exports = {
  run,

  data,

  options: {
    //Option for delete this command
    // deleted: true,
  },
};

//Function to handle create project
async function handleCreate(interaction) {
  const projectName = interaction.options.getString("name");

  if (!projectName) {
    interaction.reply({
      content: "Please provide a name for the project.",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  let queryCreate = {
    guildId: interaction.guild.id,
    name: new RegExp(`^${projectName}$`, "i"),
  };

  const projectExists = await Project.findOne(queryCreate);
  if (projectExists) {
    interaction.editReply({
      content: `Project **${projectName}** already exists. Please choose a different name.`,
    });
    return;
  }

  const project = new Project({
    guildId: interaction.guild.id,
    name: projectName,
    ownerId: interaction.user.id,
  });

  await project.save();

  const actionRow = new ActionRowBuilder().addComponents(ButtonsConfirmCreate);

  const reply = await interaction.editReply({
    content: `Project **${projectName}** created successfully.\n Do you want to create a role for this project? (You can always create it later by using \`/project role create\`)`,
    components: [actionRow],
  });

  const collector = reply.createMessageComponentCollector({
    filter: (i) => i.user.id === interaction.user.id,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "create") {
      try {
        const role = await i.guild.roles.create({
          name: projectName,
          color: "Random",
        });

        await i.update({
          content: `Role ${role} created successfully.`,
          components: [],
        });

        await project.updateOne({ roleId: role.id });

        const member = await i.guild.members.fetch(project.ownerId);
        await member.roles.add(role);
      } catch (error) {
        await i.update({
          content: `Failed to create role. Please check my permissions.`,
          components: [],
        });
      }
    } else if (i.customId === "cancel") {
      await i.update({
        content: `Role creation canceled.`,
        components: [],
      });
    }
  });
}

//Function to handle delete one project
async function handleDeleteOne(interaction, client) {
  const projectNameDelete = interaction.options.getString("name");
  if (!projectNameDelete) {
    interaction.reply({
      content: "Please provide a name for the project.",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  let queryDeleteOne = {
    guildId: interaction.guild.id,
    name: new RegExp(`^${projectNameDelete}$`, "i"),
  };

  const projectToDelete = await Project.findOne(queryDeleteOne);
  if (!projectToDelete) {
    interaction.editReply({
      content: `Project **${projectNameDelete}** does not exist. Please use command \`/project list\` to see all your projects.`,
    });
    return;
  }

  if (projectToDelete.ownerId !== interaction.user.id) {
    interaction.editReply({
      content: `You do not have permission to delete project **${
        projectToDelete.name
      }**. Please contact the owner ${client.users.cache.get(
        projectToDelete.ownerId
      )}.`,
    });
    return;
  }

  const embedDelete = new EmbedBuilder()
    .setTitle("Delete Project")
    .setDescription(
      `Are you sure you want to delete this project? You have **30** seconds to decide.`
    )
    .addFields([
      {
        name: "Name",
        value: projectToDelete.name,
      },
      {
        name: "Owner",
        value: client.users.cache.get(projectToDelete.ownerId).tag,
      },
      {
        name: "Created At",
        value: convertToPlus7(projectToDelete.createdAt),
      },
    ])
    .setColor("Red")
    .setTimestamp(new Date());

  const row = new ActionRowBuilder().addComponents(ButtonsConfirmDelete);

  const reply = await interaction.editReply({
    embeds: [embedDelete],
    components: [row],
  });

  const targetUserInteraction = await reply
    .awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60_000,
    })
    .catch(async () => {
      const embedTimeout = new EmbedBuilder()
        .setTitle("Delete Project")
        .setDescription("Time is up. Deletion canceled.")
        .setColor("Grey");

      await reply.edit({
        embeds: [embedTimeout],
        components: [],
      });
    });

  if (!targetUserInteraction) return;

  const targetUserChoice = targetUserInteraction.customId;

  switch (targetUserChoice) {
    case "confirm":
      await Project.deleteOne(queryDeleteOne);

      const embedConfirm = new EmbedBuilder()
        .setTitle("Delete Project")
        .setColor("Green")
        .setDescription(
          `Project **${projectToDelete.name}** deleted successfully.`
        )
        .addFields([
          {
            name: "Deleted at",
            value: convertToPlus7(new Date()),
          },
        ]);

      await reply.edit({
        embeds: [embedConfirm],
        components: [],
      });
      break;

    case "cancel":
      const embedCancel = new EmbedBuilder()
        .setTitle("Delete Project")
        .setDescription("Deletion canceled. Project is safe.")
        .setColor("LightGrey");

      await reply.edit({
        embeds: [embedCancel],
        components: [],
      });
      break;
  }
}

//Function to handle delete all projects
async function handleDeleteAll(interaction) {
  await interaction.deferReply();

  let queryDeleteAll = {
    guildId: interaction.guild.id,
    ownerId: interaction.user.id,
  };

  const projectsToDelete = await Project.find(queryDeleteAll);

  if (projectsToDelete.length === 0) {
    interaction.editReply({
      content: "You have no projects to delete. Try creating one.",
    });
    return;
  }

  const embedDeleteAll = new EmbedBuilder()
    .setTitle("Delete All Projects")
    .setDescription(
      `Are you sure you want to delete all your projects?
      \nYou have **30** seconds to decide.
      \nYour projects:`
    )
    .setColor("Red")
    .setTimestamp(new Date());

  projectsToDelete.forEach((project) => {
    embedDeleteAll.addFields([
      {
        name: "Name",
        value: project.name,
        inline: true,
      },
      {
        name: "Created At",
        value: convertToPlus7(project.createdAt),
        inline: true,
      },
      {
        name: " ",
        value: " ",
        inline: false,
      },
    ]);
  });

  const row = new ActionRowBuilder().addComponents(ButtonsConfirmDelete);

  const reply = await interaction.editReply({
    embeds: [embedDeleteAll],
    components: [row],
  });

  const targetUserInteraction = await reply
    .awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60_000,
    })
    .catch(async () => {
      const embedTimeout = new EmbedBuilder()
        .setTitle("Delete All Projects")
        .setDescription("Time is up. Deletion canceled.")
        .setColor("Grey");

      await reply.edit({
        embeds: [embedTimeout],
        components: [],
      });
    });

  if (!targetUserInteraction) return;

  const targetUserChoice = targetUserInteraction.customId;

  switch (targetUserChoice) {
    case "confirm":
      await Project.deleteMany(queryDeleteAll);

      const embedConfirm = new EmbedBuilder()
        .setTitle("Delete All Projects")
        .setColor("Green")
        .setDescription(`All your projects deleted successfully.`)
        .addFields([
          {
            name: "Deleted at",
            value: convertToPlus7(new Date()),
          },
        ]);

      await reply.edit({
        embeds: [embedConfirm],
        components: [],
      });
      break;

    case "cancel":
      const embedCancel = new EmbedBuilder()
        .setTitle("Delete All Projects")
        .setDescription("Deletion canceled. Your projects is safe.")
        .setColor("LightGrey");

      await reply.edit({
        embeds: [embedCancel],
        components: [],
      });
      break;
  }
}

//Function to handle list all projects
async function handleList(interaction) {
  await interaction.deferReply();

  let queryList = {
    guildId: interaction.guild.id,
    ownerId: interaction.user.id,
  };

  const projects = await Project.find(queryList);

  if (projects.length === 0) {
    interaction.editReply({
      content: "You have no projects. Try creating one with `/project create`.",
    });
    return;
  }

  const embedList = new EmbedBuilder()
    .setTitle("Your Projects")
    .setColor("Random")
    .setDescription("Here are your projects:")
    .setTimestamp(new Date())
    .setThumbnail(interaction.user.displayAvatarURL())
    .setFooter({
      text: "You can choose a project to view in the list below.",
    });

  projects.forEach((project) => {
    embedList.addFields(
      { name: "Name", value: project.name, inline: true },
      {
        name: "Created At",
        value: convertToPlus7(project.createdAt),
        inline: true,
      },
      {
        name: " ",
        value: " ",
        inline: false,
      }
    );
  });

  //Add select menu to the embed
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(interaction.id)
    .setPlaceholder("Select a project to view")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      projects.map((project) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(project.name)
          .setValue(project._id.toString())
      )
    );

  const actionRow = new ActionRowBuilder().addComponents(selectMenu);

  const reply = await interaction.editReply({
    embeds: [embedList],
    components: [actionRow],
  });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    filter: (i) =>
      i.user.id === interaction.user.id && i.customId === interaction.id,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    if (i.values.length === 0) return;

    let query = {
      guildId: interaction.guild.id,
      _id: i.values[0],
    };

    const project = await Project.findOne(query);

    const embed = EmbedProjectInfo(project, interaction);

    await i.update({ embeds: [embed], components: [actionRow] });
  });
}

//Function to handle view project
async function handleView(interaction) {
  const projectId = interaction.options.getString("project");

  const projects = await getProjectsFromInteraction(interaction);

  const targetProject = projects.find(
    (project) => project._id.toString() === projectId
  );

  await interaction.deferReply();

  if (!targetProject) {
    interaction.editReply({
      content: `Project does not exist. Please use command \`/project list\` to see all your projects.`,
    });
    return;
  }

  const embed = EmbedProjectInfo(targetProject, interaction);

  interaction.editReply({ embeds: [embed] });
}

//Function to handle create role for project
async function handleCreateRole(interaction) {
  const projecId = interaction.options.getString("project");

  if (!projecId) {
    interaction.reply({
      content: "Please choose a project to create a role for.",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const project = await Project.findOne({
    guildId: interaction.guild.id,
    _id: projecId,
  });

  if (!project) {
    interaction.editReply({
      content: `Project **${project.name}** does not exist. Please use command \`/project list\` to see all your projects.`,
    });
    return;
  }

  const existingRole = interaction.guild.roles.cache.find(
    (role) => role.name === project.name
  );

  if (existingRole) {
    interaction.editReply({
      content: `Role ${existingRole} for project **${project.name}** already exists.`,
    });
    return;
  }

  try {
    const role = await interaction.guild.roles.create({
      name: project.name,
      color: "Random",
    });

    await project.updateOne({ roleId: role.id });

    await interaction.editReply({
      content: `Role ${role} created successfully.`,
    });

    const allMembers = await getAllMembers(projecId, interaction);

    for (const memberId of allMembers) {
      const member = interaction.guild.members.cache.get(memberId);
      await member.roles.add(role);
    }
  } catch (error) {
    await interaction.editReply({
      content: `Failed to create role. Please check my permissions.`,
    });
  }
}

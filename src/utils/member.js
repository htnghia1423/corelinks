const Project = require("../models/Project");

function invalidMembersAddingToProject(members, project, interaction) {
  const invalidMembers = [];

  for (const memberId of members) {
    const member = interaction.guild.members.cache.get(memberId);

    if (project.members.includes(memberId)) {
      invalidMembers.push(member.user.username + " (already in project)");
    }

    if (memberId === project.ownerId) {
      invalidMembers.push(member.user.username + " (project owner)");
    }

    if (member.user.bot) {
      invalidMembers.push(member.user.username + " (bot)");
    }
  }
  return invalidMembers;
}

async function invalidMembersAssignToTask(members, task, interaction) {
  const invalidMembers = [];
  const project = await Project.findOne({ _id: task.projectId });

  for (const memberId of members) {
    const member = interaction.guild.members.cache.get(memberId);

    if (!project.members.includes(memberId)) {
      invalidMembers.push(member.user.username + " (not in project)");
    }

    if (task.assigneesId.includes(memberId)) {
      invalidMembers.push(member.user.username + " (already assigned)");
    }

    if (member.user.bot) {
      invalidMembers.push(member.user.username + " (bot)");
    }
  }

  return invalidMembers;
}

async function invalidMembersRemoveFromTask(members, task, interaction) {
  const invalidMembers = [];
  const project = await Project.findOne({ _id: task.projectId });

  for (const memberId of members) {
    const member = interaction.guild.members.cache.get(memberId);

    if (!project.members.includes(memberId)) {
      invalidMembers.push(member.user.username + " (not in project)");
    }

    if (!task.assigneesId.includes(memberId)) {
      invalidMembers.push(member.user.username + " (not assigned)");
    }

    if (memberId === project.ownerId) {
      invalidMembers.push(member.user.username + " (project owner)");
    }

    if (member.user.bot) {
      invalidMembers.push(member.user.username + " (bot)");
    }
  }

  return invalidMembers;
}

async function getAllMembers(projectId, interaction) {
  const project = await Project.findOne({
    guildId: interaction.guild.id,
    _id: projectId,
  });

  const allMembers = [];

  allMembers.push(project.ownerId);

  for (const memberId of project.members) {
    allMembers.push(memberId);
  }

  return allMembers;
}

module.exports = {
  invalidMembersAddingToProject,
  invalidMembersAssignToTask,
  invalidMembersRemoveFromTask,
  getAllMembers,
};

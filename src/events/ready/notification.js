const OverdueNoti = require("../../models/OverdueNoti");
const Task = require("../../models/Task");
const Project = require("../../models/Project");
const { Client } = require("discord.js");

/**
 *
 * @param {Client} client
 */
module.exports = (client) => {
  checkOverdue();
  setInterval(checkOverdue, 24 * 60 * 60 * 1000);

  async function checkOverdue() {
    try {
      const notifications = await OverdueNoti.find();

      for (const noti of notifications) {
        const targerGuild =
          client.guilds.cache.get(noti.guildId) ||
          (await client.guilds.fetch(noti.guildId));

        if (!targerGuild) {
          await OverdueNoti.findByIdAndDelete({
            _id: noti._id,
          });
          continue;
        }

        const targetChannel =
          targerGuild.channels.cache.get(noti.channelId) ||
          (await targerGuild.channels.fetch(noti.channelId));

        if (!targetChannel) {
          await OverdueNoti.findByIdAndDelete({
            _id: noti._id,
          });
          continue;
        }

        const targetProject = await Project.findById(noti.projectId);

        if (!targetProject) {
          await OverdueNoti.findByIdAndDelete({
            _id: noti._id,
          });
          continue;
        }

        const tasks = await Task.find({
          projectId: targetProject._id.toString(),
        });

        for (const task of tasks) {
          const dueDate = task.dueDate;
          const now = new Date();

          if (
            dueDate !== null &&
            dueDate < now &&
            task.status !== "done" &&
            task.assigneesId.length > 0
          ) {
            await targetChannel.send(
              `Task **${task.title}** is over due! Assignees: ${task.assigneesId
                .map((id) => `<@${id}>`)
                .join(", ")}.\nPlease check it now!`
            );
          }
        }
      }
    } catch (error) {
      console.log("Error in checkDeadline function: ", error);
    }
  }
};

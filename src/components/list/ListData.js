const ListPriority = [
  { name: "Low", value: "low", emoji: "🟢", description: "Low priority" },
  {
    name: "Medium",
    value: "medium",
    emoji: "🟡",
    description: "Medium priority",
  },
  { name: "High", value: "high", emoji: "🔴", description: "High priority" },
];

const ListStatus = [
  {
    name: "To Do",
    value: "todo",
    description: "Task to do",
    emoji: "🔵",
  },
  {
    name: "In Progress",
    value: "in-progress",
    description: "Task in progress",
    emoji: "🟡",
  },
  { name: "Done", value: "done", description: "Task done", emoji: "🟢" },
];

module.exports = {
  ListPriority,
  ListStatus,
};

const User = require("../models/User");

module.exports = async (interaction) => {
  const user = await User.findOne({ userId: interaction.user.id });

  if (!user) {
    const newUser = new User({
      userId: interaction.user.id,
    });

    await newUser.save();
  }
};

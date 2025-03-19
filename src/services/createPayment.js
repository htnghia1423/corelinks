const axios = require("axios");

module.exports = async function createPayment(userId) {
  try {
    const paymentData = {
      userId: userId,
      amount: 79000,
      description: "Register Premium package",
    };

    const response = await axios.post(
      `${process.env.API_PAYMENT_URL}/create-payment-link`,
      paymentData
    );

    return {
      paymentUrl: response.data.paymentUrl,
      orderCode: response.data.orderCode,
    };
  } catch (error) {
    console.error(
      "Error creating payment link:",
      error.response?.data || error.message
    );
    throw new Error("Failed to create payment link. Please try again later.");
  }
};

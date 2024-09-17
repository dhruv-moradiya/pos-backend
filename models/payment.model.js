const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["CASH", "ONLINE"] },
  paymentDate: { type: Date, default: Date.now },
  transactionId: String,
});

const Payment = mongoose.model("Payment", paymentSchema);

const crypto = require("crypto");
const {
  getSupabaseAdmin,
  requireUser,
  sendError,
  requireRazorpayEnv,
} = require("./_server");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const user = await requireUser(req, supabase);
    const { keySecret } = requireRazorpayEnv();
    const {
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body || {};

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      const error = new Error("Missing Razorpay payment details.");
      error.statusCode = 400;
      throw error;
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      const error = new Error("Payment signature verification failed.");
      error.statusCode = 400;
      throw error;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, razorpay_order_id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    if (!order || order.razorpay_order_id !== razorpayOrderId) {
      const error = new Error("Order does not match this payment.");
      error.statusCode = 400;
      throw error;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        order_status: "confirmed",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      })
      .eq("id", orderId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({ order: updatedOrder });
  } catch (error) {
    sendError(res, error);
  }
};

const {
  getSupabaseAdmin,
  requireUser,
  sendError,
  requireRazorpayEnv,
} = require("./_server");

function validateDelivery(delivery) {
  const required = ["name", "phone", "address", "city", "state", "pincode"];
  const cleaned = {};

  for (const key of required) {
    const value = String(delivery?.[key] || "").trim();
    if (!value) {
      const error = new Error(`Missing delivery ${key}.`);
      error.statusCode = 400;
      throw error;
    }
    cleaned[key] = value;
  }

  return cleaned;
}

async function createRazorpayOrder({ keyId, keySecret, amount, receipt, notes }) {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount * 100,
      currency: "INR",
      receipt,
      notes,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload?.error?.description || "Razorpay order creation failed.");
    error.statusCode = response.status;
    throw error;
  }

  return payload;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const user = await requireUser(req, supabase);
    const { keyId, keySecret } = requireRazorpayEnv();
    const delivery = validateDelivery(req.body?.delivery);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    if (!items.length) {
      const error = new Error("Bag is empty.");
      error.statusCode = 400;
      throw error;
    }

    const normalizedItems = items.map((item) => ({
      productId: String(item.productId || ""),
      size: String(item.size || "").trim(),
      color: String(item.color || "").trim(),
      quantity: Number(item.quantity || 0),
    }));

    if (
      normalizedItems.some(
        (item) => !item.productId || !item.size || !item.color || item.quantity < 1,
      )
    ) {
      const error = new Error("Every cart item needs a product, size, color, and quantity.");
      error.statusCode = 400;
      throw error;
    }

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price_value, image_url, status")
      .in("id", productIds)
      .eq("status", "published");

    if (productsError) {
      throw productsError;
    }

    const productMap = new Map((products || []).map((product) => [product.id, product]));
    if (productMap.size !== productIds.length) {
      const error = new Error("One or more products are unavailable.");
      error.statusCode = 400;
      throw error;
    }

    const orderItems = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);
      const lineTotal = product.price_value * item.quantity;
      return {
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        selected_size: item.size,
        selected_color: item.color,
        unit_price: product.price_value,
        quantity: item.quantity,
        line_total: lineTotal,
      };
    });
    const subtotal = orderItems.reduce((total, item) => total + item.line_total, 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_email: user.email,
        customer_name: delivery.name,
        customer_phone: delivery.phone,
        shipping_address: delivery.address,
        shipping_city: delivery.city,
        shipping_state: delivery.state,
        shipping_pincode: delivery.pincode,
        subtotal,
        total: subtotal,
        payment_status: "pending",
        order_status: "payment_pending",
      })
      .select("*")
      .single();

    if (orderError) {
      throw orderError;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      orderItems.map((item) => ({
        ...item,
        order_id: order.id,
      })),
    );

    if (itemsError) {
      throw itemsError;
    }

    const razorpayOrder = await createRazorpayOrder({
      keyId,
      keySecret,
      amount: subtotal,
      receipt: order.order_number,
      notes: {
        local_order_id: order.id,
        customer_email: user.email || "",
      },
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", order.id);

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      orderId: order.id,
      orderNumber: order.order_number,
      razorpayOrderId: razorpayOrder.id,
      keyId,
      amount: subtotal * 100,
      currency: "INR",
      customer: {
        name: delivery.name,
        email: user.email,
        phone: delivery.phone,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

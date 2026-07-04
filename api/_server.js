const { createClient } = require("@supabase/supabase-js");

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" ? token : "";
}

async function requireUser(req, supabase) {
  const token = getBearerToken(req);
  if (!token) {
    const error = new Error("You must be signed in.");
    error.statusCode = 401;
    throw error;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    const authError = new Error(error?.message || "Invalid session.");
    authError.statusCode = 401;
    throw authError;
  }

  return data.user;
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: error.message || "Unexpected server error.",
  });
}

function requireRazorpayEnv() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.");
  }

  return { keyId, keySecret };
}

module.exports = {
  getSupabaseAdmin,
  requireUser,
  sendError,
  requireRazorpayEnv,
};

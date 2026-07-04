import { supabase } from "./supabase";

export type CmsProductRow = {
  id: string;
  name: string;
  category: string | null;
  fit: string;
  copy: string;
  price_value: number;
  compare_at: string | null;
  badge: string | null;
  selected_size: string;
  material: string;
  care: string;
  status: "draft" | "published";
  featured: boolean;
  sort_order: number;
  image_url: string | null;
  sizes: string[] | null;
  swatches: string[] | null;
  color_names: string[] | null;
  product_images?: {
    url: string;
    alt: string | null;
    sort_order: number;
  }[];
  product_colors?: {
    name: string;
    hex: string;
    sort_order: number;
  }[];
};

export type CmsProductInput = {
  id?: string;
  name: string;
  category: string;
  fit: string;
  copy: string;
  priceValue: number;
  compareAt?: string;
  badge?: string;
  selectedSize: string;
  material: string;
  care: string;
  status: "draft" | "published";
  featured: boolean;
  sortOrder: number;
  imageUrl: string;
  sizes: string[];
  swatches: string[];
  colorNames: string[];
};

export type CmsContentRow = {
  id: string;
  key: string;
  label: string;
  body: string;
  sort_order: number;
  updated_at?: string;
};

export type CmsProfile = {
  id: string;
  email: string | null;
  role: "admin" | "customer";
};

export type OrderStatus =
  | "payment_pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

export type CmsOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  selected_size: string;
  selected_color: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type CmsOrder = {
  id: string;
  order_number: string;
  user_id: string;
  customer_email: string | null;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  subtotal: number;
  total: number;
  currency: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
  order_items?: CmsOrderItem[];
};

export const productSelect = `
  *,
  product_images(url, alt, sort_order),
  product_colors(name, hex, sort_order)
`;

const orderSelect = `
  *,
  order_items(*)
`;

export async function fetchPublishedProducts() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CmsProductRow[];
}

export async function fetchAllProducts() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CmsProductRow[];
}

export async function fetchContentBlocks() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CmsContentRow[];
}

export async function fetchCustomerOrders() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CmsOrder[];
}

export async function fetchAllOrders() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CmsOrder[];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("orders")
    .update({ order_status: status })
    .eq("id", orderId);

  if (error) {
    throw error;
  }
}

export async function fetchAdminProfile(userId: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as CmsProfile | null;
}

export async function upsertProduct(input: CmsProductInput) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const row = {
    id: input.id,
    name: input.name,
    category: input.category,
    fit: input.fit,
    copy: input.copy,
    price_value: input.priceValue,
    compare_at: input.compareAt || null,
    badge: input.badge || null,
    selected_size: input.selectedSize,
    material: input.material,
    care: input.care,
    status: input.status,
    featured: input.featured,
    sort_order: input.sortOrder,
    image_url: input.imageUrl || null,
    sizes: input.sizes,
    swatches: input.swatches,
    color_names: input.colorNames,
  };

  const { data, error } = await supabase
    .from("products")
    .upsert(row)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const productId = data.id as string;
  await supabase.from("product_colors").delete().eq("product_id", productId);

  if (input.swatches.length) {
    const { error: colorsError } = await supabase
      .from("product_colors")
      .insert(
        input.swatches.map((hex, index) => ({
          product_id: productId,
          hex,
          name: input.colorNames[index] || `Color ${index + 1}`,
          sort_order: index,
        })),
      );

    if (colorsError) {
      throw colorsError;
    }
  }

  await supabase.from("product_images").delete().eq("product_id", productId);

  if (input.imageUrl) {
    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: productId,
      url: input.imageUrl,
      alt: input.name,
      sort_order: 0,
    });

    if (imageError) {
      throw imageError;
    }
  }

  return productId;
}

export async function deleteProduct(productId: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    throw error;
  }
}

export async function saveContentBlock(
  id: string,
  body: string,
  label?: string,
) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("site_content")
    .update({ body, label })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function uploadProductImage(file: File) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

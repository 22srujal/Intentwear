import { MouseEvent, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Antigravity from "./Antigravity";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import {
  CmsContentRow,
  CmsProductInput,
  CmsProductRow,
  deleteProduct,
  fetchAdminProfile,
  fetchAllProducts,
  fetchContentBlocks,
  fetchPublishedProducts,
  saveContentBlock,
  uploadProductImage,
  upsertProduct,
} from "./lib/cms";
import heroVideo from "./assets/hero-main.mp4";
import bambooGrove from "./assets/bamboo-grove.png";
import bambooWeave from "./assets/bamboo-weave.png";
import bambooEverydayTee from "./assets/product-bamboo-everyday-tee.png";
import oversizedDrop from "./assets/product-oversized-drop.png";
import relaxedHenley from "./assets/product-relaxed-henley.png";
import wideLegPant from "./assets/product-wide-leg-bamboo-pant.png";
import shopSlimFitBambooTee from "./assets/shop-slim-fit-bamboo-tee.png";
import shopOversizedDropShoulder from "./assets/shop-oversized-drop-shoulder.png";
import shopRelaxedHenley from "./assets/shop-relaxed-henley.png";
import shopWideLegBambooPant from "./assets/shop-wide-leg-bamboo-pant.png";
import shopBoxFitPolo from "./assets/shop-box-fit-polo.png";
import shopCroppedBambooTee from "./assets/shop-cropped-bamboo-tee.png";
import shopLonglineBambooShirt from "./assets/shop-longline-bamboo-shirt.png";
import shopTaperedJogger from "./assets/shop-tapered-jogger.png";

type Route = "/" | "/shop" | "/about" | "/account" | "/admin" | "/admin/login";
type ShopFilter = "All" | "Tees" | "Oversized" | "Henleys" | "Bottoms";
type SortMode = "Featured" | "Price: Low";
type ProductDetail = {
  id?: string;
  image: string;
  badge?: string;
  name: string;
  category?: ShopFilter;
  fit: string;
  copy: string;
  price: string;
  priceValue: number;
  compareAt?: string;
  selectedSize: string;
  swatches: string[];
  colorNames: string[];
  material: string;
  care: string;
  status?: "draft" | "published";
  featured?: boolean;
  sortOrder?: number;
  sizes?: string[];
};
type CartItem = ProductDetail & {
  id: string;
  size: string;
  color: string;
  quantity: number;
};

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 640px)").matches
      : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  return isMobile;
}

function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 1.15,
  className = "",
  startWhen = true,
  separator = "",
}: {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(direction === "down" ? to : from);

  useEffect(() => {
    const element = ref.current;
    if (!element || !startWhen) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const startValue = direction === "down" ? to : from;
    const endValue = direction === "down" ? from : to;

    if (reduceMotion) {
      setValue(endValue);
      return;
    }

    let frameId = 0;
    let timeoutId = 0;
    const startCounter = () => {
      const startTime = performance.now();
      const durationMs = duration * 1000;

      const tick = (time: number) => {
        const progress = Math.min((time - startTime) / durationMs, 1);
        const easedProgress = 1 - (1 - progress) ** 3;
        setValue(
          Math.round(startValue + (endValue - startValue) * easedProgress),
        );

        if (progress < 1) {
          frameId = requestAnimationFrame(tick);
        }
      };

      frameId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeoutId = window.setTimeout(startCounter, delay * 1000);
          observer.disconnect();
        }
      },
      { threshold: 0.45 },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(frameId);
    };
  }, [delay, direction, duration, from, startWhen, to]);

  const formattedValue = new Intl.NumberFormat("en-US").format(value);

  return (
    <span className={className} ref={ref}>
      {separator ? formattedValue.replace(/,/g, separator) : formattedValue}
    </span>
  );
}

function AnimatedList({ items }: { items: string[][] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(
    () => new Set(),
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setVisibleItems(new Set(items.map((_, index) => index)));
      return;
    }

    const cards = Array.from(
      list.querySelectorAll<HTMLElement>("[data-list-index]"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(
              (entry.target as HTMLElement).dataset.listIndex,
            );
            setVisibleItems((current) => new Set(current).add(index));
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.28 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="timeline-grid animated-list" ref={listRef}>
      {items.map(([title, text], index) => (
        <article
          className={
            visibleItems.has(index)
              ? index === selectedIndex
                ? "timeline-card animated-list-item visible selected"
                : "timeline-card animated-list-item visible"
              : "timeline-card animated-list-item"
          }
          data-list-index={index}
          key={title}
          onClick={() => setSelectedIndex(index)}
          onMouseEnter={() => setSelectedIndex(index)}
          tabIndex={0}
          onFocus={() => setSelectedIndex(index)}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
      ))}
    </div>
  );
}

const heroStats = [
  ["2021", "Founded"],
  ["38°C", "Designed for"],
  ["12K+", "Customers"],
];

const principles = [
  [
    "Airflow",
    "Bamboo lyocell keeps air moving so fabric feels cool even when the day does not.",
  ],
  [
    "No shortcuts",
    "Every batch is tested for hand-feel, drape, pilling, and colorfastness before release.",
  ],
  ["3°C", "The fabric was tuned for Indian summers, not temperate lookbooks."],
  ["Pre-washed", "Garments arrive soft, stable, and ready for repeated wear."],
];

const process = [
  ["Source", "Moso bamboo grown without irrigation-intensive farming."],
  ["Pulp", "Closed-loop processing recaptures water and solvent."],
  ["Spin", "Fine yarns create a smooth hand without synthetic shine."],
  [
    "Blend & weave",
    "A 70/30 bamboo-cotton composition balances softness and structure.",
  ],
  ["Lab test", "Shrinkage, pilling, and color are checked before cutting."],
  [
    "Wear",
    "The final garment is trialed through real commutes, heat, and wash cycles.",
  ],
];

const values = [
  ["OEKO-TEX Standard 100", "Every finished fabric is independently tested."],
  ["GOTS Organic Cotton", "Cotton inputs are certified where applicable."],
  ["Low Impact Dyes", "Colors are chosen for lower water stress."],
  [
    "Carbon Offset Shipping",
    "Delivery emissions are offset through verified partners.",
  ],
];

const promises = [
  [
    "Clear Composition",
    "70% bamboo viscose, 30% organic cotton. Every fibre named, no filler.",
  ],
  [
    "Daily Indian Heat",
    "Tested at 38°C. Moisture-wicking and breathable from 7 am to midnight.",
  ],
  [
    "Soft from First Wear",
    "No breaking in. Enzyme-washed and ready the moment it touches your skin.",
  ],
  [
    "No Vague Eco Talk",
    "OEKO-TEX certified. We share our supply chain - not just a green sticker.",
  ],
];

const products = [
  {
    image: bambooEverydayTee,
    badge: "Bestseller",
    name: "Bamboo Everyday Tee",
    category: "Tees",
    fit: "Slim Fit · Classic Crew",
    copy: "70% bamboo viscose, 30% organic cotton. Stays cool through Delhi summers.",
    price: "₹1,490",
    priceValue: 1490,
    compareAt: "₹1,990",
    selectedSize: "M",
    swatches: ["#f4efe6", "#1a3528", "#7a5c3a"],
    colorNames: ["Cream", "Forest", "Cedar"],
    material: "70% Bamboo Viscose, 30% Organic Cotton · 180 GSM",
    care: "Machine wash cold, inside out. Tumble dry low.",
  },
  {
    image: oversizedDrop,
    badge: "New",
    name: "Oversized Drop",
    category: "Oversized",
    fit: "French Terry",
    copy: "Boxy silhouette, garment-washed for an effortless lived-in drape.",
    price: "₹1,790",
    priceValue: 1790,
    selectedSize: "L",
    swatches: ["#f4efe6", "#3d6b4f", "#2a2a2a"],
    colorNames: ["Cream", "Moss", "Charcoal"],
    material: "65% Bamboo Viscose, 35% Organic Cotton · French Terry · 260 GSM",
    care: "Machine wash cold, inside out. Tumble dry low.",
  },
  {
    image: relaxedHenley,
    name: "Relaxed Henley",
    category: "Henleys",
    fit: "Two-Button Placket",
    copy: "Slightly curved hem, breathes like a second skin at 38°C.",
    price: "₹1,690",
    priceValue: 1690,
    compareAt: "₹1,990",
    selectedSize: "S",
    swatches: ["#f4efe6", "#8f866f", "#1a3528"],
    colorNames: ["Cream", "Stone", "Forest"],
    material: "70% Bamboo Viscose, 30% Organic Cotton · Rib Placket",
    care: "Machine wash cold. Dry flat for best shape.",
  },
  {
    image: wideLegPant,
    badge: "New",
    name: "Wide-Leg Bamboo Pant",
    category: "Bottoms",
    fit: "Drawstring Waist",
    copy: "Full wide-leg cut, elasticated drawstring waist. Flows with every step.",
    price: "₹2,290",
    priceValue: 2290,
    selectedSize: "M",
    swatches: ["#ede7da", "#2a2a2a", "#6b5a44"],
    colorNames: ["Oat", "Black", "Umber"],
    material: "68% Bamboo Viscose, 28% Organic Cotton, 4% Elastane",
    care: "Machine wash cold. Line dry in shade.",
  },
] satisfies ProductDetail[];

const shopProducts = [
  {
    image: shopSlimFitBambooTee,
    badge: "Bestseller",
    name: "Slim Fit Bamboo Tee",
    category: "Tees",
    fit: "Classic Crew Neck",
    copy: "A smooth everyday tee with a slim profile and breathable bamboo comfort.",
    price: "₹1,490",
    priceValue: 1490,
    selectedSize: "M",
    swatches: ["#f4efe6", "#1a3528", "#7a5c3a"],
    colorNames: ["Cream", "Forest", "Cedar"],
    material: "70% Bamboo Viscose, 30% Organic Cotton · 180 GSM",
    care: "Machine wash cold, inside out. Tumble dry low.",
  },
  {
    image: shopOversizedDropShoulder,
    badge: "New",
    name: "Oversized Drop-Shoulder",
    category: "Oversized",
    fit: "French Terry",
    copy: "Generous drop shoulders, boxy silhouette. Garment-washed for an effortless lived-in texture that gets better after every wash.",
    price: "₹1,790",
    priceValue: 1790,
    selectedSize: "L",
    swatches: ["#f4efe6", "#3d6b4f", "#2a2a2a"],
    colorNames: ["Cream", "Moss", "Charcoal"],
    material: "65% Bamboo Viscose, 35% Organic Cotton · French Terry · 260 GSM",
    care: "Machine wash cold, inside out. Tumble dry low.",
  },
  {
    image: shopRelaxedHenley,
    name: "Relaxed Henley",
    category: "Henleys",
    fit: "Two-Button Placket",
    copy: "A softly structured henley with a curved hem and breathable bamboo handle.",
    price: "₹1,690",
    priceValue: 1690,
    selectedSize: "S",
    swatches: ["#f4efe6", "#8f866f", "#1a3528"],
    colorNames: ["Cream", "Stone", "Forest"],
    material: "70% Bamboo Viscose, 30% Organic Cotton · Rib Placket",
    care: "Machine wash cold. Dry flat for best shape.",
  },
  {
    image: shopWideLegBambooPant,
    badge: "New",
    name: "Wide-Leg Bamboo Pant",
    category: "Bottoms",
    fit: "Drawstring Waist",
    copy: "Full wide-leg cut with an elasticated drawstring waist. Built to move without sticking.",
    price: "₹2,290",
    priceValue: 2290,
    selectedSize: "M",
    swatches: ["#ede7da", "#2a2a2a", "#6b5a44"],
    colorNames: ["Oat", "Black", "Umber"],
    material: "68% Bamboo Viscose, 28% Organic Cotton, 4% Elastane",
    care: "Machine wash cold. Line dry in shade.",
  },
  {
    image: shopBoxFitPolo,
    name: "Box-Fit Polo",
    category: "Tees",
    fit: "Short Sleeve",
    copy: "A neat box-fit polo with an airy sleeve and soft collar structure.",
    price: "₹1,890",
    priceValue: 1890,
    selectedSize: "M",
    swatches: ["#f4efe6", "#7a5c3a", "#bcc6ab"],
    colorNames: ["Cream", "Clay", "Sage"],
    material: "70% Bamboo Viscose, 30% Organic Cotton · Pique Knit",
    care: "Machine wash cold. Reshape while damp.",
  },
  {
    image: shopCroppedBambooTee,
    name: "Cropped Bamboo Tee",
    category: "Tees",
    fit: "Women's Relaxed Fit",
    copy: "A cropped everyday tee with a relaxed shoulder and cooling bamboo softness.",
    price: "₹1,390",
    priceValue: 1390,
    selectedSize: "S",
    swatches: ["#f4efe6", "#d7cbb8", "#1a3528"],
    colorNames: ["Cream", "Sand", "Forest"],
    material: "70% Bamboo Viscose, 30% Organic Cotton · 170 GSM",
    care: "Machine wash cold. Tumble dry low.",
  },
  {
    image: shopLonglineBambooShirt,
    name: "Longline Bamboo Shirt",
    category: "Oversized",
    fit: "Open Collar",
    copy: "A relaxed open-collar shirt with a longer line and easy layering drape.",
    price: "₹2,190",
    priceValue: 2190,
    selectedSize: "L",
    swatches: ["#e9ded0", "#7a5c3a", "#1a3528"],
    colorNames: ["Natural", "Cedar", "Forest"],
    material: "64% Bamboo Viscose, 36% Organic Cotton · Woven",
    care: "Machine wash cold. Hang dry.",
  },
  {
    image: shopTaperedJogger,
    name: "Tapered Jogger",
    category: "Bottoms",
    fit: "Cuffed Hem",
    copy: "A soft tapered jogger with a flexible cuff and commuter-ready comfort.",
    price: "₹1,990",
    priceValue: 1990,
    selectedSize: "M",
    swatches: ["#f4efe6", "#2a2a2a", "#8f9b7a"],
    colorNames: ["Cream", "Black", "Sage"],
    material: "66% Bamboo Viscose, 30% Organic Cotton, 4% Elastane",
    care: "Machine wash cold. Line dry in shade.",
  },
] satisfies ProductDetail[];

const defaultContent: Record<string, string> = {
  "home.hero.kicker": "100% Bamboo · Made for India",
  "home.hero.title": "Forest to Body, Body to Soul.",
  "home.hero.lede": "Bamboo-led basics for Indian heat.",
  "home.collection.title": "Basics that last, heat that doesn't.",
  "home.origin.title": "We Started with a Bamboo Stalk.",
  "home.origin.body_one":
    "Not a trend. Not a mood board. A single stalk of Moso bamboo that grows three feet per day without pesticides, without irrigation, without asking much of the earth at all.",
  "home.origin.body_two":
    "We asked what if fabric could carry that same softness, speed, efficiency, already where Intent is our answer. Worn daily across Delhi, Pune, Chennai. Built for Indian summers.",
  "shop.hero.title": "The Full Collection",
  "shop.hero.lede": "8 styles · Bamboo-led, India-built",
  "shop.note":
    "All Intent garments are OEKO-TEX Standard 100 certified. Free shipping across India on orders above ₹1,999.",
  "about.hero.title": "Built on one honest question.",
  "about.hero.lede":
    "Why does sustainable clothing have to compromise on comfort - especially in a country that sits at 40°C for five months a year?",
  "footer.tagline": "Plant-based essentials for hot Indian days.",
};

type StorefrontData = {
  featuredProducts: ProductDetail[];
  shopProducts: ProductDetail[];
  content: Record<string, string>;
  status: "fallback" | "loading" | "ready" | "error";
};

const emptyProduct: CmsProductInput = {
  name: "",
  category: "Tees",
  fit: "",
  copy: "",
  priceValue: 0,
  compareAt: "",
  badge: "",
  selectedSize: "M",
  material: "",
  care: "",
  status: "draft",
  featured: false,
  sortOrder: 0,
  imageUrl: "",
  sizes: ["XS", "S", "M", "L", "XL"],
  swatches: ["#f4efe6"],
  colorNames: ["Cream"],
};

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function mapCmsProduct(row: CmsProductRow): ProductDetail {
  const sortedImages = [...(row.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const sortedColors = [...(row.product_colors ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const swatches =
    sortedColors.length > 0
      ? sortedColors.map((color) => color.hex)
      : row.swatches?.length
        ? row.swatches
        : ["#f4efe6"];
  const colorNames =
    sortedColors.length > 0
      ? sortedColors.map((color) => color.name)
      : row.color_names?.length
        ? row.color_names
        : ["Cream"];

  return {
    id: row.id,
    image: sortedImages[0]?.url || row.image_url || shopSlimFitBambooTee,
    badge: row.badge || undefined,
    name: row.name,
    category: (row.category as ShopFilter | null) ?? "Tees",
    fit: row.fit,
    copy: row.copy,
    price: formatPrice(row.price_value),
    priceValue: row.price_value,
    compareAt: row.compare_at || undefined,
    selectedSize: row.selected_size || "M",
    swatches,
    colorNames,
    material: row.material,
    care: row.care,
    status: row.status,
    featured: row.featured,
    sortOrder: row.sort_order,
    sizes: row.sizes ?? ["XS", "S", "M", "L", "XL"],
  };
}

function productToInput(product: ProductDetail): CmsProductInput {
  return {
    id: product.id,
    name: product.name,
    category: product.category ?? "Tees",
    fit: product.fit,
    copy: product.copy,
    priceValue: product.priceValue,
    compareAt: product.compareAt ?? "",
    badge: product.badge ?? "",
    selectedSize: product.selectedSize,
    material: product.material,
    care: product.care,
    status: product.status ?? "published",
    featured: product.featured ?? false,
    sortOrder: product.sortOrder ?? 0,
    imageUrl: product.image,
    sizes: product.sizes ?? ["XS", "S", "M", "L", "XL"],
    swatches: product.swatches,
    colorNames: product.colorNames,
  };
}

function contentValue(content: Record<string, string>, key: string) {
  return content[key] ?? defaultContent[key] ?? "";
}

function readableError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "Could not complete admin sign in.";
}

function adminLoginHint(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("relation") || lowerMessage.includes("does not exist")) {
    return " Run the Supabase migration first, then try again.";
  }

  if (lowerMessage.includes("permission") || lowerMessage.includes("policy")) {
    return " Check that the RLS policies from the migration were created.";
  }

  if (lowerMessage.includes("invalid login")) {
    return " Check the email/password in Supabase Authentication.";
  }

  return "";
}

function splitTitle(value: string, fallback: string) {
  const title = value || fallback;
  const separator = title.includes(", ") ? ", " : title.includes(". ") ? ". " : "";

  if (!separator) {
    return [title, ""] as const;
  }

  const [first, ...rest] = title.split(separator);
  return [`${first}${separator.trim()}`, rest.join(separator)] as const;
}

function useStorefrontData(): StorefrontData {
  const [data, setData] = useState<StorefrontData>({
    featuredProducts: products,
    shopProducts,
    content: defaultContent,
    status: isSupabaseConfigured ? "loading" : "fallback",
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let ignore = false;

    async function loadStorefront() {
      try {
        const [productRows, contentRows] = await Promise.all([
          fetchPublishedProducts(),
          fetchContentBlocks(),
        ]);
        if (ignore) {
          return;
        }

        const mappedProducts = productRows.map(mapCmsProduct);
        const nextContent = {
          ...defaultContent,
          ...Object.fromEntries(contentRows.map((item) => [item.key, item.body])),
        };

        setData({
          featuredProducts:
            mappedProducts.filter((product) => product.featured).slice(0, 4)
              .length > 0
              ? mappedProducts.filter((product) => product.featured).slice(0, 4)
              : products,
          shopProducts: mappedProducts.length > 0 ? mappedProducts : shopProducts,
          content: nextContent,
          status: "ready",
        });
      } catch (error) {
        console.error("Failed to load Supabase storefront data", error);
        if (!ignore) {
          setData((current) => ({ ...current, status: "error" }));
        }
      }
    }

    loadStorefront();
    return () => {
      ignore = true;
    };
  }, []);

  return data;
}

function normalizePath(pathname: string): Route {
  if (pathname === "/admin" || pathname === "/admin/login") {
    return pathname;
  }

  if (pathname === "/shop") {
    return "/shop";
  }

  if (pathname === "/account") {
    return "/account";
  }

  return pathname === "/about" ? "/about" : "/";
}

function App() {
  const [route, setRoute] = useState<Route>(() =>
    normalizePath(window.location.pathname),
  );
  const storefront = useStorefrontData();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartMessage, setCartMessage] = useState("Bag is empty");
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null,
  );
  const [isBagOpen, setIsBagOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => setRoute(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextRoute: Route, hash = "") => {
    const nextUrl = `${nextRoute}${hash}`;
    if (nextRoute !== route) {
      window.history.pushState({}, "", nextUrl);
      setRoute(nextRoute);
      if (hash) {
        window.setTimeout(
          () =>
            document
              .querySelector(hash)
              ?.scrollIntoView({ behavior: "smooth" }),
          0,
        );
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      return;
    }

    if (hash) {
      window.history.pushState({}, "", nextUrl);
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const addToCart = (
    product: ProductDetail,
    options?: { size?: string; color?: string; quantity?: number },
  ) => {
    const size = options?.size ?? product.selectedSize;
    const color = options?.color ?? product.colorNames[0];
    const quantity = options?.quantity ?? 1;
    const id = `${product.name}-${size}-${color}`;

    setCartItems((items) => {
      const existing = items.find((item) => item.id === id);
      if (existing) {
        return items.map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...items, { ...product, id, size, color, quantity }];
    });
    setCartMessage(`${product.name} · ${size} · ${color} added`);
    setIsBagOpen(true);
    window.setTimeout(() => setCartMessage("Cart ready"), 1800);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeCartItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const routedPage =
    route === "/about" ? (
      <AboutPage
        navigate={navigate}
        cartCount={cartCount}
        cartMessage={cartMessage}
        content={storefront.content}
        onOpenBag={() => setIsBagOpen(true)}
      />
    ) : route === "/admin" || route === "/admin/login" ? (
      <AdminPage navigate={navigate} />
    ) : route === "/account" ? (
      <AccountPage
        navigate={navigate}
        cartCount={cartCount}
        cartMessage={cartMessage}
        content={storefront.content}
        onOpenBag={() => setIsBagOpen(true)}
      />
    ) : route === "/shop" ? (
      <ShopPage
        navigate={navigate}
        cartCount={cartCount}
        cartMessage={cartMessage}
        products={storefront.shopProducts}
        content={storefront.content}
        onOpenBag={() => setIsBagOpen(true)}
        onOpenProduct={setSelectedProduct}
        onAddToCart={addToCart}
      />
    ) : (
      <HomePage
        navigate={navigate}
        cartCount={cartCount}
        cartMessage={cartMessage}
        featuredProducts={storefront.featuredProducts}
        shopProducts={storefront.shopProducts}
        content={storefront.content}
        onOpenBag={() => setIsBagOpen(true)}
        onOpenProduct={setSelectedProduct}
        onAddToCart={addToCart}
      />
    );

  return (
    <>
      {routedPage}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
      <BagDrawer
        isOpen={isBagOpen}
        items={cartItems}
        onClose={() => setIsBagOpen(false)}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeCartItem}
        onShop={() => {
          setIsBagOpen(false);
          navigate("/shop");
        }}
      />
    </>
  );
}

function Nav({
  active,
  navigate,
  cartCount,
  cartMessage,
  onOpenBag,
}: {
  active?: "home" | "shop" | "about" | "account" | "journal";
  navigate: (route: Route, hash?: string) => void;
  cartCount: number;
  cartMessage?: string;
  onOpenBag: () => void;
}) {
  const onNavigate = (
    event: MouseEvent<HTMLAnchorElement>,
    route: Route,
    hash = "",
  ) => {
    event.preventDefault();
    navigate(route, hash);
  };

  return (
    <nav className="nav" data-name="Nav">
      <a
        className="brand"
        href="/"
        aria-label="Intent home"
        onClick={(event) => onNavigate(event, "/")}
      >
        Intent
      </a>
      <div className="nav-links" aria-label="Primary navigation">
        <a
          className={active === "home" ? "active" : undefined}
          href="/"
          onClick={(event) => onNavigate(event, "/")}
        >
          Home
        </a>
        <a
          className={active === "shop" ? "active" : undefined}
          href="/shop"
          onClick={(event) => onNavigate(event, "/shop")}
        >
          Shop
        </a>
        <a
          className={active === "about" ? "active" : undefined}
          href="/about"
          onClick={(event) => onNavigate(event, "/about")}
        >
          About
        </a>
      </div>
      <div className="nav-actions" aria-label="Account and cart">
        <button
          className="cart-button"
          aria-label={`Shopping bag with ${cartCount} items`}
          type="button"
          data-count={cartCount}
          title={cartMessage}
          onClick={onOpenBag}
        />
        <button
          className={
            active === "account" ? "account-button active" : "account-button"
          }
          aria-label="Account"
          type="button"
          onClick={() => navigate("/account")}
        />
      </div>
    </nav>
  );
}

function HomePage({
  navigate,
  cartCount,
  cartMessage,
  featuredProducts,
  shopProducts,
  content,
  onOpenBag,
  onOpenProduct,
  onAddToCart,
}: {
  navigate: (route: Route, hash?: string) => void;
  cartCount: number;
  cartMessage: string;
  featuredProducts: ProductDetail[];
  shopProducts: ProductDetail[];
  content: Record<string, string>;
  onOpenBag: () => void;
  onOpenProduct: (product: ProductDetail) => void;
  onAddToCart: (
    product: ProductDetail,
    options?: { size?: string; color?: string; quantity?: number },
  ) => void;
}) {
  return (
    <div
      className="page-shell home-page"
      data-node-id="52:2274"
      data-name="Main landing page"
    >
      <Nav
        active="home"
        navigate={navigate}
        cartCount={cartCount}
        cartMessage={cartMessage}
        onOpenBag={onOpenBag}
      />
      <main>
        <section className="home-hero" data-node-id="52:2987" data-name="Hero">
          <video
            className="home-hero-image"
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
          <div className="home-hero-overlay" />
          <div className="home-hero-copy">
            <p>{contentValue(content, "home.hero.kicker")}</p>
            <h1>
              {splitTitle(contentValue(content, "home.hero.title"), defaultContent["home.hero.title"])[0]}
              <span>
                {splitTitle(contentValue(content, "home.hero.title"), defaultContent["home.hero.title"])[1]}
              </span>
            </h1>
            <span className="home-hero-lede">
              {contentValue(content, "home.hero.lede")}
            </span>
            <a
              className="home-hero-button"
              href="/shop"
              onClick={(event) => {
                event.preventDefault();
                navigate("/shop");
              }}
            >
              Shop Bamboo Tees
              <span aria-hidden="true">→</span>
            </a>
            <div className="scroll-cue" aria-hidden="true">
              <span />
              Scroll
            </div>
          </div>
        </section>

        <section className="promise-band">
          <div className="promise-grid">
            {promises.map(([title, text]) => (
              <article className="promise-item" key={title}>
                <span aria-hidden="true" />
                <h2>{title}</h2>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <ProductShowcase
          products={featuredProducts}
          onOpenProduct={onOpenProduct}
          onAddToCart={onAddToCart}
        />

        <section className="collection-section" id="shop">
          <div className="collection-heading">
            <div>
              <p className="section-label">The collection</p>
              <h2>
                {splitTitle(contentValue(content, "home.collection.title"), defaultContent["home.collection.title"])[0]}
                <span>
                  {splitTitle(contentValue(content, "home.collection.title"), defaultContent["home.collection.title"])[1]}
                </span>
              </h2>
            </div>
            <a
              href="/shop"
              onClick={(event) => {
                event.preventDefault();
                navigate("/shop");
              }}
            >
              View all →
            </a>
          </div>
          <div className="collection-grid">
            {shopProducts.slice(0, 3).map((product) => (
              <article
                className="collection-card"
                key={product.name}
                role="button"
                tabIndex={0}
                onClick={() => onOpenProduct(product)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenProduct(product);
                  }
                }}
              >
                <div className="collection-image">
                  {product.badge && <span>{product.badge}</span>}
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="collection-meta">
                  <div>
                    <h3>
                      {product.name === "Bamboo Everyday Tee"
                        ? "Slim Fit Bamboo Tee"
                        : product.name}
                    </h3>
                    <p>{product.fit}</p>
                  </div>
                  <strong>{product.price}</strong>
                </div>
                <div
                  className="swatches"
                  aria-label={`${product.name} color options`}
                >
                  <span />
                  <span />
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate("/shop");
                  }}
                >
                  Choose size
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="origin-section">
          <div className="origin-pattern" aria-hidden="true" />
          <div className="origin-copy">
            <p className="section-label">Our origin</p>
            <h2>
              {splitTitle(contentValue(content, "home.origin.title"), defaultContent["home.origin.title"])[0]}
              <span>
                {splitTitle(contentValue(content, "home.origin.title"), defaultContent["home.origin.title"])[1]}
              </span>
            </h2>
            <p>{contentValue(content, "home.origin.body_one")}</p>
            <p>{contentValue(content, "home.origin.body_two")}</p>
            <button type="button" onClick={() => navigate("/about")}>
              Our Story <span aria-hidden="true">→</span>
            </button>
          </div>
          <figure className="origin-image">
            <img src={bambooGrove} alt="Dense bamboo grove" />
            <figcaption>
              Moso Bamboo · Fujian Province · Harvested at 5 years
            </figcaption>
          </figure>
        </section>
      </main>
      <Footer content={content} />
    </div>
  );
}

function ProductShowcase({
  products,
  onOpenProduct,
  onAddToCart,
}: {
  products: ProductDetail[];
  onOpenProduct: (product: ProductDetail) => void;
  onAddToCart: (
    product: ProductDetail,
    options?: { size?: string; color?: string; quantity?: number },
  ) => void;
}) {
  const isMobile = useIsMobileViewport();

  return (
    <section className="featured-drop" aria-labelledby="featured-title">
      <div className="leaf-field" aria-hidden="true" />
      <div className="antigravity-field" aria-hidden="true">
        <Antigravity
          count={isMobile ? 72 : 180}
          magnetRadius={isMobile ? 3.8 : 6}
          ringRadius={isMobile ? 4.5 : 7}
          waveSpeed={isMobile ? 0.24 : 0.32}
          waveAmplitude={isMobile ? 0.42 : 0.8}
          particleSize={isMobile ? 0.72 : 1.95}
          lerpSpeed={isMobile ? 0.035 : 0.055}
          color="#1a3528"
          autoAnimate
          particleVariance={isMobile ? 0.35 : 0.75}
          rotationSpeed={isMobile ? 0.035 : 0.08}
          depthFactor={isMobile ? 0.32 : 0.65}
          particleShape="tetrahedron"
          fieldStrength={isMobile ? 5 : 8}
          disablePointer={isMobile}
        />
      </div>
      <p className="section-label" id="featured-title">
        Featured Drop
      </p>
      <div className="featured-grid">
        {products.map((product) => (
          <ProductCard
            product={product}
            key={product.name}
            onOpenProduct={onOpenProduct}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  onOpenProduct,
  onAddToCart,
}: {
  product: ProductDetail;
  onOpenProduct: (product: ProductDetail) => void;
  onAddToCart: (
    product: ProductDetail,
    options?: { size?: string; color?: string; quantity?: number },
  ) => void;
}) {
  const sizes = product.sizes ?? ["XS", "S", "M", "L", "XL"];
  const [selectedSize, setSelectedSize] = useState(product.selectedSize);
  const [added, setAdded] = useState(false);

  const addProduct = () => {
    setAdded(true);
    onAddToCart(product, { size: selectedSize, color: product.colorNames[0] });
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article
      className="product-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpenProduct(product)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenProduct(product);
        }
      }}
    >
      <header>
        <span aria-hidden="true" />
        <strong>Intent</strong>
        <span aria-hidden="true" />
      </header>
      <div className="product-image">
        <img src={product.image} alt={product.name} />
        {product.badge && <span>{product.badge}</span>}
      </div>
      <div className="product-info">
        <div className="product-title-row">
          <div>
            <h3>{product.name}</h3>
            <p>{product.fit}</p>
          </div>
          <div className="product-price">
            <strong>{product.price}</strong>
            {product.compareAt && <span>{product.compareAt}</span>}
          </div>
        </div>
        <p>{product.copy}</p>
        <div className="size-row" aria-label={`${product.name} sizes`}>
          {sizes.map((size) => (
            <button
              className={size === selectedSize ? "selected" : undefined}
              type="button"
              key={size}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedSize(size);
              }}
            >
              {size}
            </button>
          ))}
        </div>
        <button
          className={added ? "add-button added" : "add-button"}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            addProduct();
          }}
        >
          {added ? "Added" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

function ShopPage({
  navigate,
  cartCount,
  cartMessage,
  products,
  content,
  onOpenBag,
  onOpenProduct,
  onAddToCart,
}: {
  navigate: (route: Route, hash?: string) => void;
  cartCount: number;
  cartMessage: string;
  products: ProductDetail[];
  content: Record<string, string>;
  onOpenBag: () => void;
  onOpenProduct: (product: ProductDetail) => void;
  onAddToCart: (
    product: ProductDetail,
    options?: { size?: string; color?: string; quantity?: number },
  ) => void;
}) {
  const filters: ShopFilter[] = [
    "All",
    "Tees",
    "Oversized",
    "Henleys",
    "Bottoms",
  ];
  const [activeFilter, setActiveFilter] = useState<ShopFilter>("All");
  const [sortMode, setSortMode] = useState<SortMode>("Featured");
  const [selectedSwatches, setSelectedSwatches] = useState<
    Record<string, number>
  >({});

  const visibleProducts = products
    .filter(
      (product) => activeFilter === "All" || product.category === activeFilter,
    )
    .slice()
    .sort((a, b) =>
      sortMode === "Price: Low" ? a.priceValue - b.priceValue : 0,
    );

  return (
    <div
      className="page-shell shop-page"
      data-node-id="69:1687"
      data-name="shop page"
    >
      <Nav
        active="shop"
        navigate={navigate}
        cartCount={cartCount}
        cartMessage={cartMessage}
        onOpenBag={onOpenBag}
      />
      <main>
        <section className="shop-hero" data-node-id="69:1691">
          <div className="shop-hero-pattern" aria-hidden="true" />
          <p className="section-label">Intent</p>
          <h1>{contentValue(content, "shop.hero.title")}</h1>
          <p>{contentValue(content, "shop.hero.lede")}</p>
        </section>

        <section className="shop-toolbar" aria-label="Product filters and sort">
          <div className="shop-toolbar-inner">
            <div className="filter-chips" aria-label="Filter products">
              <span className="filter-icon" aria-hidden="true" />
              {filters.map((filter) => (
                <button
                  className={activeFilter === filter ? "active" : undefined}
                  type="button"
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button
              className="sort-button"
              type="button"
              onClick={() =>
                setSortMode((mode) =>
                  mode === "Featured" ? "Price: Low" : "Featured",
                )
              }
            >
              {sortMode} <span aria-hidden="true">⌄</span>
            </button>
          </div>
        </section>

        <section className="shop-grid-wrap">
          <div className="shop-grid">
            {visibleProducts.map((product) => (
              <article
                className="shop-card"
                key={product.name}
                role="button"
                tabIndex={0}
                onClick={() => onOpenProduct(product)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenProduct(product);
                  }
                }}
              >
                <div className="shop-card-image">
                  <img src={product.image} alt={product.name} />
                  {product.badge && <span>{product.badge}</span>}
                </div>
                <div className="shop-card-meta">
                  <div>
                    <h2>{product.name}</h2>
                    <p>{product.fit}</p>
                  </div>
                  <strong>{product.price}</strong>
                </div>
                <div
                  className="shop-swatches"
                  aria-label={`${product.name} color options`}
                >
                  {product.swatches.map((swatch, index) => (
                    <button
                      className={
                        selectedSwatches[product.name] === index
                          ? "selected"
                          : undefined
                      }
                      style={{ backgroundColor: swatch }}
                      key={swatch}
                      type="button"
                      aria-label={`${product.name} color ${index + 1}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedSwatches((selected) => ({
                          ...selected,
                          [product.name]: index,
                        }));
                      }}
                    />
                  ))}
                </div>
                <button
                  className="shop-add-button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddToCart(product, {
                      color:
                        product.colorNames[selectedSwatches[product.name] ?? 0],
                    });
                  }}
                >
                  Add to Cart
                </button>
              </article>
            ))}
          </div>
          <p className="shop-note">{contentValue(content, "shop.note")}</p>
        </section>
      </main>
      <Footer content={content} />
    </div>
  );
}

function ProductModal({
  product,
  onClose,
  onAddToCart,
}: {
  product: ProductDetail | null;
  onClose: () => void;
  onAddToCart: (
    product: ProductDetail,
    options?: { size?: string; color?: string; quantity?: number },
  ) => void;
}) {
  const sizes = product?.sizes ?? ["S", "M", "L", "XL", "XXL"];
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedColor(0);
    setSelectedSize("");
    setQuantity(1);
  }, [product]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [product, onClose]);

  if (!product) {
    return null;
  }

  const canAdd = selectedSize.length > 0;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${product.name} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="product-modal-header">
          <p>{product.category ?? "Intent"}</p>
          <button
            type="button"
            aria-label="Close product details"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="product-modal-image">
          <img src={product.image} alt={product.name} />
          {product.badge && <span>{product.badge}</span>}
        </div>
        <div className="product-modal-body">
          <div className="product-modal-title">
            <div>
              <h2>{product.name}</h2>
              <p>{product.fit}</p>
            </div>
            <strong>{product.price}</strong>
          </div>

          <div className="modal-option">
            <p>
              Colour <span>— {product.colorNames[selectedColor]}</span>
            </p>
            <div className="modal-swatches">
              {product.swatches.map((swatch, index) => (
                <button
                  className={selectedColor === index ? "selected" : undefined}
                  style={{ backgroundColor: swatch }}
                  type="button"
                  key={swatch}
                  aria-label={product.colorNames[index]}
                  onClick={() => setSelectedColor(index)}
                >
                  {selectedColor === index && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-option">
            <div className="size-heading">
              <p>Size</p>
              <a href="#size-guide">Size guide</a>
            </div>
            <div className="modal-sizes">
              {sizes.map((size) => (
                <button
                  className={selectedSize === size ? "selected" : undefined}
                  type="button"
                  key={size}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
            {!selectedSize && (
              <span className="size-error">Please select a size</span>
            )}
          </div>

          <div className="modal-actions">
            <div className="quantity-stepper" aria-label="Quantity">
              <button
                type="button"
                onClick={() => setQuantity((count) => Math.max(1, count - 1))}
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((count) => count + 1)}
              >
                +
              </button>
            </div>
            <button
              className="modal-add-button"
              type="button"
              disabled={!canAdd}
              onClick={() => {
                if (!canAdd) {
                  return;
                }

                onAddToCart(product, {
                  size: selectedSize,
                  color: product.colorNames[selectedColor],
                  quantity,
                });
                onClose();
              }}
            >
              Add to Cart
            </button>
          </div>

          <div className="modal-description">
            <p>{product.copy}</p>
            <p>
              <strong>Material</strong> · {product.material}
            </p>
            <p>
              <strong>Care</strong> · {product.care}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function BagDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemove,
  onShop,
}: {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onShop: () => void;
}) {
  const subtotal = items.reduce(
    (total, item) => total + item.priceValue * item.quantity,
    0,
  );

  return (
    <div
      className={isOpen ? "bag-layer open" : "bag-layer"}
      aria-hidden={!isOpen}
      onClick={onClose}
    >
      <aside
        className="bag-drawer"
        aria-label="Shopping bag"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p>Intent Bag</p>
            <span>
              {items.length
                ? `${items.length} item type${items.length > 1 ? "s" : ""}`
                : "No items yet"}
            </span>
          </div>
          <button type="button" aria-label="Close bag" onClick={onClose}>
            ×
          </button>
        </header>

        {items.length === 0 ? (
          <div className="bag-empty">
            <p>Your bag is waiting for bamboo.</p>
            <button type="button" onClick={onShop}>
              Shop collection
            </button>
          </div>
        ) : (
          <>
            <div className="bag-items">
              {items.map((item) => (
                <article className="bag-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <p>
                      {item.color} · {item.size}
                    </p>
                    <strong>{item.price}</strong>
                    <div className="bag-item-actions">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                      >
                        +
                      </button>
                      <button type="button" onClick={() => onRemove(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <footer>
              <div>
                <span>Subtotal</span>
                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>
              <button type="button" onClick={onClose}>
                Checkout
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

function AboutPage({
  navigate,
  cartCount,
  cartMessage,
  content,
  onOpenBag,
}: {
  navigate: (route: Route, hash?: string) => void;
  cartCount: number;
  cartMessage: string;
  content: Record<string, string>;
  onOpenBag: () => void;
}) {
  return (
    <div
      className="page-shell"
      data-node-id="69:876"
      data-name="Minimalist E-commerce Landing Page"
    >
      <Nav
        active="about"
        navigate={navigate}
        cartCount={cartCount}
        cartMessage={cartMessage}
        onOpenBag={onOpenBag}
      />
      <main>
        <section
          className="hero-section"
          id="about"
          data-node-id="69:880"
          data-name="Container"
        >
          <div className="bamboo-pattern" aria-hidden="true" />
          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow" data-node-id="69:969">
                Who we are
              </p>
              <h1 data-node-id="69:971">
                {splitTitle(contentValue(content, "about.hero.title"), defaultContent["about.hero.title"])[0]}
                <span>
                  {splitTitle(contentValue(content, "about.hero.title"), defaultContent["about.hero.title"])[1]}
                </span>
              </h1>
              <p className="hero-lede" data-node-id="69:973">
                {contentValue(content, "about.hero.lede")}
              </p>
            </div>
            <div className="hero-stats">
              {heroStats.map(([value, label]) => (
                <div className="hero-stat" key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="story-section">
          <figure className="source-card" data-node-id="69:991">
            <img src={bambooGrove} alt="Dense green moso bamboo grove" />
            <figcaption>Moso Bamboo · Fujian, China · Our source</figcaption>
          </figure>

          <article className="story-copy">
            <p className="section-label">Our Story</p>
            <h2>
              Intent started in a sweaty
              <span>Bangalore summer.</span>
            </h2>
            <div className="body-copy">
              <p>
                In 2021, our founder Arjun Nair was sorting through a drawer
                full of t-shirts - all of them damp, heavy, or already pilling.
                He was buying "sustainable" brands whose eco-credentials were
                buried in vague language, and fast-fashion brands whose comfort
                evaporated by noon.
              </p>
              <p>
                He spent six months researching bamboo - not as a trend, but as
                a genuinely superior material for tropical climates. He visited
                Tirupur spinning mills, read OEKO-TEX testing protocols, and
                tested 22 different fabric blends before settling on Intent's
                70/30 composition.
              </p>
              <p>
                Intent launched with a single SKU: the Slim Fit Bamboo Tee.
                Within 90 days it had sold out three times. The brief had worked
                - people were buying it for comfort, and staying for the
                conscience.
              </p>
            </div>
            <div className="mini-metrics">
              <div>
                <strong>
                  <CountUp to={22} className="count-up-text" />
                </strong>
                <span>Prototypes before launch</span>
              </div>
              <div>
                <strong className="composition-count">
                  <CountUp to={70} className="count-up-text" />
                  <span aria-hidden="true">/</span>
                  <CountUp to={30} className="count-up-text" />
                </strong>
                <span>Bamboo cotton composition</span>
              </div>
              <div>
                <strong>
                  <CountUp to={3} className="count-up-text" />
                  <span aria-hidden="true">x</span>
                </strong>
                <span>Sold out in 90 days</span>
              </div>
            </div>
          </article>
        </section>

        <section className="principles-section">
          <div className="section-heading">
            <p className="section-label">The argument</p>
            <h2>
              Why bamboo.
              <span>Why now. Why India.</span>
            </h2>
          </div>
          <p className="section-note">
            The Indian wardrobe needs clothing that handles heat, motion, repeat
            washing, and a lighter footprint without asking people to choose
            between them.
          </p>
          <div className="principle-grid">
            {principles.map(([title, text], index) => (
              <article className="principle-card" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="process-section">
          <div className="process-copy">
            <p className="section-label">The journey from forest to fabric</p>
            <h2>
              Every fibre earned.
              <span>No filler. No vague claims.</span>
            </h2>
            <div className="progress-rule" aria-hidden="true">
              <span />
            </div>
            <p>
              Bamboo fibre starts in fast-regenerating forests, then moves
              through closed-loop processing, careful spinning, and local
              garment testing before it becomes something you can wear every
              week.
            </p>
          </div>
          <figure className="weave-card">
            <img src={bambooWeave} alt="Close-up of bamboo fabric on a loom" />
            <figcaption>
              <strong>Origin: ISO-verified mill</strong>
              <span>
                Each batch is tested for softness, shrinkage, and color
                retention.
              </span>
            </figcaption>
          </figure>
        </section>

        <section className="timeline-section">
          <div className="section-heading centered">
            <p className="section-label">The process</p>
            <h2>
              Stalk to shirt -<span>six steps.</span>
            </h2>
          </div>
          <AnimatedList items={process} />
        </section>

        <section className="values-section">
          <p className="section-label centered-text">
            Verified by third parties - not our feelings
          </p>
          <div className="value-grid">
            {values.map(([title, text]) => (
              <article className="value-card" key={title}>
                <span aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <p className="section-label">Ready to feel it?</p>
          <h2>
            The fabric speaks
            <span>for itself.</span>
          </h2>
          <a className="cta-button" href="/shop">
            Shop the collection +
          </a>
        </section>
      </main>
      <Footer content={content} />
    </div>
  );
}

function AccountPage({
  navigate,
  cartCount,
  cartMessage,
  content,
  onOpenBag,
}: {
  navigate: (route: Route, hash?: string) => void;
  cartCount: number;
  cartMessage: string;
  content: Record<string, string>;
  onOpenBag: () => void;
}) {
  const recentOrders = [
    ["#INT-2047", "Bamboo Everyday Tee", "Delivered"],
    ["#INT-1988", "Relaxed Henley", "In transit"],
  ];

  return (
    <div className="page-shell account-page" data-name="Account page">
      <Nav
        active="account"
        navigate={navigate}
        cartCount={cartCount}
        cartMessage={cartMessage}
        onOpenBag={onOpenBag}
      />
      <main>
        <section className="account-hero">
          <div>
            <p className="section-label">Account</p>
            <h1>
              Your Intent,
              <span>kept simple.</span>
            </h1>
            <p>
              Sign in to track orders, save sizes, and keep your bamboo basics
              ready for the next drop.
            </p>
          </div>
          <div className="account-status">
            <span>Bag</span>
            <strong>{cartCount}</strong>
            <p>{cartMessage}</p>
          </div>
        </section>

        <section className="account-grid" aria-label="Account tools">
          <article className="account-panel sign-in-panel">
            <p className="section-label">Sign in</p>
            <h2>Continue with email</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <label>
                Email address
                <input type="email" placeholder="you@email.com" />
              </label>
              <button type="submit">Send sign-in link</button>
            </form>
            <p>
              Passwordless access keeps your order history and saved fit profile
              in one place.
            </p>
          </article>

          <article className="account-panel">
            <p className="section-label">Orders</p>
            <h2>Recent activity</h2>
            <div className="order-list">
              {recentOrders.map(([id, item, status]) => (
                <div className="order-row" key={id}>
                  <div>
                    <strong>{id}</strong>
                    <span>{item}</span>
                  </div>
                  <p>{status}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => navigate("/shop")}>
              Shop again
            </button>
          </article>

          <article className="account-panel">
            <p className="section-label">Fit profile</p>
            <h2>Saved sizes</h2>
            <div className="size-prefs">
              {["Tops M", "Henley M", "Bottoms L"].map((size) => (
                <span key={size}>{size}</span>
              ))}
            </div>
            <p>
              We will preselect these when you open a product, so repeat orders
              take less thinking.
            </p>
          </article>

          <article className="account-panel">
            <p className="section-label">Preferences</p>
            <h2>Drop alerts</h2>
            <div className="preference-list">
              <label>
                <input type="checkbox" defaultChecked />
                New bamboo tees
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                Restock reminders
              </label>
              <label>
                <input type="checkbox" />
                Care notes
              </label>
            </div>
          </article>
        </section>
      </main>
      <Footer content={content} />
    </div>
  );
}

function AdminPage({ navigate }: { navigate: (route: Route, hash?: string) => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setIsChecking(false);
      return;
    }

    let ignore = false;

    async function loadSession() {
      const { data } = await supabase!.auth.getSession();
      if (ignore) {
        return;
      }

      setSession(data.session);
      if (!data.session) {
        setIsChecking(false);
        return;
      }

      try {
        const profile = await fetchAdminProfile(data.session.user.id);
        setIsAdmin(profile?.role === "admin");
      } catch (error) {
        console.error("Admin profile check failed", error);
        setMessage("Could not verify admin access.");
      } finally {
        setIsChecking(false);
      }
    }

    loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setIsAdmin(false);
        setIsChecking(false);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="admin-shell">
        <section className="admin-auth-card">
          <p className="section-label">Admin setup</p>
          <h1>Connect Supabase first.</h1>
          <p>
            Add <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> to your environment, then run
            the SQL migration in Supabase.
          </p>
          <button type="button" onClick={() => navigate("/")}>
            Back to site
          </button>
        </section>
      </div>
    );
  }

  if (!session || !isAdmin || window.location.pathname === "/admin/login") {
    return (
      <AdminLogin
        isChecking={isChecking}
        message={message}
        onMessage={setMessage}
        onSuccess={(nextSession) => {
          setSession(nextSession);
          setIsAdmin(true);
          setIsChecking(false);
          window.history.replaceState({}, "", "/admin");
          navigate("/admin");
        }}
      />
    );
  }

  if (isChecking) {
    return (
      <div className="admin-shell">
        <section className="admin-auth-card">
          <p className="section-label">Admin</p>
          <h1>Checking access...</h1>
        </section>
      </div>
    );
  }

  return (
    <AdminDashboard
      onSignOut={async () => {
        await supabase?.auth.signOut();
        navigate("/admin/login");
      }}
    />
  );
}

function AdminLogin({
  isChecking,
  message,
  onMessage,
  onSuccess,
}: {
  isChecking: boolean;
  message: string;
  onMessage: (message: string) => void;
  onSuccess: (session: Session) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="admin-shell">
      <section className="admin-auth-card">
        <p className="section-label">Intent Admin</p>
        <h1>Sign in to manage the store.</h1>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!supabase) {
              return;
            }

            setIsSubmitting(true);
            onMessage("");
            try {
              const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
              });

              if (error || !data.session) {
                onMessage(error?.message ?? "Unable to sign in.");
                return;
              }

              const profile = await fetchAdminProfile(data.session.user.id);
              if (profile?.role !== "admin") {
                await supabase.auth.signOut();
                onMessage(
                  profile
                    ? "This account is not allowed to access admin."
                    : "No profile was found for this user. Check that the migration trigger ran, or create a profile row manually.",
                );
                return;
              }

              onSuccess(data.session);
            } catch (error) {
              console.error("Admin sign in failed", error);
              const message = readableError(error);
              onMessage(`${message}${adminLoginHint(message)}`);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" disabled={isSubmitting || isChecking}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          {message && <p className="admin-message">{message}</p>}
        </form>
      </section>
    </div>
  );
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<"products" | "content">("products");
  const [productsList, setProductsList] = useState<ProductDetail[]>([]);
  const [contentRows, setContentRows] = useState<CmsContentRow[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CmsProductInput>(emptyProduct);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [productRows, nextContent] = await Promise.all([
        fetchAllProducts(),
        fetchContentBlocks(),
      ]);
      setProductsList(productRows.map(mapCmsProduct));
      setContentRows(nextContent);
    } catch (error) {
      console.error("Failed to load admin data", error);
      setMessage("Could not load admin data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const publishedCount = productsList.filter(
    (product) => product.status !== "draft",
  ).length;
  const draftCount = productsList.filter(
    (product) => product.status === "draft",
  ).length;

  return (
    <div className="admin-shell admin-dashboard">
      <header className="admin-topbar">
        <div>
          <p className="section-label">Intent Admin</p>
          <h1>Store CMS</h1>
        </div>
        <div>
          <button type="button" onClick={loadAdminData}>
            Refresh
          </button>
          <button type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="admin-metrics">
        <article>
          <span>Published</span>
          <strong>{publishedCount}</strong>
        </article>
        <article>
          <span>Drafts</span>
          <strong>{draftCount}</strong>
        </article>
        <article>
          <span>Featured</span>
          <strong>{productsList.filter((product) => product.featured).length}</strong>
        </article>
        <article>
          <span>Content blocks</span>
          <strong>{contentRows.length}</strong>
        </article>
      </section>

      <div className="admin-tabs">
        <button
          className={activeTab === "products" ? "active" : undefined}
          type="button"
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={activeTab === "content" ? "active" : undefined}
          type="button"
          onClick={() => setActiveTab("content")}
        >
          Content
        </button>
      </div>

      {message && <p className="admin-message">{message}</p>}
      {isLoading ? (
        <section className="admin-panel">Loading admin data...</section>
      ) : activeTab === "products" ? (
        <AdminProducts
          productsList={productsList}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProduct}
          onSaved={async (notice) => {
            setMessage(notice);
            setSelectedProduct(emptyProduct);
            await loadAdminData();
          }}
        />
      ) : (
        <AdminContent
          rows={contentRows}
          onSaved={async (notice) => {
            setMessage(notice);
            await loadAdminData();
          }}
        />
      )}
    </div>
  );
}

function AdminProducts({
  productsList,
  selectedProduct,
  onSelectProduct,
  onSaved,
}: {
  productsList: ProductDetail[];
  selectedProduct: CmsProductInput;
  onSelectProduct: (product: CmsProductInput) => void;
  onSaved: (notice: string) => Promise<void>;
}) {
  return (
    <section className="admin-workspace">
      <aside className="admin-list">
        <button
          className="admin-new-button"
          type="button"
          onClick={() => onSelectProduct({ ...emptyProduct })}
        >
          + New product
        </button>
        {productsList.map((product) => (
          <button
            type="button"
            key={product.id ?? product.name}
            onClick={() => onSelectProduct(productToInput(product))}
          >
            <span>{product.name}</span>
            <small>{product.status ?? "published"} · {product.price}</small>
          </button>
        ))}
      </aside>
      <ProductEditor
        product={selectedProduct}
        onChange={onSelectProduct}
        onSaved={onSaved}
      />
    </section>
  );
}

function ProductEditor({
  product,
  onChange,
  onSaved,
}: {
  product: CmsProductInput;
  onChange: (product: CmsProductInput) => void;
  onSaved: (notice: string) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const update = <Key extends keyof CmsProductInput>(
    key: Key,
    value: CmsProductInput[Key],
  ) => onChange({ ...product, [key]: value });

  return (
    <form
      className="admin-panel product-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSaving(true);
        const productId = await upsertProduct(product);
        setIsSaving(false);
        await onSaved(product.id ? "Product updated." : `Product created: ${productId}`);
      }}
    >
      <div className="admin-form-heading">
        <div>
          <p className="section-label">Product</p>
          <h2>{product.id ? "Edit product" : "New product"}</h2>
        </div>
        {product.id && (
          <button
            className="danger-button"
            type="button"
            onClick={async () => {
              await deleteProduct(product.id!);
              await onSaved("Product deleted.");
            }}
          >
            Delete
          </button>
        )}
      </div>

      <div className="admin-form-grid">
        <label>
          Name
          <input
            value={product.name}
            onChange={(event) => update("name", event.target.value)}
            required
          />
        </label>
        <label>
          Category
          <select
            value={product.category}
            onChange={(event) => update("category", event.target.value)}
          >
            {["Tees", "Oversized", "Henleys", "Bottoms"].map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Price
          <input
            value={product.priceValue}
            onChange={(event) =>
              update(
                "priceValue",
                Number(event.target.value.replace(/[^\d]/g, "")),
              )
            }
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="2000"
            required
          />
        </label>
        <label>
          Compare at
          <input
            value={product.compareAt ?? ""}
            onChange={(event) => update("compareAt", event.target.value)}
            placeholder="₹1,990"
          />
        </label>
        <label>
          Badge
          <input
            value={product.badge ?? ""}
            onChange={(event) => update("badge", event.target.value)}
            placeholder="New"
          />
        </label>
        <label>
          Sort order
          <input
            value={product.sortOrder}
            onChange={(event) => update("sortOrder", Number(event.target.value))}
            type="number"
          />
        </label>
      </div>

      <label>
        Fit
        <input
          value={product.fit}
          onChange={(event) => update("fit", event.target.value)}
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={product.copy}
          onChange={(event) => update("copy", event.target.value)}
          required
        />
      </label>
      <div className="admin-form-grid">
        <label>
          Material
          <textarea
            value={product.material}
            onChange={(event) => update("material", event.target.value)}
          />
        </label>
        <label>
          Care
          <textarea
            value={product.care}
            onChange={(event) => update("care", event.target.value)}
          />
        </label>
      </div>

      <div className="admin-form-grid">
        <label>
          Image URL
          <input
            value={product.imageUrl}
            onChange={(event) => update("imageUrl", event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label>
          Upload image
          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              setIsUploading(true);
              const url = await uploadProductImage(file);
              update("imageUrl", url);
              setIsUploading(false);
            }}
          />
          {isUploading && <span className="admin-help">Uploading...</span>}
        </label>
      </div>

      <AdminArrayInput
        label="Sizes"
        values={product.sizes}
        onChange={(values) => update("sizes", values)}
        placeholder="XS, S, M, L, XL"
      />
      <AdminArrayInput
        label="Color names"
        values={product.colorNames}
        onChange={(values) => update("colorNames", values)}
        placeholder="Cream, Forest, Cedar"
      />
      <AdminArrayInput
        label="Color hex values"
        values={product.swatches}
        onChange={(values) => update("swatches", values)}
        placeholder="#f4efe6, #1a3528"
      />

      <div className="admin-inline-options">
        <label>
          Default size
          <input
            value={product.selectedSize}
            onChange={(event) => update("selectedSize", event.target.value)}
          />
        </label>
        <label>
          Status
          <select
            value={product.status}
            onChange={(event) =>
              update("status", event.target.value as "draft" | "published")
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={product.featured}
            onChange={(event) => update("featured", event.target.checked)}
          />
          Featured drop
        </label>
      </div>

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save product"}
      </button>
    </form>
  );
}

function AdminArrayInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  return (
    <label>
      {label}
      <input
        value={values.join(", ")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
        placeholder={placeholder}
      />
    </label>
  );
}

function AdminContent({
  rows,
  onSaved,
}: {
  rows: CmsContentRow[];
  onSaved: (notice: string) => Promise<void>;
}) {
  const editableRows =
    rows.length > 0
      ? rows
      : Object.entries(defaultContent).map(([key, body], index) => ({
          id: key,
          key,
          label: key,
          body,
          sort_order: index,
        }));

  return (
    <section className="admin-panel content-editor">
      <p className="section-label">Content</p>
      <h2>Edit storefront copy</h2>
      {editableRows.map((row) => (
        <ContentEditorRow row={row} key={row.id} onSaved={onSaved} />
      ))}
    </section>
  );
}

function ContentEditorRow({
  row,
  onSaved,
}: {
  row: CmsContentRow;
  onSaved: (notice: string) => Promise<void>;
}) {
  const [value, setValue] = useState(row.body);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form
      className="content-row"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSaving(true);
        await saveContentBlock(row.id, value, row.label);
        setIsSaving(false);
        await onSaved(`${row.label} updated.`);
      }}
    >
      <label>
        <span>{row.label}</span>
        <small>{row.key}</small>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

function Footer({ content = defaultContent }: { content?: Record<string, string> }) {
  return (
    <footer className="footer">
      <div className="footer-links">
        <div>
          <h3>Intent</h3>
          <p>{contentValue(content, "footer.tagline")}</p>
        </div>
        <div>
          <h3>Shop</h3>
          <a href="#tees">All Tees</a>
          <a href="#women">Slim Fit</a>
          <a href="#care">Oversized</a>
          <a href="#henley">Henleys</a>
          <a href="#cards">Gift Cards</a>
        </div>
        <div>
          <h3>Company</h3>
          <a href="/about">About Intent</a>
          <a href="#journal">Journal</a>
          <a href="#sustainability">Sustainability</a>
          <a href="#careers">Careers</a>
        </div>
        <div>
          <h3>Support</h3>
          <a href="#size">Size Guide</a>
          <a href="#shipping">Shipping & Returns</a>
          <a href="#care">Care Instructions</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
      <div className="newsletter">
        <div>
          <strong>Bamboo updates, twice a month.</strong>
          <span>No noise. Just drops, care tips, and forest stories.</span>
        </div>
        <form>
          <input
            aria-label="Email address"
            placeholder="your@email.com"
            type="email"
          />
          <button type="submit">Join</button>
        </form>
      </div>
      <div className="legal">
        <p>© 2025 Intent Clothing Pvt. Ltd. · Made in India</p>
        <div>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms</a>
          <a href="#certificate">OEKO-TEX Certificate</a>
        </div>
      </div>
      <div className="footer-pattern" aria-hidden="true" />
    </footer>
  );
}

export default App;

import { MouseEvent, useEffect, useState } from "react";
import Antigravity from "./Antigravity";
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

type Route = "/" | "/shop" | "/about";
type ShopFilter = "All" | "Tees" | "Oversized" | "Henleys" | "Bottoms";
type SortMode = "Featured" | "Price: Low";
type ProductDetail = {
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
};
type CartItem = ProductDetail & {
  id: string;
  size: string;
  color: string;
  quantity: number;
};

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

function normalizePath(pathname: string): Route {
  if (pathname === "/shop") {
    return "/shop";
  }

  return pathname === "/about" ? "/about" : "/";
}

function App() {
  const [route, setRoute] = useState<Route>(() =>
    normalizePath(window.location.pathname),
  );
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
        onOpenBag={() => setIsBagOpen(true)}
      />
    ) : route === "/shop" ? (
      <ShopPage
        navigate={navigate}
        cartCount={cartCount}
        cartMessage={cartMessage}
        onOpenBag={() => setIsBagOpen(true)}
        onOpenProduct={setSelectedProduct}
        onAddToCart={addToCart}
      />
    ) : (
      <HomePage
        navigate={navigate}
        cartCount={cartCount}
        cartMessage={cartMessage}
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
  active?: "shop" | "about" | "journal";
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
        <a
          className={active === "journal" ? "active" : undefined}
          href="#journal"
        >
          Journal
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
          className="account-button"
          aria-label="Account"
          type="button"
          onClick={() =>
            setTimeout(() => alert("Account sign-in is coming soon."), 0)
          }
        />
      </div>
    </nav>
  );
}

function HomePage({
  navigate,
  cartCount,
  cartMessage,
  onOpenBag,
  onOpenProduct,
  onAddToCart,
}: {
  navigate: (route: Route, hash?: string) => void;
  cartCount: number;
  cartMessage: string;
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
        active="shop"
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
            <p>100% Bamboo · Made for India</p>
            <h1>
              Forest to Body,
              <span>Body to Soul.</span>
            </h1>
            <span className="home-hero-lede">
              Bamboo-led basics for Indian heat.
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
          onOpenProduct={onOpenProduct}
          onAddToCart={onAddToCart}
        />

        <section className="collection-section" id="shop">
          <div className="collection-heading">
            <div>
              <p className="section-label">The collection</p>
              <h2>
                Basics that last,
                <span>heat that doesn't.</span>
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
            {products.slice(0, 3).map((product) => (
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
              We Started with a<span>Bamboo Stalk.</span>
            </h2>
            <p>
              Not a trend. Not a mood board. A single stalk of Moso bamboo that
              grows three feet per day without pesticides, without irrigation,
              without asking much of the earth at all.
            </p>
            <p>
              We asked what if fabric could carry that same softness, speed,
              efficiency, already where Intent is our answer. Worn daily across
              Delhi, Pune, Chennai. Built for Indian summers.
            </p>
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
      <Footer />
    </div>
  );
}

function ProductShowcase({
  onOpenProduct,
  onAddToCart,
}: {
  onOpenProduct: (product: ProductDetail) => void;
  onAddToCart: (
    product: ProductDetail,
    options?: { size?: string; color?: string; quantity?: number },
  ) => void;
}) {
  return (
    <section className="featured-drop" aria-labelledby="featured-title">
      <div className="leaf-field" aria-hidden="true" />
      <div className="antigravity-field" aria-hidden="true">
        <Antigravity
          count={180}
          magnetRadius={6}
          ringRadius={7}
          waveSpeed={0.32}
          waveAmplitude={0.8}
          particleSize={1.95}
          lerpSpeed={0.055}
          color="#1a3528"
          autoAnimate
          particleVariance={0.75}
          rotationSpeed={0.08}
          depthFactor={0.65}
          particleShape="capsule"
          fieldStrength={8}
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
  const sizes = ["XS", "S", "M", "L", "XL"];
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
  onOpenBag,
  onOpenProduct,
  onAddToCart,
}: {
  navigate: (route: Route, hash?: string) => void;
  cartCount: number;
  cartMessage: string;
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

  const visibleProducts = shopProducts
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
          <h1>The Full Collection</h1>
          <p>8 styles · Bamboo-led, India-built</p>
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
          <p className="shop-note">
            All Intent garments are OEKO-TEX Standard 100 certified. Free
            shipping across India on orders above ₹1,999.
          </p>
        </section>
      </main>
      <Footer />
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
  const sizes = ["S", "M", "L", "XL", "XXL"];
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
  onOpenBag,
}: {
  navigate: (route: Route, hash?: string) => void;
  cartCount: number;
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
                Built on one
                <span>honest question.</span>
              </h1>
              <p className="hero-lede" data-node-id="69:973">
                Why does sustainable clothing have to compromise on comfort -
                especially in a country that sits at 40°C for five months a
                year?
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
                <strong>22</strong>
                <span>Prototypes before launch</span>
              </div>
              <div>
                <strong>70/30</strong>
                <span>Bamboo cotton composition</span>
              </div>
              <div>
                <strong>3x</strong>
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
          <div className="timeline-grid">
            {process.map(([title, text], index) => (
              <article className="timeline-card" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
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
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <div>
          <h3>Intent</h3>
          <p>Plant-based essentials for hot Indian days.</p>
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

# DETAILED PRD: Kids' Clothing E-Store Bangladesh
## Test-Driven Development Approach with Loops & shadcn/ui
### For Junior Developer Implementation

---

## TABLE OF CONTENTS
1. [Quick Start for Junior Dev](#quick-start)
2. [Architecture Overview](#architecture)
3. [Component Specifications](#components)
4. [Database Schema & APIs](#database)
5. [Test-Driven Development Strategy](#testing)
6. [Iterative Development Phases](#phases)
7. [Code Examples & Implementation Guides](#code-examples)

---

## QUICK START FOR JUNIOR DEVELOPER {#quick-start}

### Prerequisites
- Node.js 18+ installed
- Basic React knowledge
- Git for version control
- Understanding of async/await

### Initial Setup (Day 1)
```bash
# Clone repo or create new
npx create-next-app@latest kids-store --typescript --tailwind

# Install dependencies
npm install zustand react-hook-form zod framer-motion
npm install @hookform/resolvers
npm install axios

# shadcn/ui setup
npx shadcn-ui@latest init

# Install Loops SDK
npm install loops

# For NocoDB API calls
npm install node-nocodb

# Dev dependencies for testing
npm install -D jest @testing-library/react @testing-library/jest-dom vitest

# Create environment file
touch .env.local
```

### Environment Variables (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NOCODB_API_URL=http://[your-nocodb-host]:8080
NOCODB_API_TOKEN=[your-token]
LOOPS_API_KEY=[your-loops-api-key]
BKASH_API_KEY=[from-bkash]
NAGAD_API_KEY=[from-nagad]
NEXT_PUBLIC_STORE_NAME=Kids Clothing Store
NEXT_PUBLIC_STORE_PHONE=+880XXXXXXXXXX
```

### Folder Structure (Day 1-2)
```
src/
├── app/
│   ├── page.tsx [Home]
│   ├── products/
│   │   ├── page.tsx [Listing]
│   │   └── [id]/
│   │       └── page.tsx [Detail]
│   ├── cart/
│   │   └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   ├── order/
│   │   └── [id]/
│   │       └── page.tsx [Tracking]
│   └── api/
│       ├── products/
│       │   └── route.ts
│       ├── orders/
│       │   └── route.ts
│       ├── payments/
│       │   └── route.ts
│       └── webhooks/
│           ├── bkash.ts
│           └── nagad.ts
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductDetail.tsx
│   │   └── ProductImages.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartDrawer.tsx
│   ├── checkout/
│   │   ├── DeliveryForm.tsx
│   │   ├── PaymentSelector.tsx
│   │   └── OrderSummary.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── Toast.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useCart.ts
│   ├── useProducts.ts
│   ├── useOrders.ts
│   └── usePayment.ts
├── lib/
│   ├── nocodb.ts [API client]
│   ├── loops.ts [Email service]
│   ├── bkash.ts [Payment gateway]
│   ├── nagad.ts [Payment gateway]
│   ├── validation.ts [Zod schemas]
│   └── utils.ts [Helpers]
├── store/
│   └── cart.ts [Zustand]
├── types/
│   └── index.ts [All TS types]
└── __tests__/
    ├── components/
    ├── hooks/
    └── lib/
```

---

## ARCHITECTURE OVERVIEW {#architecture}

### Technology Stack Explained
```
FRONTEND (Next.js 14)
├── UI Components: shadcn/ui (pre-built, accessible)
├── State Management: Zustand (lightweight cart state)
├── Forms: React Hook Form + Zod (validation)
├── Styling: Tailwind CSS
└── Animations: Framer Motion

BACKEND (Next.js API Routes)
├── NocoDB API (database operations)
├── Loops API (transactional emails)
├── bKash API (payment processing)
├── Nagad API (payment processing)
└── WhatsApp Business API (notifications)

DATABASE (NocoDB - Self-hosted)
├── Products table
├── Product Images
├── Product Inventory
├── Categories
├── Orders
└── Order Items

EXTERNAL SERVICES
├── Cloudinary (image CDN)
├── Meta WhatsApp Business (notifications)
├── Loops (transactional email)
└── bKash + Nagad (payments)
```

### Why This Stack for Junior Dev?
- **shadcn/ui**: Copy-paste components, no learning curve
- **Zustand**: Simple store logic (cart only)
- **React Hook Form**: Minimal bundle, great DX
- **Zod**: Type-safe validation that catches bugs early
- **Loops**: Email API simpler than SendGrid, better docs
- **NocoDB**: No SQL needed, REST API simple

---

## COMPONENT SPECIFICATIONS {#components}

### Rule: Components = Small + Testable + Reusable

Every component follows this pattern:
```typescript
// 1. Props interface
interface ComponentProps {
  prop1: string;
  onAction?: () => void;
}

// 2. Component definition
export const Component: React.FC<ComponentProps> = ({ prop1, onAction }) => {
  // 3. Logic
  return (
    // 4. JSX
  );
};

// 5. Tests below
```

---

### 1. PRODUCT COMPONENTS

#### 1.1 ProductCard.tsx (Reusable)
**What it does:** Displays single product in grid with image + price + size

**Props:**
```typescript
interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  sizes: string[];
  onAddToCart: (productId: string) => void;
  isLoading?: boolean;
}
```

**Implementation:**
```typescript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
  sizes,
  onAddToCart,
  isLoading = false,
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Container */}
      <div className="relative w-full h-48 bg-gray-200">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          priority={false}
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3 className="font-semibold text-base line-clamp-2">{name}</h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">৳{price}</span>
        </div>

        {/* Sizes */}
        <div className="text-xs text-gray-600">
          Sizes: {sizes.join(", ")}
        </div>

        {/* CTA */}
        <Button
          onClick={() => onAddToCart(id)}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Adding..." : "Add to Cart"}
        </Button>
      </div>
    </Card>
  );
};
```

**Test: ProductCard.test.tsx**
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCard } from "./ProductCard";

describe("ProductCard", () => {
  const mockProduct = {
    id: "1",
    name: "Baby Onesie",
    price: 500,
    image: "/onesie.jpg",
    sizes: ["6M", "12M"],
  };

  it("renders product name and price", () => {
    const mockFn = jest.fn();
    render(<ProductCard {...mockProduct} onAddToCart={mockFn} />);
    
    expect(screen.getByText("Baby Onesie")).toBeInTheDocument();
    expect(screen.getByText(/৳500/)).toBeInTheDocument();
  });

  it("calls onAddToCart when button clicked", () => {
    const mockFn = jest.fn();
    render(<ProductCard {...mockProduct} onAddToCart={mockFn} />);
    
    fireEvent.click(screen.getByText("Add to Cart"));
    expect(mockFn).toHaveBeenCalledWith("1");
  });

  it("shows loading state", () => {
    const mockFn = jest.fn();
    render(<ProductCard {...mockProduct} onAddToCart={mockFn} isLoading={true} />);
    
    expect(screen.getByText("Adding...")).toBeInTheDocument();
  });
});
```

#### 1.2 ProductGrid.tsx
**What it does:** Grid of products with responsive layout

```typescript
interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  isLoading,
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          onAddToCart={onAddToCart}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};
```

#### 1.3 ProductDetail.tsx
**What it does:** Full product page with images, size selector, quantity

```typescript
interface ProductDetailProps {
  product: Product;
  inventory: InventoryItem[];
  onAddToCart: (payload: {
    productId: string;
    size: string;
    color: string;
    quantity: number;
  }) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  inventory,
  onAddToCart,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      alert("Please select size and color");
      return;
    }

    setIsAdding(true);
    try {
      onAddToCart({
        productId: product.id,
        size: selectedSize,
        color: selectedColor,
        quantity,
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Images */}
      <div>
        <ProductImages images={product.images} />
      </div>

      {/* Info */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{product.name}</h1>

        <p className="text-2xl font-bold text-primary">৳{product.price}</p>

        <p className="text-gray-700">{product.description}</p>

        {/* Size Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Size</label>
          <div className="flex gap-2 flex-wrap">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 border rounded ${
                  selectedSize === size
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Color</label>
          <div className="flex gap-2 flex-wrap">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-4 py-2 border rounded ${
                  selectedColor === color
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="text-sm font-medium mb-2 block">Quantity</label>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </Button>
            <span className="w-12 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
            >
              +
            </Button>
          </div>
        </div>

        {/* Add to Cart */}
        <Button
          onClick={handleAddToCart}
          disabled={isAdding}
          size="lg"
          className="w-full"
        >
          {isAdding ? "Adding..." : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
};
```

---

### 2. CART COMPONENTS

#### 2.1 CartStore (Zustand)
**What it does:** Global cart state management (NOT redux - simpler!)

```typescript
// store/cart.ts
import { create } from "zustand";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find(
        (i) => i.productId === item.productId && i.size === item.size
      );

      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId && i.size === item.size
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }

      return { items: [...state.items, item] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    }));
  },

  clear: () => set({ items: [] }),

  total: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
```

**Test: cart.test.ts**
```typescript
import { renderHook, act } from "@testing-library/react";
import { useCart } from "./cart";

describe("Cart Store", () => {
  it("adds item to cart", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        size: "6M",
        color: "White",
        quantity: 1,
        image: "/onesie.jpg",
      });
    });

    expect(result.current.items).toHaveLength(1);
  });

  it("calculates total correctly", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({
        productId: "1",
        name: "Onesie",
        price: 500,
        size: "6M",
        color: "White",
        quantity: 2,
        image: "/onesie.jpg",
      });
    });

    expect(result.current.total()).toBe(1000);
  });
});
```

#### 2.2 CartItem.tsx
```typescript
interface CartItemProps {
  item: CartItem;
  onRemove: (productId: string) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onRemove,
  onQuantityChange,
}) => {
  return (
    <div className="flex gap-4 py-4 border-b">
      {/* Image */}
      <div className="relative w-20 h-20 bg-gray-100 rounded">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover rounded"
        />
      </div>

      {/* Details */}
      <div className="flex-1">
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-sm text-gray-600">Size: {item.size}</p>
        <p className="text-sm text-gray-600">Color: {item.color}</p>
        <p className="font-bold text-primary">৳{item.price}</p>
      </div>

      {/* Quantity & Remove */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
          >
            -
          </Button>
          <span className="w-8 text-center">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
          >
            +
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.productId)}
        >
          Remove
        </Button>
      </div>
    </div>
  );
};
```

---

### 3. CHECKOUT COMPONENTS

#### 3.1 DeliveryForm.tsx
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const deliverySchema = z.object({
  fullName: z.string().min(2, "Name required"),
  phone: z.string().regex(/^\+880\d{9}$/, "Valid BD phone required"),
  address: z.string().min(5, "Address required"),
  district: z.string().min(2, "District required"),
  specialInstructions: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

interface DeliveryFormProps {
  onSubmit: (data: DeliveryFormData) => void;
  isLoading?: boolean;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Full Name</label>
        <Input
          {...register("fullName")}
          placeholder="Your full name"
          className="mt-1"
        />
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Phone Number</label>
        <Input
          {...register("phone")}
          placeholder="+880XXXXXXXXX"
          className="mt-1"
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Delivery Address</label>
        <Textarea
          {...register("address")}
          placeholder="Street address, building, flat number"
          className="mt-1"
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">District</label>
        <select
          {...register("district")}
          className="w-full border rounded px-3 py-2 mt-1"
        >
          <option value="">Select district</option>
          <option value="Dhaka">Dhaka</option>
          <option value="Chattogram">Chattogram</option>
          <option value="Sylhet">Sylhet</option>
          <option value="Khulna">Khulna</option>
          <option value="Barishal">Barishal</option>
          <option value="Rajshahi">Rajshahi</option>
          <option value="Rangpur">Rangpur</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Special Instructions</label>
        <Textarea
          {...register("specialInstructions")}
          placeholder="Any special delivery instructions?"
          className="mt-1"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Processing..." : "Continue to Payment"}
      </Button>
    </form>
  );
};
```

#### 3.2 PaymentSelector.tsx
```typescript
interface PaymentSelectorProps {
  selectedMethod: "bkash" | "nagad" | null;
  onSelect: (method: "bkash" | "nagad") => void;
  isProcessing?: boolean;
}

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  selectedMethod,
  onSelect,
  isProcessing,
}) => {
  return (
    <div className="space-y-3">
      <p className="font-semibold">Select Payment Method</p>

      {/* bKash Option */}
      <label className="flex gap-3 p-4 border rounded cursor-pointer hover:bg-gray-50">
        <input
          type="radio"
          name="payment"
          value="bkash"
          checked={selectedMethod === "bkash"}
          onChange={() => onSelect("bkash")}
          disabled={isProcessing}
        />
        <div>
          <p className="font-medium">bKash</p>
          <p className="text-sm text-gray-600">
            Fast & secure mobile payment
          </p>
        </div>
      </label>

      {/* Nagad Option */}
      <label className="flex gap-3 p-4 border rounded cursor-pointer hover:bg-gray-50">
        <input
          type="radio"
          name="payment"
          value="nagad"
          checked={selectedMethod === "nagad"}
          onChange={() => onSelect("nagad")}
          disabled={isProcessing}
        />
        <div>
          <p className="font-medium">Nagad</p>
          <p className="text-sm text-gray-600">
            Mobile banking service from Nagad
          </p>
        </div>
      </label>
    </div>
  );
};
```

---

## DATABASE SCHEMA & APIs {#database}

### NocoDB Tables

#### Table 1: products
```json
{
  "id": "string (Primary Key, Auto)",
  "name": "string (required)",
  "description": "text",
  "price": "number (required)",
  "original_price": "number (optional)",
  "category": "link to categories",
  "brand": "string",
  "sizes": "multi-select: [6M, 12M, 2Y, 3Y, 4Y, 5Y]",
  "colors": "multi-select: [White, Black, Pink, Blue, etc.]",
  "material": "string",
  "care_instructions": "text",
  "is_active": "boolean (default: true)",
  "stock_status": "select: [In Stock, Low Stock, Out of Stock]",
  "created_at": "datetime (auto)",
  "updated_at": "datetime (auto)"
}
```

#### Table 2: product_inventory
```json
{
  "id": "string (Primary Key, Auto)",
  "product_id": "link to products",
  "size": "string",
  "color": "string",
  "stock_qty": "number",
  "low_stock_threshold": "number (default: 5)",
  "updated_at": "datetime (auto)"
}
```

#### Table 3: product_images
```json
{
  "id": "string (Primary Key, Auto)",
  "product_id": "link to products (required)",
  "image_url": "string (URL, required)",
  "display_order": "number (1, 2, 3...)",
  "is_primary": "boolean (default: false)"
}
```

#### Table 4: categories
```json
{
  "id": "string (Primary Key, Auto)",
  "name": "string (required)",
  "icon": "string (emoji)",
  "display_order": "number"
}
```

#### Table 5: orders
```json
{
  "id": "string (Primary Key, format: ORD-[timestamp])",
  "customer_name": "string (required)",
  "customer_phone": "string (E.164, required)",
  "customer_email": "string (required for Loops)",
  "customer_address": "text (required)",
  "customer_district": "string",
  "special_instructions": "text",
  "total_amount": "number (in ৳)",
  "payment_method": "select: [bKash, Nagad]",
  "payment_status": "select: [pending, completed, failed]",
  "payment_id": "string (transaction ID)",
  "order_status": "select: [pending, confirmed, shipped, delivered, cancelled]",
  "notes": "text (internal)",
  "created_at": "datetime (auto)",
  "updated_at": "datetime (auto)",
  "whatsapp_sent": "boolean (default: false)",
  "email_sent": "boolean (default: false)"
}
```

#### Table 6: order_items
```json
{
  "id": "string (Primary Key, Auto)",
  "order_id": "link to orders (required)",
  "product_id": "link to products (required)",
  "product_name": "string (denormalized)",
  "product_price": "number",
  "size": "string",
  "color": "string",
  "quantity": "number",
  "subtotal": "number"
}
```

---

### API Client (lib/nocodb.ts)
```typescript
import axios, { AxiosInstance } from "axios";

const API_URL = process.env.NOCODB_API_URL;
const API_TOKEN = process.env.NOCODB_API_TOKEN;

class NocoDB {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "xc-auth": API_TOKEN,
      },
    });
  }

  // Products
  async getProducts(filters?: Record<string, any>) {
    const response = await this.client.get("/nc/[project-id]/api/v1/products", {
      params: filters,
    });
    return response.data.list;
  }

  async getProductById(id: string) {
    return this.client.get(
      `/nc/[project-id]/api/v1/products/${id}`
    );
  }

  async createProduct(data: any) {
    return this.client.post("/nc/[project-id]/api/v1/products", data);
  }

  // Orders
  async createOrder(data: any) {
    return this.client.post("/nc/[project-id]/api/v1/orders", data);
  }

  async getOrder(id: string) {
    return this.client.get(`/nc/[project-id]/api/v1/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.client.put(`/nc/[project-id]/api/v1/orders/${id}`, {
      order_status: status,
    });
  }

  // Inventory
  async getInventory(productId: string) {
    return this.client.get(
      `/nc/[project-id]/api/v1/product_inventory?product_id=${productId}`
    );
  }

  async updateInventory(inventoryId: string, quantity: number) {
    return this.client.put(
      `/nc/[project-id]/api/v1/product_inventory/${inventoryId}`,
      { stock_qty: quantity }
    );
  }
}

export const nocodb = new NocoDB();
```

---

## TEST-DRIVEN DEVELOPMENT STRATEGY {#testing}

### TDD Workflow (For Junior Dev)
1. **Write failing test** (RED)
2. **Write minimal code** to pass test (GREEN)
3. **Refactor** if needed (REFACTOR)
4. **Repeat**

### Testing Pyramid
```
        🔺 E2E Tests (5%)
       /   \
      / 15% \
     / Unit + Integration\
    /__________________\  \
   / Component Tests (50%) \ \
  /_________________ \  \
 / Utility & Hook Tests (30%)
/___________________________\
```

### Test Setup (vitest.config.ts)
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/__tests__/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});
```

### Example: Test-Driven Button Component

**Step 1: Write failing test**
```typescript
// Button.test.tsx
describe("Button Component", () => {
  it("should render with children text", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText("Click"));
    expect(handleClick).toHaveBeenCalled();
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should show loading state", () => {
    render(<Button isLoading>Click</Button>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
```

**Step 2: Write minimal component** (shadcn Button)
```typescript
// Button.tsx (already provided by shadcn)
import { Button as ShadcnButton } from "@/components/ui/button";

export const Button = ShadcnButton;
```

**Step 3: Run tests, verify passing**
```bash
npm run test -- Button.test.tsx
```

---

## ITERATIVE DEVELOPMENT PHASES {#phases}

### ⏱️ PHASE 1: FOUNDATION (Days 1-4) - TDD Strict
**Goal:** Core structure + Product listing (no payments)

**Daily Breakdown:**

**Day 1:**
- [ ] Setup project structure + dependencies
- [ ] Create ProductCard component + tests
- [ ] Create ProductGrid component + tests
- [ ] Test coverage: > 80%

**Day 2:**
- [ ] Create NocoDB client (lib/nocodb.ts)
- [ ] Create useProducts hook + tests
- [ ] Create /api/products route
- [ ] Test: fetch and display 10 products

**Day 3:**
- [ ] Create ProductDetail page
- [ ] Size/color selector logic + tests
- [ ] Create Zustand cart store + tests
- [ ] Test: add item to cart

**Day 4:**
- [ ] Polish mobile responsiveness
- [ ] Page speed optimization
- [ ] Lighthouse audit (target >90)
- [ ] Deploy to Vercel

**Deliverable:**
- Fully functional product browsing
- Working shopping cart
- Mobile-optimized
- No payment yet

---

### ⏱️ PHASE 2: CHECKOUT (Days 5-6) - TDD Medium

**Goal:** Checkout form + Order creation (still no payments)

**Day 5:**
- [ ] Create DeliveryForm component + tests
- [ ] Zod schema + validation tests
- [ ] Create /api/orders POST route
- [ ] NocoDB order creation

**Day 6:**
- [ ] OrderSummary component + tests
- [ ] Checkout page assembly
- [ ] Order confirmation page
- [ ] Email integration (Loops - dry run)
- [ ] Deploy

**Deliverable:**
- Complete checkout flow
- Orders saved to NocoDB
- Ready for payment integration

---

### ⏱️ PHASE 3: PAYMENTS (Days 7-8) - TDD Relaxed

**Goal:** bKash + Nagad payment processing

**Day 7:**
- [ ] PaymentSelector component + tests
- [ ] bKash API integration (lib/bkash.ts)
- [ ] /api/payments/bkash route
- [ ] Payment webhook handling

**Day 8:**
- [ ] Nagad API integration
- [ ] Payment status updates
- [ ] Error handling + retries
- [ ] Test with bKash/Nagad sandbox

**Deliverable:**
- Full payment flow working
- Order status updated after payment
- Ready for Loops + WhatsApp

---

### ⏱️ PHASE 4: NOTIFICATIONS (Days 9-10) - TDD Minimal

**Goal:** Loops emails + WhatsApp messages

**Day 9:**
- [ ] Loops SDK setup (lib/loops.ts)
- [ ] Email templates in Loops dashboard
- [ ] Send order confirmation email
- [ ] Send admin notification email

**Day 10:**
- [ ] WhatsApp Business API setup
- [ ] Send WhatsApp order confirmation
- [ ] Send WhatsApp admin notification
- [ ] Test end-to-end with real account

**Deliverable:**
- Fully functional e-store
- Payments working
- Notifications working
- Ready for beta testing

---

### ⏱️ PHASE 5: ADMIN DASHBOARD (Days 11-12) - Bonus

**Goal:** Simple admin interface

**Day 11:**
- [ ] Orders management page
- [ ] Order status update buttons
- [ ] Products CRUD (basic)

**Day 12:**
- [ ] Inventory alerts
- [ ] Analytics dashboard
- [ ] Settings page

---

## CODE EXAMPLES & IMPLEMENTATION GUIDES {#code-examples}

### Example 1: Complete Checkout Flow

**checkout/page.tsx**
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { DeliveryForm } from "@/components/checkout/DeliveryForm";
import { PaymentSelector } from "@/components/checkout/PaymentSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import axios from "axios";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();

  const [step, setStep] = useState<"delivery" | "payment" | "confirm">(
    "delivery"
  );
  const [deliveryData, setDeliveryData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const handleDeliverySubmit = async (data: any) => {
    setDeliveryData(data);
    setStep("payment");
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert("Select payment method");
      return;
    }

    setIsLoading(true);
    try {
      // Create order
      const orderResponse = await axios.post("/api/orders", {
        ...deliveryData,
        items: cart.items,
        total_amount: cart.total(),
        payment_method: paymentMethod,
      });

      const orderId = orderResponse.data.id;
      setOrderData(orderResponse.data);

      // Process payment
      const paymentResponse = await axios.post(
        `/api/payments/${paymentMethod}`,
        {
          orderId,
          amount: cart.total(),
        }
      );

      // Redirect to payment portal
      window.location.href = paymentResponse.data.paymentUrl;
    } catch (error) {
      alert("Error creating order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          {step === "delivery" && (
            <DeliveryForm onSubmit={handleDeliverySubmit} />
          )}

          {step === "payment" && (
            <div className="space-y-6">
              <PaymentSelector
                selectedMethod={paymentMethod}
                onSelect={setPaymentMethod}
                isProcessing={isLoading}
              />
              <button
                onClick={handlePayment}
                disabled={!paymentMethod || isLoading}
                className="w-full bg-primary text-white py-2 rounded"
              >
                {isLoading ? "Processing..." : "Pay Now"}
              </button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <OrderSummary items={cart.items} total={cart.total()} />
        </div>
      </div>
    </div>
  );
}
```

**api/orders/route.ts**
```typescript
import { nocodb } from "@/lib/nocodb";
import { loopsClient } from "@/lib/loops";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    if (!body.customer_name || !body.customer_phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create order in NocoDB
    const orderResponse = await nocodb.createOrder({
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email,
      customer_address: body.customer_address,
      customer_district: body.customer_district,
      total_amount: body.total_amount,
      payment_method: body.payment_method,
      payment_status: "pending",
      order_status: "pending",
    });

    const orderId = orderResponse.data.id;

    // Add order items
    for (const item of body.items) {
      await nocodb.createOrderItem({
        order_id: orderId,
        product_id: item.productId,
        product_name: item.name,
        product_price: item.price,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      });
    }

    // Queue email (Loops)
    await loopsClient.sendTransactionalEmail({
      email: body.customer_email,
      transactionalId: "order-created",
      dataVariables: {
        orderId,
        customerName: body.customer_name,
        total: body.total_amount,
        items: body.items,
      },
    });

    return NextResponse.json({ id: orderId });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
```

**lib/loops.ts**
```typescript
import axios from "axios";

const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const LOOPS_API_URL = "https://app.loops.so/api/v1";

class LoopsClient {
  private client = axios.create({
    baseURL: LOOPS_API_URL,
    headers: {
      Authorization: `Bearer ${LOOPS_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  async sendTransactionalEmail({
    email,
    transactionalId,
    dataVariables,
  }: {
    email: string;
    transactionalId: string;
    dataVariables: Record<string, any>;
  }) {
    return this.client.post("/transactional/send", {
      email,
      transactionalId,
      dataVariables,
    });
  }

  async addContact({
    email,
    firstName,
    lastName,
    userGroup,
  }: {
    email: string;
    firstName: string;
    lastName?: string;
    userGroup?: string;
  }) {
    return this.client.post("/contacts/create", {
      email,
      firstName,
      lastName,
      userGroup,
      source: "app",
    });
  }
}

export const loopsClient = new LoopsClient();
```

---

### Example 2: Test-Driven Product Fetching Hook

**hooks/useProducts.ts**
```typescript
import { useEffect, useState } from "react";
import axios from "axios";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  sizes: string[];
}

export const useProducts = (categoryId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/products", {
          params: { category: categoryId },
        });
        setProducts(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch products");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  return { products, isLoading, error };
};
```

**hooks/useProducts.test.ts**
```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useProducts } from "./useProducts";
import axios from "axios";

jest.mock("axios");

describe("useProducts Hook", () => {
  it("fetches and returns products", async () => {
    const mockProducts = [
      { id: "1", name: "Onesie", price: 500, image: "/onesie.jpg", sizes: ["6M"] },
    ];

    (axios.get as jest.Mock).mockResolvedValue({ data: mockProducts });

    const { result } = renderHook(() => useProducts());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.error).toBeNull();
  });

  it("handles fetch error", async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch products");
    expect(result.current.products).toEqual([]);
  });
});
```

---

### Example 3: Validation Schema

**lib/validation.ts**
```typescript
import { z } from "zod";

// Phone validation for Bangladesh
const bangladeshPhoneRegex = /^\+880\d{9}$/;

export const orderSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters"),
  customer_phone: z
    .string()
    .regex(bangladeshPhoneRegex, "Valid BD phone required (+880XXXXXXXXX)"),
  customer_email: z.string().email("Valid email required"),
  customer_address: z.string().min(5, "Address must be at least 5 characters"),
  customer_district: z.string().min(1, "Select a district"),
  special_instructions: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        size: z.string(),
        color: z.string(),
      })
    )
    .min(1, "Cart must have at least one item"),
  total_amount: z.number().min(100, "Minimum order: ৳100"),
});

export type Order = z.infer<typeof orderSchema>;
```

---

### Example 4: Running Tests

**package.json scripts**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "lint": "eslint src/",
    "format": "prettier --write 'src/**/*.{ts,tsx}'"
  }
}
```

**Running tests:**
```bash
# Run all tests once
npm run test

# Watch mode (run on file change)
npm run test:watch

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

---

## COMMON PITFALLS FOR JUNIOR DEV

### ❌ DON'T DO THIS

```typescript
// ❌ TOO MUCH in one component
export const CheckoutPage = () => {
  const [customer, setCustomer] = useState({});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  // ... 500 lines of code
  return <div>{/* Everything here */}</div>;
};

// ❌ Fetching data directly in component
export const ProductList = () => {
  useEffect(() => {
    fetch("/api/products").then(...);
  }, []);
};

// ❌ No error handling
async function createOrder(data) {
  const response = await fetch("/api/orders", { method: "POST", body: JSON.stringify(data) });
  return response.json(); // What if response is not OK?
}

// ❌ Complex conditions in JSX
return (
  <>
    {isLoading && !error && products.length > 0 && user.isLoggedIn && (
      <ProductCard />
    )}
  </>
);
```

### ✅ DO THIS INSTEAD

```typescript
// ✅ Small, focused component
interface CheckoutPageProps {
  onSubmit: (data: OrderData) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onSubmit }) => {
  // Only checkout logic here
  return (
    <div>
      <DeliveryForm onSubmit={onSubmit} />
    </div>
  );
};

// ✅ Use custom hook
export const ProductList = () => {
  const { products, isLoading, error } = useProducts();

  if (error) return <ErrorMessage />;
  if (isLoading) return <Spinner />;
  return <ProductGrid products={products} />;
};

// ✅ Proper error handling
async function createOrder(data) {
  const response = await fetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create order: ${response.statusText}`);
  }

  return response.json();
}

// ✅ Clear, readable conditionals
const shouldShowProduct = isLoading === false && error === null;
return shouldShowProduct && <ProductCard />;
```

---

## DEBUGGING GUIDE

### Common Issues & Fixes

**Issue 1: Components not rendering**
```typescript
// Check 1: Is component exported?
export const ProductCard = () => {}; // ✅
const ProductCard = () => {}; // ❌

// Check 2: Are props correct type?
interface Props { items: Product[] }
// In parent: <Component items={cart.items} /> ✅
// NOT: <Component items={cart} /> ❌
```

**Issue 2: API not returning data**
```typescript
// Add logging
console.log("Fetching from:", `/api/products?category=${categoryId}`);
console.log("Response:", response.data);

// Check NocoDB API token
// Check table/column names match exactly
```

**Issue 3: Tests failing**
```bash
# Run single test file
npm run test -- ProductCard.test.tsx

# See what's expected vs actual
# Read error message carefully

# Use --reporter=verbose for more details
npm run test -- --reporter=verbose
```

---

## CHECKLIST FOR JUNIOR DEVELOPER

### Before Each Day's Work
- [ ] Pull latest code from repo
- [ ] Run `npm install` (if dependencies changed)
- [ ] Run `npm run test` (all tests passing?)
- [ ] Check Figma/design for component specs

### During Development
- [ ] Write test first (RED)
- [ ] Write minimal code (GREEN)
- [ ] Refactor if needed (REFACTOR)
- [ ] Run `npm run test:watch` in background
- [ ] Commit frequently (`git commit -m "test: add ProductCard tests"`)

### Before Pushing Code
- [ ] All tests passing: `npm run test`
- [ ] No console errors
- [ ] Mobile looks good: `npm run dev` → resize browser
- [ ] Code formatted: `npm run format`
- [ ] No TypeScript errors: `npm run build`

### Code Review Checklist
- [ ] Does it have tests?
- [ ] Are edge cases handled?
- [ ] Is error handling present?
- [ ] Are components small enough?
- [ ] Are props well-typed?
- [ ] Does it work on mobile?

---

## GETTING HELP

### When Stuck:

1. **Check the error message first** (React errors are usually helpful)
2. **Google the error** + "React" (99% of questions are answered)
3. **Check NocoDB docs** for API structure
4. **Console.log everything** to debug
5. **Ask your senior dev** (after trying above 4 things)

### Useful Resources:
- React Docs: https://react.dev
- Next.js Docs: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com
- Zod: https://zod.dev
- Testing Library: https://testing-library.com
- Loops Docs: https://docs.loops.so

---

## SUCCESS METRICS

### By End of Phase 1 (Day 4):
- ✅ Product listing works
- ✅ Can add to cart
- ✅ Mobile responsive
- ✅ 80%+ test coverage
- ✅ Lighthouse score >90

### By End of Phase 2 (Day 6):
- ✅ Checkout form complete
- ✅ Orders saved to NocoDB
- ✅ Confirmation page works
- ✅ All tests passing

### By End of Phase 3 (Day 8):
- ✅ Payments working (sandbox)
- ✅ Orders get paid status
- ✅ No payment bugs

### By End of Phase 4 (Day 10):
- ✅ Emails sending
- ✅ WhatsApp notifications
- ✅ Full e-store working
- ✅ Ready for users

---

**This PRD is designed to be:**
- ✅ Clear and actionable for junior dev
- ✅ Test-driven from day one
- ✅ Iterative (small daily deliverables)
- ✅ Component-focused (shadcn/ui)
- ✅ Error-safe (validation + error handling)
- ✅ Email-integrated (Loops)
- ✅ Bangladesh-optimized (bKash + Nagad + WhatsApp)

**Good luck! 🚀**
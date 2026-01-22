I will build a professional-grade UI for the Kids Store using Next.js, Tailwind CSS, and shadcn/ui, following best UX practices.

### 1. Setup & Configuration
- **Initialize shadcn/ui**: Configure with standard settings (CSS variables, Slate color).
- **Install Dependencies**: `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **Install Components**: Button, Card, Input, Label, Sheet (Cart), Carousel (Hero), Badge, Separator, Navigation Menu, Form, Select.

### 2. Design & Theming (UI/UX Pro Max)
- **Consult UI/UX Skill**: Use `ui-ux-pro-max` to generate a playful yet professional color palette and typography system suitable for a kids' store.
- **Apply Theme**: Update `tailwind.config.js` and `globals.css` with the generated design tokens.

### 3. Data & Assets
- **Demo Data**: Create `lib/demo-data.ts` with structured product data (categories, prices, descriptions).
- **Images**: Use **Pexels MCP** to fetch high-quality, royalty-free images for:
  - Hero banners (kids playing, fashion).
  - Product categories (toys, clothing, accessories).
  - Product thumbnails.

### 4. UI Implementation
- **Layout (`layout.tsx`)**:
  - **Header**: Responsive navigation with a "Cart Drawer" (Sheet).
  - **Footer**: Standard links and newsletter signup.
- **Home Page (`page.tsx`)**:
  - **Hero Section**: Full-width carousel with call-to-action.
  - **Featured Categories**: Visual grid using Cards.
  - **Trending Products**: Horizontal scroll or grid.
- **Product Listing (`/products`)**:
  - Grid view with sidebar filters (Price, Category).
  - Product Cards with hover effects and "Quick Add".
- **Product Detail (`/products/[id]`)**:
  - Image gallery.
  - Size/Color selectors.
  - Sticky "Add to Cart" bar on mobile.
- **Cart & Checkout**:
  - Slide-out Cart Drawer.
  - Multi-step Checkout form (Shipping -> Payment).

### 5. Verification
- Verify all routes and user flows (Browse -> Add to Cart -> Checkout).
- Ensure mobile responsiveness.

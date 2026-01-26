export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  sizes: string[];
  colors: string[];
  isNew?: boolean;
  isSale?: boolean;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
}

export const categories: Category[] = [
  {
    id: "boys",
    name: "Boys Collection",
    image: "https://images.pexels.com/photos/1620753/pexels-photo-1620753.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: 120,
  },
  {
    id: "girls",
    name: "Girls Collection",
    image: "https://images.pexels.com/photos/5560013/pexels-photo-5560013.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: 145,
  },
  {
    id: "toddlers",
    name: "Toddlers & Baby",
    image: "https://images.pexels.com/photos/4715315/pexels-photo-4715315.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: 85,
  },
  {
    id: "accessories",
    name: "Accessories",
    image: "https://images.pexels.com/photos/4715311/pexels-photo-4715311.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: 40,
  },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Casual Chic Set",
    description: "A comfortable and stylish set for everyday wear. Made from soft, breathable cotton.",
    price: 1250,
    category: "girls",
    image: "https://images.pexels.com/photos/32985956/pexels-photo-32985956.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    rating: 4.8,
    reviews: 124,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Pink", "White"],
    isNew: true,
  },
  {
    id: "2",
    name: "Blue Hoodie Essentials",
    description: "Keep them warm and cool with this vibrant blue hoodie. Perfect for active kids.",
    price: 1800,
    category: "boys",
    image: "https://images.pexels.com/photos/34043973/pexels-photo-34043973.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    rating: 4.9,
    reviews: 89,
    sizes: ["M", "L", "XL"],
    colors: ["Blue", "Navy"],
    isSale: true,
  },
  {
    id: "3",
    name: "Nautical Stripe Tee",
    description: "Classic stripes for a timeless look. Durable and easy to wash.",
    price: 850,
    category: "boys",
    image: "https://images.pexels.com/photos/1620753/pexels-photo-1620753.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    rating: 4.6,
    reviews: 56,
    sizes: ["S", "M", "L"],
    colors: ["White/Blue", "Red/White"],
  },
  {
    id: "4",
    name: "Cozy Green Knit Sweater",
    description: "Hand-knit feel with modern comfort. Ideal for chilly evenings.",
    price: 2200,
    category: "boys",
    image: "https://images.pexels.com/photos/5559989/pexels-photo-5559989.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    rating: 4.7,
    reviews: 210,
    sizes: ["M", "L"],
    colors: ["Green", "Brown"],
    isNew: true,
  },
  {
    id: "5",
    name: "Striped Play Dress",
    description: "Fun and frolic ready! This dress moves with your child.",
    price: 1500,
    category: "girls",
    image: "https://images.pexels.com/photos/2744153/pexels-photo-2744153.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    rating: 4.5,
    reviews: 78,
    sizes: ["S", "M", "L"],
    colors: ["Red/White", "Black/White"],
  },
  {
    id: "6",
    name: "Everyday Gray Tee",
    description: "The staple every wardrobe needs. Soft, durable, and versatile.",
    price: 600,
    category: "boys",
    image: "https://images.pexels.com/photos/9554842/pexels-photo-9554842.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    rating: 4.4,
    reviews: 45,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Gray", "Black"],
  },
  {
    id: "7",
    name: "Animal Print Pajamas",
    description: "Sleep in style and comfort. 100% organic cotton.",
    price: 1350,
    category: "toddlers",
    image: "https://images.pexels.com/photos/18863554/pexels-photo-18863554.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    rating: 4.9,
    reviews: 312,
    sizes: ["2T", "3T", "4T"],
    colors: ["Leopard", "Zebra"],
    isSale: true,
  },
  {
    id: "8",
    name: "Purple Party Dress",
    description: "Shine at any event with this beautiful purple dress.",
    price: 2500,
    category: "girls",
    image: "https://images.pexels.com/photos/32063800/pexels-photo-32063800.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    rating: 4.8,
    reviews: 92,
    sizes: ["S", "M", "L"],
    colors: ["Purple", "Pink"],
  },
];

export const productImageSets: Record<string, Array<{ url: string; alt: string }>> = {
  "1": [
    {
      url: "https://images.pexels.com/photos/32985956/pexels-photo-32985956.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Adorable toddler in a pink dress outdoors"
    }
  ],
  "2": [
    {
      url: "https://images.pexels.com/photos/34043973/pexels-photo-34043973.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Child in a blue hoodie against a vivid background"
    },
    {
      url: "https://images.pexels.com/photos/6093535/pexels-photo-6093535.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Young boy in blue activewear posing outdoors"
    }
  ],
  "3": [
    {
      url: "https://images.pexels.com/photos/1620753/pexels-photo-1620753.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Young boy wearing a nautical themed outfit"
    }
  ],
  "4": [
    {
      url: "https://images.pexels.com/photos/5559989/pexels-photo-5559989.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Child in a cozy green knit sweater on a white background"
    },
    {
      url: "https://images.pexels.com/photos/15076977/pexels-photo-15076977.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Boy wearing a green sweater standing against a wooden wall"
    }
  ],
  "5": [
    {
      url: "https://images.pexels.com/photos/2744153/pexels-photo-2744153.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Girl wearing a striped dress at an outdoor party"
    },
    {
      url: "https://images.pexels.com/photos/9358556/pexels-photo-9358556.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Toddler in a striped dress in a studio setting"
    }
  ],
  "6": [
    {
      url: "https://images.pexels.com/photos/9554842/pexels-photo-9554842.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Smiling child posing in a gray outfit"
    },
    {
      url: "https://images.pexels.com/photos/30683087/pexels-photo-30683087.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Portrait of a child in gray attire against a neutral background"
    }
  ],
  "7": [
    {
      url: "https://images.pexels.com/photos/18863554/pexels-photo-18863554.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Child posing in animal print pajamas"
    },
    {
      url: "https://images.pexels.com/photos/29857199/pexels-photo-29857199.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Child wearing elephant print pajamas in a studio"
    }
  ],
  "8": [
    {
      url: "https://images.pexels.com/photos/32063800/pexels-photo-32063800.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Toddler celebrating a first birthday in a purple dress"
    },
    {
      url: "https://images.pexels.com/photos/29690077/pexels-photo-29690077.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
      alt: "Happy toddler in a tutu at a birthday celebration"
    }
  ]
};

export const heroSlides = [
  {
    id: 1,
    title: "Playful Styles for Happy Kids",
    subtitle: "Discover the latest collection for this season",
    image: "https://images.pexels.com/photos/5560083/pexels-photo-5560083.jpeg?auto=compress&cs=tinysrgb&w=1200",
    cta: "Shop Now",
    link: "/products",
  },
  {
    id: 2,
    title: "Cozy Comfort for Every Day",
    subtitle: "Soft fabrics that let them move freely",
    image: "https://images.pexels.com/photos/5893865/pexels-photo-5893865.jpeg?auto=compress&cs=tinysrgb&w=1200",
    cta: "View Collection",
    link: "/products?category=boys",
  },
];

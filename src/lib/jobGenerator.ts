// Procedural job (product) generator. Combines a curated name pool with
// platforms + random images to spawn unique-seeming review jobs on demand.
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = ["Jumia", "Kilimall", "Amazon", "Jiji", "Masoko", "Carrefour"];
const CATEGORIES = ["Electronics", "Fashion", "Home & Living", "Beauty", "Groceries"];

const BRANDS = [
  "Samsung","Apple","Tecno","Infinix","Itel","Oraimo","HP","Dell","Lenovo","Asus",
  "LG","Sony","Bose","JBL","Anker","Xiaomi","Huawei","Nokia","Vivo","Realme",
  "Nivea","Garnier","L'Oreal","Maybelline","Dove","Colgate","Sensodyne","Pampers","Always",
  "Bata","Adidas","Nike","Puma","Reebok","Levi's","H&M","Zara","Mango",
  "Philips","Ramtons","Mika","Von","Saachi","Hotpoint","Hisense","Bruhm",
  "Royco","Tropikal","Brookside","Tuzo","Daima","KCC","Coca-Cola","Pepsi",
];

const NAMES = [
  // Electronics
  "Wireless Earbuds Pro","Bluetooth Speaker Mini","Smart Watch Series 7","Phone Charger 25W",
  "USB-C Cable 2m","Power Bank 20000mAh","Laptop Stand Adjustable","Wireless Mouse",
  "Mechanical Keyboard","HD Webcam 1080p","Ring Light 10\"","Tripod Stand","Memory Card 128GB",
  "Bluetooth Headphones","Smart TV 43\"","Soundbar 2.1","HDMI Cable 4K","Phone Holder",
  "Solar Lantern","LED Bulb Pack","Extension Cable","Smart Plug","WiFi Router AC1200",
  "Action Camera 4K","Drone Mini","E-Reader 6\"","Tablet 10\"","Gaming Controller",
  // Fashion
  "Men's T-Shirt","Women's Maxi Dress","Running Shoes","Casual Sneakers","Leather Belt",
  "Denim Jeans","Cotton Hoodie","Formal Shirt","Office Trousers","Summer Sandals",
  "Sports Cap","Crossbody Bag","Backpack 25L","Wallet Bifold","Sunglasses UV400",
  "Wrist Watch Classic","Pearl Necklace","Hoop Earrings","Silk Scarf","Winter Jacket",
  // Home & Living
  "Non-Stick Pan Set","Air Fryer 5L","Pressure Cooker 6L","Blender 600W","Electric Kettle",
  "Toaster 2-Slice","Microwave 20L","Iron Box Steam","Rice Cooker 1.8L","Coffee Maker",
  "Bedsheet Set Queen","Memory Foam Pillow","Duvet 2.2m","Bath Towel Cotton","Doormat",
  "Wall Clock Silent","Curtain Rod","Storage Box","Dish Rack","Laundry Basket",
  // Beauty
  "Hair Dryer 2200W","Hair Straightener","Beard Trimmer","Electric Shaver","Face Cream",
  "Sunscreen SPF50","Lip Balm","Body Lotion","Shampoo & Conditioner","Perfume 100ml",
  "Makeup Brush Set","Eyeliner Pen","Foundation Liquid","Nail Polish Set","Face Mask Pack",
  // Groceries
  "Premium Tea Bags","Instant Coffee","Maize Flour 2kg","Rice Pilau 5kg","Cooking Oil 5L",
  "Tomato Sauce","Peanut Butter","Honey Pure 500g","Pasta Spaghetti","Cereal Cornflakes",
  // Generic enhancers
  "Compact","Pro","Plus","Lite","Max","Ultra","Premium","Eco","Deluxe","Smart",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Reward brackets map to VIP gates (matches client-side `vipForReward`). */
const REWARD_BANDS = [
  { min: 60,    max: 300,   weight: 50 }, // VIP 0-1
  { min: 400,   max: 1500,  weight: 30 }, // VIP 2-3
  { min: 2000,  max: 6000,  weight: 15 }, // VIP 4
  { min: 10000, max: 75000, weight: 5  }, // VIP 5
];

function weightedReward(): number {
  const total = REWARD_BANDS.reduce((s, b) => s + b.weight, 0);
  let r = Math.random() * total;
  for (const b of REWARD_BANDS) {
    if (r < b.weight) return Math.round(rand(b.min, b.max) / 10) * 10;
    r -= b.weight;
  }
  return 100;
}

function randomImage(seed: number): string {
  // Picsum is free, no key, gives stable images by seed.
  return `https://picsum.photos/seed/lbk${seed}/400/400`;
}

export function generateJobRow() {
  const name = `${pick(BRANDS)} ${pick(NAMES)}`;
  const reward = weightedReward();
  const price = rand(Math.max(200, reward * 4), reward * 20);
  return {
    name,
    brand: name.split(" ")[0],
    category: pick(CATEGORIES),
    platform: pick(PLATFORMS),
    image_url: randomImage(Date.now() + Math.floor(Math.random() * 100000)),
    price_ksh: price,
    points_reward: reward,
    est_minutes: pick(["1-2 minutes", "2-3 minutes", "3-5 minutes"]),
    active: true,
  };
}

export async function generateJobs(count: number): Promise<number> {
  const rows = Array.from({ length: count }, () => generateJobRow());
  const { error } = await supabase.from("products" as any).insert(rows as any);
  if (error) throw error;
  return rows.length;
}

/** VIP level required to claim a job based on its reward. */
export function vipForReward(reward: number): number {
  if (reward <= 300) return 0;
  if (reward <= 1500) return 2;
  if (reward <= 6000) return 4;
  return 5;
}

export function rewardBandLabel(reward: number): "Low" | "Medium" | "High" | "Premium" {
  if (reward <= 300) return "Low";
  if (reward <= 1500) return "Medium";
  if (reward <= 6000) return "High";
  return "Premium";
}

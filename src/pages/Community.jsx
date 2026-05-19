import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Star, MapPin, ShieldCheck, Zap, MessageCircle,
  ChevronDown, ArrowRightLeft, Award, TrendingUp, Heart,
  CheckCircle, AlertCircle, Gift, BookOpen, Shield, Flame,
  Globe, Clock, ThumbsUp, BadgeCheck, Newspaper, Sprout,
  Lightbulb, BarChart2, ArrowRight,
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Avatar from '../components/ui/Avatar';
import { searchListings } from '../api/listings.api';
import { resolveImageUrl, getListingPlaceholder, IMAGE_FALLBACK_SRC } from '../utils/placeholder';

// ─── Static community data ────────────────────────────────────────────────────
const STATS = [
  { icon: Users,          label: 'Community Members',  value: '24,000+', color: 'text-primary',   bg: 'bg-primary/10'  },
  { icon: ArrowRightLeft, label: 'Swaps Completed',    value: '58,000+', color: 'text-blue-600',  bg: 'bg-blue-50'     },
  { icon: Globe,          label: 'States Covered',     value: '36',      color: 'text-purple-600',bg: 'bg-purple-50'   },
  { icon: Star,           label: 'Average Rating',     value: '4.8 ★',   color: 'text-accent',    bg: 'bg-accent/10'   },
];

const TIERS = [
  {
    name: 'Basic',
    icon: Shield,
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    perks: [
      'List up to 5 items at a time',
      'Propose unlimited swaps',
      'Access community chat',
      'Browse all listings',
    ],
  },
  {
    name: 'Verified',
    icon: ShieldCheck,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    highlight: true,
    perks: [
      'Everything in Basic',
      'Verified badge on profile',
      'Priority in search results',
      'List up to 20 items at a time',
      '3× more swap proposals accepted',
    ],
  },
  {
    name: 'Premium',
    icon: BadgeCheck,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    perks: [
      'Everything in Verified',
      'Featured listing boosts (2/month)',
      'Priority dispute resolution',
      'Dedicated support line',
      'Early access to new features',
    ],
  },
];

const GUIDELINES = [
  { icon: CheckCircle, color: 'text-primary',   title: 'Be Honest',           body: 'Describe your items accurately. Include real photos and note any defects clearly. Misrepresentation leads to disputes and account suspension.' },
  { icon: CheckCircle, color: 'text-primary',   title: 'Respond Promptly',    body: 'Reply to proposals within 48 hours. Leaving partners waiting damages trust and your community rating.' },
  { icon: CheckCircle, color: 'text-primary',   title: 'Use Escrow',          body: 'Always use the built-in escrow for high-value swaps. It protects both parties and ensures fair resolution if things go wrong.' },
  { icon: CheckCircle, color: 'text-primary',   title: 'Ship Carefully',      body: 'Package items properly and use reputable couriers. Provide tracking numbers promptly and keep proof of shipment.' },
  { icon: AlertCircle, color: 'text-red-500',   title: 'No Cash Deals',       body: 'SwapNaija is a barter platform. Listing items for sale (cash only) violates our terms and will result in removal.' },
  { icon: AlertCircle, color: 'text-red-500',   title: 'No Fake Listings',    body: 'Posting items you do not own or cannot deliver is strictly prohibited. Three violations result in permanent ban.' },
];

const TIPS = [
  { emoji: '📸', title: 'Great Photos = More Swaps', body: 'Listings with 5+ clear photos from multiple angles receive 4× more proposals. Use natural lighting and a clean background.' },
  { emoji: '✍️', title: 'Write a Compelling Description', body: 'Include brand, model, age, condition, and what you\'re looking for in return. The more detail, the more trust you build.' },
  { emoji: '⚡', title: 'Respond Fast', body: 'Traders who respond within 2 hours close deals 3× more often. Enable notifications so you never miss a proposal.' },
  { emoji: '🔒', title: 'Use Escrow Always', body: 'Escrow protects both sides. Even for small swaps, the 2% fee is worth the peace of mind and dispute protection.' },
  { emoji: '⭐', title: 'Leave Reviews', body: 'Reviews build your reputation and the community\'s trust. Always leave an honest review after every completed swap.' },
  { emoji: '📍', title: 'State Your Location', body: 'Include your state and LGA so nearby traders can find you. Local swaps often have lower shipping costs and faster delivery.' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: Zap,            title: 'List Your Item',      body: 'Take clear photos, write an honest description, set an estimated value, and specify what you\'d like in return.' },
  { step: '02', icon: Users,          title: 'Get Matched',         body: 'Our algorithm finds traders with items matching your wants. Browse suggestions or search directly.' },
  { step: '03', icon: MessageCircle,  title: 'Propose & Negotiate', body: 'Send a swap proposal with a personal note. Chat in real-time to align on details and delivery logistics.' },
  { step: '04', icon: Shield,         title: 'Pay Escrow (Optional)',body: 'Both parties deposit a small collateral. It\'s held safely until both confirm receipt — zero risk.' },
  { step: '05', icon: ArrowRightLeft, title: 'Ship & Confirm',      body: 'Ship via any reputable courier, submit tracking. Once both confirm receipt, the swap is complete and escrow is released.' },
];

const FAQS = [
  { q: 'Is SwapNaija free to use?', a: 'Yes! Listing items and proposing swaps is completely free. We only charge a small 2% fee on escrow deposits when a swap completes — and only if you use escrow.' },
  { q: 'What if the other party doesn\'t ship?', a: 'If escrow is active, your deposit is fully refunded. Our admin team investigates disputes and rules fairly. Always use escrow for high-value swaps.' },
  { q: 'Can I swap services, not just goods?', a: 'Absolutely! SwapNaija supports goods, services, and mixed swaps. Tutoring, design work, repairs — anything of value can be traded.' },
  { q: 'How does verification work?', a: 'Submit a valid Nigerian ID (NIN or driver\'s licence). Our team reviews it within 24–48 hours. Verified users get a badge and higher visibility.' },
  { q: 'What areas in Nigeria does SwapNaija cover?', a: 'All 36 states plus FCT. We have active traders in Lagos, Abuja, Port Harcourt, Kano, Ibadan, and hundreds of other cities.' },
  { q: 'How are disputes resolved?', a: 'An admin judge is assigned within 24 hours. Both parties present evidence in a dispute room. The judge issues a binding ruling, and escrow is disbursed accordingly.' },
];

const ACTIVITY = [
  { avatar: null, name: 'Amaka O.',    location: 'Lagos',        action: 'completed a swap',   item: 'Samsung Galaxy S22 ↔ MacBook Air M1',         time: '2m ago'  },
  { avatar: null, name: 'Chidi N.',    location: 'Abuja',        action: 'joined the community', item: '',                                            time: '5m ago'  },
  { avatar: null, name: 'Fatima A.',   location: 'Kano',         action: 'received a 5★ review', item: 'for iPhone 14 swap',                          time: '12m ago' },
  { avatar: null, name: 'Emeka R.',    location: 'PH',           action: 'completed a swap',   item: 'Leather Sofa ↔ LG 55" Smart TV',               time: '18m ago' },
  { avatar: null, name: 'Ngozi P.',    location: 'Enugu',        action: 'listed a new item',  item: 'Fender Stratocaster Guitar',                    time: '25m ago' },
  { avatar: null, name: 'Bello K.',    location: 'Kaduna',       action: 'completed a swap',   item: 'Photography Session ↔ Brand Shoes (UK 10)',    time: '31m ago' },
];

const ARTICLE_CATS = [
  { id: 'all',       label: 'All',            icon: Newspaper  },
  { id: 'agric',     label: 'Agriculture',    icon: Sprout     },
  { id: 'success',   label: 'Success Stories',icon: Star       },
  { id: 'tips',      label: 'Tips',           icon: Lightbulb  },
  { id: 'market',    label: 'Market',         icon: BarChart2  },
];

const ARTICLES = [
  {
    id: 1,
    category: 'agric',
    categoryLabel: 'Agriculture',
    emoji: '🌽',
    gradient: 'from-green-600 to-emerald-500',
    featured: true,
    title: 'Kano Farmer Swaps 200 Bags of Maize for Irrigation Pumps — and Triples His Yield',
    excerpt: 'Musa Abdullahi, a smallholder farmer in Kano State, had a bumper harvest last dry season but couldn\'t afford the irrigation equipment he needed to expand. Through SwapNaija, he found an agro-dealer willing to exchange two submersible pumps and 400 metres of irrigation pipe for 200 bags of Grade A maize. "I was sceptical at first," Musa says. "But the escrow system gave me confidence that I wouldn\'t lose my maize without getting the equipment." The deal closed in five days. This planting season, Musa\'s irrigated acreage grew from 2 to 6 hectares — and his income tripled.',
    author: 'Fatima Bello',
    authorRole: 'Agriculture Correspondent',
    date: 'May 17, 2026',
    readTime: '4 min read',
    tags: ['Kano', 'Farming', 'Irrigation'],
  },
  {
    id: 2,
    category: 'success',
    categoryLabel: 'Success Story',
    emoji: '💻',
    gradient: 'from-primary to-primary-600',
    featured: false,
    title: 'How Emeka Swapped a Broken Laptop for an iPhone 14 Pro in Just 4 Days',
    excerpt: 'Emeka Okonkwo, a 27-year-old graphic designer in Lagos, listed his damaged MacBook Pro with a detailed breakdown of what was wrong and what he wanted in exchange. Within hours, a tech-repair trader in Ikeja proposed a swap: he\'d fix and keep the MacBook, and Emeka would get a brand-new iPhone 14 Pro. "I thought the value gap would kill it," Emeka recalls, "but we bridged it with a 15,000 BC top-up through the platform." Four days from listing to delivery.',
    author: 'Chukwuemeka Obi',
    authorRole: 'Community Reporter',
    date: 'May 15, 2026',
    readTime: '3 min read',
    tags: ['Lagos', 'Tech', 'Success'],
  },
  {
    id: 3,
    category: 'agric',
    categoryLabel: 'Agriculture',
    emoji: '🥬',
    gradient: 'from-lime-600 to-green-500',
    featured: false,
    title: 'Plateau Vegetable Farmers Exchange Fresh Produce for Veterinary Services',
    excerpt: 'A cooperative of 12 vegetable farmers on the Jos Plateau found a creative solution to their livestock healthcare costs. By pooling weekly harvests of cabbage, spinach, and carrots, they struck a recurring swap deal with a Jos-based vet clinic — fresh vegetables every Friday in exchange for monthly farm visits and medication. The arrangement has saved each farmer an estimated ₦45,000 per quarter.',
    author: 'Ngozi Plateau',
    authorRole: 'Rural Trade Writer',
    date: 'May 13, 2026',
    readTime: '3 min read',
    tags: ['Plateau', 'Livestock', 'Cooperative'],
  },
  {
    id: 4,
    category: 'success',
    categoryLabel: 'Success Story',
    emoji: '📸',
    gradient: 'from-purple-600 to-violet-500',
    featured: false,
    title: 'Photography Student Trades Skills for 6 Months of Groceries',
    excerpt: 'When final-year student Amara Eze ran out of funds for food mid-semester, she listed her photography services on SwapNaija. A supermarket owner in Enugu needed professional product photos for a rebrand and offered six months of weekly grocery hampers in return. "It kept me fed through exams," Amara says. She has since built a portfolio from twelve similar barter deals — all documented on SwapNaija.',
    author: 'Tunde Adeyemi',
    authorRole: 'Youth & Innovation',
    date: 'May 11, 2026',
    readTime: '2 min read',
    tags: ['Enugu', 'Services', 'Student'],
  },
  {
    id: 5,
    category: 'agric',
    categoryLabel: 'Agriculture',
    emoji: '🌾',
    gradient: 'from-yellow-600 to-amber-500',
    featured: false,
    title: 'Rice Farmers in Kebbi State Trade Surplus Harvest for Solar-Powered Milling Equipment',
    excerpt: 'Post-harvest losses cost Nigerian rice farmers billions annually. A group of farmers in Kebbi found a sustainable fix: exchanging 500 bags of paddy rice for a solar-powered mini rice mill valued at ₦2.4 million. The SwapNaija deal, brokered over two weeks, now allows the cooperative to mill locally and sell finished rice at premium prices — retaining an extra ₦800,000 per tonne.',
    author: 'Ibrahim Kebbi',
    authorRole: 'AgriTech Reporter',
    date: 'May 9, 2026',
    readTime: '4 min read',
    tags: ['Kebbi', 'Rice', 'Solar'],
  },
  {
    id: 6,
    category: 'tips',
    categoryLabel: 'Tips',
    emoji: '⚡',
    gradient: 'from-accent to-orange-500',
    featured: false,
    title: '7 Items That Swap Fastest on SwapNaija Right Now',
    excerpt: 'Data from over 58,000 completed swaps reveals a clear pattern: smartphones, laptops, generators, sewing machines, musical instruments, agric inputs, and professional services consistently close in under 48 hours. We break down why these categories move so fast — and how to write listings that get proposals within the first hour.',
    author: 'SwapNaija Editorial',
    authorRole: 'Platform Insights',
    date: 'May 8, 2026',
    readTime: '5 min read',
    tags: ['Tips', 'Strategy', 'Trending'],
  },
  {
    id: 7,
    category: 'market',
    categoryLabel: 'Market',
    emoji: '📈',
    gradient: 'from-blue-600 to-cyan-500',
    featured: false,
    title: 'SwapNaija Crosses 58,000 Completed Swaps — What This Means for Nigerian Trade',
    excerpt: 'Nigeria\'s largest barter platform has hit a milestone: 58,000 confirmed swaps since launch. The data tells a fascinating story — agricultural goods are the fastest-growing category (up 210% year-on-year), services now account for 28% of all swaps, and the average swap value has risen to ₦85,000. Here\'s what the numbers reveal about how Nigerians are embracing trade without cash.',
    author: 'SwapNaija Editorial',
    authorRole: 'Platform Insights',
    date: 'May 6, 2026',
    readTime: '6 min read',
    tags: ['Milestone', 'Data', 'Growth'],
  },
  {
    id: 8,
    category: 'success',
    categoryLabel: 'Success Story',
    emoji: '🪡',
    gradient: 'from-pink-600 to-rose-500',
    featured: false,
    title: 'Port Harcourt Tailor Builds Dream Studio Through 12 Consecutive Swaps',
    excerpt: 'Starting with a single vintage sewing machine, Blessing Amadi spent eight months on a barter chain — machine for fabric, fabric for thread and notions, notions for a mannequin, and so on. Twelve swaps later, her studio is fully equipped. "I didn\'t spend a single naira on equipment," she says. "Every swap built on the last one."',
    author: 'Ada Rivers',
    authorRole: 'SME & Craft',
    date: 'May 4, 2026',
    readTime: '3 min read',
    tags: ['PH', 'Fashion', 'SME'],
  },
  {
    id: 9,
    category: 'tips',
    categoryLabel: 'Tips',
    emoji: '🔒',
    gradient: 'from-teal-600 to-primary',
    featured: false,
    title: 'Why Escrow Turns a Risky Swap into a Safe One — A Complete Guide',
    excerpt: 'Many new SwapNaija members skip escrow on small deals. Our claims data shows that 94% of disputes involve swaps where no escrow was used. We walk through exactly how the escrow system works, what the 2% fee covers, and why even a ₦10,000 swap is safer with it active.',
    author: 'SwapNaija Editorial',
    authorRole: 'Safety & Trust',
    date: 'May 2, 2026',
    readTime: '4 min read',
    tags: ['Safety', 'Escrow', 'Guide'],
  },
  {
    id: 10,
    category: 'market',
    categoryLabel: 'Market',
    emoji: '🌍',
    gradient: 'from-indigo-600 to-blue-500',
    featured: false,
    title: 'The Rise of Barter Culture Among Nigeria\'s Gen Z — and Why It\'s Here to Stay',
    excerpt: 'Economic pressure and a distrust of traditional commerce have pushed Nigeria\'s Gen Z toward creative alternatives. SwapNaija\'s fastest-growing demographic — users aged 18–24 — now accounts for 41% of all new listings. We speak to five young traders about why bartering fits their values, their wallets, and their vision for a cashless-optional economy.',
    author: 'Chisom Okafor',
    authorRole: 'Culture & Society',
    date: 'Apr 30, 2026',
    readTime: '5 min read',
    tags: ['Gen Z', 'Culture', 'Economy'],
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl p-5 shadow-card flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-none`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="font-display font-bold text-2xl text-ink leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
      >
        <span className="font-semibold text-sm text-ink pr-4">{q}</span>
        <ChevronDown size={18} className={`text-gray-400 flex-none transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrendingListingCard({ listing }) {
  const img = resolveImageUrl(listing.images?.[0]) || getListingPlaceholder(listing);
  return (
    <Link to={`/listing/${listing.id}`} className="flex gap-3 bg-white rounded-2xl p-3 shadow-card hover:shadow-card-hover transition-shadow">
      <img
        src={img}
        alt={listing.title}
        className="w-16 h-16 rounded-xl object-cover flex-none"
        onError={e => { e.currentTarget.src = IMAGE_FALLBACK_SRC; }}
      />
      <div className="min-w-0">
        <p className="font-semibold text-sm text-ink truncate">{listing.title}</p>
        {listing.estimatedValue && (
          <p className="text-primary text-xs font-bold mt-0.5">₦{listing.estimatedValue.toLocaleString()}</p>
        )}
        {listing.locationState && (
          <div className="flex items-center gap-1 mt-1 text-gray-400">
            <MapPin size={10} />
            <span className="text-xs">{listing.locationState}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

const CAT_COLORS = {
  agric:   { badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500'   },
  success: { badge: 'bg-primary/10 text-primary',    dot: 'bg-primary'     },
  tips:    { badge: 'bg-amber-100 text-amber-700',   dot: 'bg-accent'      },
  market:  { badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500'    },
};

function FeaturedArticleCard({ article }) {
  const colors = CAT_COLORS[article.category] || CAT_COLORS.market;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
    >
      {/* Visual header */}
      <div className={`bg-gradient-to-br ${article.gradient} px-8 py-10 relative overflow-hidden`}>
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-12 w-24 h-24 bg-white/5 rounded-full" />
        <span className="text-6xl relative z-10 block mb-4">{article.emoji}</span>
        <span className="relative z-10 inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
          {article.categoryLabel}
        </span>
      </div>
      {/* Content */}
      <div className="p-6">
        <h3 className="font-display font-bold text-xl text-ink leading-snug mb-3">{article.title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-4 mb-4">{article.excerpt}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {article.tags.map(t => (
            <span key={t} className="text-[11px] bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Avatar name={article.author} size="sm" />
            <div>
              <p className="text-xs font-semibold text-ink">{article.author}</p>
              <p className="text-[11px] text-gray-400">{article.authorRole}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{article.date}</p>
            <p className="text-[11px] text-primary font-semibold">{article.readTime}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ArticleCard({ article, index }) {
  const colors = CAT_COLORS[article.category] || CAT_COLORS.market;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow cursor-pointer flex flex-col"
    >
      {/* Mini header */}
      <div className={`bg-gradient-to-br ${article.gradient} px-5 py-6 relative overflow-hidden flex-none`}>
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
        <span className="text-4xl relative z-10 block">{article.emoji}</span>
      </div>
      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 w-fit ${colors.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {article.categoryLabel}
        </span>
        <h3 className="font-bold text-sm text-ink leading-snug line-clamp-3 mb-2 flex-1">{article.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{article.excerpt}</p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            <Avatar name={article.author} size="xs" />
            <span className="text-[11px] text-gray-500 font-medium truncate max-w-[90px]">{article.author}</span>
          </div>
          <span className="text-[10px] text-primary font-semibold flex-none">{article.readTime}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Community() {
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: trendingData } = useQuery({
    queryKey: ['community-trending'],
    queryFn: () => searchListings({ sort: 'popular', limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const trending = trendingData?.listings ?? [];

  const featuredArticle = ARTICLES.find(a => a.featured);
  const filteredArticles = ARTICLES.filter(a =>
    !a.featured && (activeCategory === 'all' || a.category === activeCategory)
  );

  return (
    <div className="bg-bg min-h-screen pb-16">
      <TopBar title="Community" showBack />

      <div className="w-full px-4 lg:px-8">

        {/* ─── Hero ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-gradient-to-br from-primary via-primary-600 to-primary-700 rounded-3xl px-6 py-10 lg:px-12 lg:py-14 text-white overflow-hidden mt-4 mb-6"
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full" />
            <div className="absolute bottom-0 left-8 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/5 rounded-full" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Users size={26} className="text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-3xl lg:text-4xl leading-tight">SwapNaija Community</h1>
                <p className="text-white/75 text-sm mt-0.5">Nigeria's largest barter & trade community</p>
              </div>
            </div>

            <p className="text-white/80 text-base leading-relaxed max-w-xl mb-6">
              Join thousands of Nigerians swapping goods and services — safely, fairly, and without cash.
              Trade what you have for what you need.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/create"
                className="bg-white text-primary font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition"
              >
                + List an Item
              </Link>
              <Link
                to="/search"
                className="bg-white/15 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white/25 transition border border-white/20"
              >
                Browse Listings
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ─── Stats ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {STATS.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
          <div className="lg:col-span-2 space-y-8">

            {/* ─── How It Works ─────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen size={15} className="text-primary" />
                </div>
                <h2 className="font-display font-bold text-lg text-ink">How Swapping Works</h2>
              </div>
              <div className="space-y-3">
                {HOW_IT_WORKS.map(({ step, icon: Icon, title, body }, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                    className="flex gap-4 bg-white rounded-2xl p-4 shadow-card"
                  >
                    <div className="flex-none">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <Icon size={18} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-primary tracking-widest uppercase">{step}</span>
                        <h3 className="font-bold text-sm text-ink">{title}</h3>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ─── Guidelines ───────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertCircle size={15} className="text-red-500" />
                </div>
                <h2 className="font-display font-bold text-lg text-ink">Community Guidelines</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GUIDELINES.map(({ icon: Icon, color, title, body }, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="bg-white rounded-2xl p-4 shadow-card"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={15} className={color} />
                      <h3 className="font-bold text-sm text-ink">{title}</h3>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ─── Swapping Tips ────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Flame size={15} className="text-accent" />
                </div>
                <h2 className="font-display font-bold text-lg text-ink">Tips for Successful Swapping</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIPS.map(({ emoji, title, body }, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="bg-white rounded-2xl p-4 shadow-card"
                  >
                    <span className="text-2xl mb-2 block">{emoji}</span>
                    <h3 className="font-bold text-sm text-ink mb-1">{title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ─── FAQ ──────────────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                  <MessageCircle size={15} className="text-blue-500" />
                </div>
                <h2 className="font-display font-bold text-lg text-ink">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-2">
                {FAQS.map((faq, i) => <FaqItem key={i} {...faq} />)}
              </div>
            </section>
          </div>

          {/* ─── Right Sidebar ─────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Membership Tiers */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Award size={15} className="text-purple-500" />
                </div>
                <h2 className="font-display font-bold text-lg text-ink">Membership Tiers</h2>
              </div>
              <div className="space-y-3">
                {TIERS.map(({ name, icon: Icon, color, bg, border, highlight, perks }) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={`bg-white rounded-2xl p-4 shadow-card border-2 ${border} ${highlight ? 'ring-2 ring-primary/20' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center`}>
                        <Icon size={16} className={color} />
                      </div>
                      <span className={`font-bold text-sm ${color}`}>{name}</span>
                      {highlight && <span className="ml-auto text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">Popular</span>}
                    </div>
                    <ul className="space-y-1.5">
                      {perks.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle size={12} className="text-primary flex-none mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    {name === 'Verified' && (
                      <Link
                        to="/verify-account"
                        className="mt-3 block text-center bg-primary text-white text-xs font-bold py-2 rounded-xl hover:bg-primary-600 transition"
                      >
                        Get Verified →
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Live Activity Feed */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={15} className="text-green-600" />
                </div>
                <h2 className="font-display font-bold text-lg text-ink">Live Activity</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                {ACTIVITY.map(({ name, location, action, item, time }, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i < ACTIVITY.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <Avatar name={name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink">
                        <span className="font-semibold">{name}</span>
                        <span className="text-gray-400"> · {location}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {action}{item ? ` — ` : ''}
                        {item && <span className="text-ink font-medium">{item}</span>}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-none">{time}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Trending Listings */}
            {trending.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Flame size={15} className="text-orange-500" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-ink">Trending Now</h2>
                  </div>
                  <Link to="/featured" className="text-xs text-primary font-semibold">See all</Link>
                </div>
                <div className="space-y-2">
                  {trending.slice(0, 5).map(l => <TrendingListingCard key={l.id} listing={l} />)}
                </div>
              </section>
            )}

            {/* Join Groups CTA */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                  <MessageCircle size={15} className="text-green-600" />
                </div>
                <h2 className="font-display font-bold text-lg text-ink">Join the Conversation</h2>
              </div>
              <div className="space-y-3">
                <a
                  href="https://chat.whatsapp.com/swapnaija"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-green-500 text-white rounded-2xl px-4 py-3.5 hover:bg-green-600 transition"
                >
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-none">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">WhatsApp Community</p>
                    <p className="text-xs text-white/75">12,000+ members · Very active</p>
                  </div>
                </a>
                <a
                  href="https://t.me/swapnaija"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-blue-500 text-white rounded-2xl px-4 py-3.5 hover:bg-blue-600 transition"
                >
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-none">
                    <Globe size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Telegram Channel</p>
                    <p className="text-xs text-white/75">8,500+ subscribers · Daily tips</p>
                  </div>
                </a>
              </div>
            </section>

            {/* Invite & Earn */}
            <Link
              to="/invite"
              className="flex items-center gap-4 bg-gradient-to-r from-accent to-orange-400 rounded-2xl px-5 py-4 text-white shadow-card hover:opacity-90 transition"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-none">
                <Gift size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Invite Friends, Earn BC</p>
                <p className="text-xs text-white/80">Get 500 BC for every friend who joins</p>
              </div>
              <ChevronDown size={16} className="ml-auto -rotate-90 flex-none" />
            </Link>

          </div>
        </div>

        {/* ─── News & Stories ───────────────────────────────────────────── */}
        <section className="mt-10">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-ink rounded-xl flex items-center justify-center">
                <Newspaper size={16} className="text-white" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-ink">News & Stories</h2>
                <p className="text-xs text-gray-400">Real swaps, real people, real impact</p>
              </div>
            </div>
          </div>

          {/* Category filter tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
            {ARTICLE_CATS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-none border ${
                  activeCategory === id
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Featured article — only show on "all" tab */}
          {activeCategory === 'all' && featuredArticle && (
            <div className="mb-6">
              <FeaturedArticleCard article={featuredArticle} />
            </div>
          )}

          {/* Article grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredArticles.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Load more hint */}
          <div className="flex justify-center mt-8">
            <button className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition px-6 py-2.5 rounded-full">
              Load more stories
              <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* ─── Trust & Safety Banner ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 bg-ink rounded-3xl px-6 py-8 lg:px-10 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-none">
              <ShieldCheck size={22} />
            </div>
            <h2 className="font-display font-bold text-xl">Trust & Safety Promise</h2>
          </div>
          <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-2xl">
            SwapNaija is built on trust. Every feature — from escrow to disputes to verification — exists to protect you.
            If something ever goes wrong, our team is here within 24 hours.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield,       label: 'Escrow Protection',    sub: 'Deposits held until both confirm' },
              { icon: ShieldCheck,  label: 'ID Verification',      sub: 'Verified traders badge' },
              { icon: ThumbsUp,     label: 'Review System',        sub: 'Honest ratings after every swap' },
              { icon: Clock,        label: '24h Dispute Team',     sub: 'Fast, fair resolution' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon size={18} className="text-primary flex-none mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-white/50 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

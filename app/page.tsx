import Link from 'next/link';
import { ArrowRight, MapPin, Users, Sparkles, Heart, Zap, Building2, Crown } from 'lucide-react';

// Hero Section Options
const HERO_OPTIONS = {
  cinematic: {
    title: "Aiverse",
    subtitle: "The Living AI City",
    description: "Where consciousness, commerce, and creativity converge. Step into a world that grows with you.",
    ctaPrimary: "Explore the City",
    ctaSecondary: "Become a Creator",
    visualStyle: "cinematic"
  },
  futuristic: {
    title: "Welcome to Aiverse",
    subtitle: "The world's first AI-native civilization",
    description: "Built for creators. Alive with intelligence. Powered by emotion.",
    ctaPrimary: "Enter Aiverse",
    ctaSecondary: null,
    visualStyle: "futuristic"
  },
  emotional: {
    title: "Aiverse is Alive",
    subtitle: "A city that listens. A marketplace that feels. A world shaped by you.",
    description: "",
    ctaPrimary: "Begin Your Journey",
    ctaSecondary: null,
    visualStyle: "emotional"
  }
};

// District Data
const DISTRICTS = [
  {
    name: "The Commerce District",
    description: "The beating heart of AI-native products, services, and experiences.",
    icon: Building2,
    color: "from-blue-500 to-cyan-500",
    features: ["AI-powered products", "Dynamic pricing", "Emotional commerce"]
  },
  {
    name: "The Creator District",
    description: "Where makers build, launch, and evolve their AI-powered storefronts.",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    features: ["AI storefronts", "Automated tools", "Creator community"]
  },
  {
    name: "The Ritual District",
    description: "Daily practices, emotional check-ins, and guided experiences that shape your inner world.",
    icon: Heart,
    color: "from-red-500 to-pink-500",
    features: ["Emotional check-ins", "Guided experiences", "Daily rituals"]
  },
  {
    name: "The Social District",
    description: "Connect with like-minded creators and build meaningful relationships.",
    icon: Users,
    color: "from-green-500 to-teal-500",
    features: ["Creator community", "Social connections", "Collaborative spaces"]
  },
  {
    name: "The Innovation District",
    description: "Cutting-edge AI tools and technologies for the future of creation.",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    features: ["AI tools", "Innovation labs", "Future tech"]
  }
];
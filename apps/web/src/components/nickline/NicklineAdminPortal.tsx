/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FormEvent, useEffect } from "react";
import { 
  X, Search, ChevronDown, Filter, ArrowUpRight, ArrowDownRight, 
  Package, Users, BarChart3, Plus, ShoppingBag, Truck, Calendar, 
  Settings, HelpCircle, Compass, RefreshCw, Layers, Edit, Eye, 
  Trash2, ExternalLink, Check, AlertCircle, Sparkles, Send, FileText, CheckCircle2, Sliders, Star,
  Image, LayoutTemplate, MonitorPlay
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Scent } from "../../types/nickline";
import AdminOrdersTab from "./AdminOrdersTab";
import AdminCustomersTab from "./AdminCustomersTab";
import AdminAnalyticsTab from "./AdminAnalyticsTab";
import AdminOffersTab from "./AdminOffersTab";
import ImageUploader from "./ImageUploader";
import { useAuth } from "../../hooks/useAuth";
import { apiClient } from "../../lib/api";

// Seeded Initial Products to Match the "Products Screen" exactly
interface AdminProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "ACTIVE" | "OUT OF STOCK" | "LOW STOCK";
  views: number;
  sales: number;
  image: string;
  galleryImages?: string[];
  subtitle: string;
}

interface AdminOrder {
  id: string;
  customerName: string;
  customerInitials: string;
  customerAvatarBg: string; // Tailwind class
  location: string;
  itemsSummary: string;
  itemCount: number;
  totalPrice: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";
  placedAt: string;
}

// Realtime Activity Events Feed
interface ActivityEvent {
  id: string;
  iconType: "order" | "cart" | "ship" | "alert" | "user";
  user: string;
  text: string;
  sub: string;
  time: string;
}

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshScents?: () => void;
  onSyncNewProduct?: (scent: any) => void;
  onSyncAllData?: () => void;
}

export default function AdminPortal({ isOpen, onClose, onSyncNewProduct, onSyncAllData }: AdminPortalProps) {
  const { user, isAuthenticated: authIsAuthenticated, login, register, logout } = useAuth();
  const isAuthenticated = authIsAuthenticated && user?.role === 'admin';
  const userProfile = user ? { email: user.email, name: user.name, role: user.role === 'admin' ? "ADMIN" : "STAFF" as const } : null;

  const [email, setEmail] = useState<string>("admin@neckline.com");
  const [password, setPassword] = useState<string>("Admin123!");
  const [authError, setAuthError] = useState<string>("");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  // Menu Navigation Tabs
  const [currentTab, setCurrentTab] = useState<"dashboard" | "products" | "orders" | "customers" | "analytics" | "offers" | "reports" | "settings" | "reviews" | "interface">("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Core Datasets with local React state for complete dynamic manipulation
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  // Extra records for specialized views
  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewRatingFilter, setReviewRatingFilter] = useState("All");
  const [editingReview, setEditingReview] = useState<any | null>(null);
  
  // Review creation field state
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewProduct, setNewReviewProduct] = useState("CAIRO");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");

  // Review editing field state
  const [edtReviewName, edtSetReviewName] = useState("");
  const [edtReviewProduct, edtSetReviewProduct] = useState("CAIRO");
  const [edtReviewRating, edtSetReviewRating] = useState(5);
  const [edtReviewComment, edtSetReviewComment] = useState("");
  const [edtReviewVerified, edtSetReviewVerified] = useState(true);
  const [edtReviewDate, edtSetReviewDate] = useState("");

  interface AdminMetrics {
    revenueToday: number;
    totalRevenue: number;
    ordersCount: number;
    todayOrdersCount?: number;
    conversionRate: number;
    returningRate: number;
    newCustomers: number;
    pendingCount: number;
    processingCount: number;
    averageOrderValue: number;
    visitsHistory: { date: string; visits: number; checkouts: number }[];
    liveSessions: number;
  }

  const [metrics, setMetrics] = useState<AdminMetrics>({
    revenueToday: 0,
    totalRevenue: 0,
    ordersCount: 0,
    conversionRate: 0,
    returningRate: 0,
    newCustomers: 0,
    pendingCount: 0,
    processingCount: 0,
    averageOrderValue: 0,
    visitsHistory: [],
    liveSessions: 0
  });

  // Search & Filter State inside Product Catalog
  const [productSearch, setProductSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All Categories");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");

  // Global admin unified dynamic search & dashboard status controls
  const [globalAdminSearch, setGlobalAdminSearch] = useState<string>("");
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<string>("ALL");

  // Dynamic filter for matching orders rendered on the core overview Dashboard
  const filteredDashboardOrders = useMemo(() => {
    return orders.filter(ord => {
      const q = globalAdminSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        ord.id.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.location.toLowerCase().includes(q) ||
        (ord.itemsSummary && ord.itemsSummary.toLowerCase().includes(q));

      const matchesStatus = dashboardStatusFilter === "ALL" || ord.status === dashboardStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, globalAdminSearch, dashboardStatusFilter]);

  // Generate SVG coordinates for dynamic charting from visitsHistory for mini sparklines
  const sparklineData = useMemo(() => {
    const data = metrics.visitsHistory || [];
    const _generate = (dataArr: number[]) => {
      if (dataArr.length === 0) return { linePath: "M 0 16 Q 15 12, 30 18 T 60 10 T 85 14 T 100 4", areaPath: "M 0 16 Q 15 12, 30 18 T 60 10 T 85 14 T 100 4 L 100 20 L 0 20 Z" };
      
      const width = 100;
      const height = 20;
      // padding can be 2 to not hit the edges directly
      const padding = 2;
      const actualHeight = height - padding * 2;
      
      const maxVal = Math.max(...dataArr) || 1;
      const minVal = Math.min(...dataArr) || 0;
      const range = (maxVal - minVal) || 1;
      
      const points = dataArr.map((val, index) => {
        const x = (index / (dataArr.length - 1)) * width;
        const y = padding + actualHeight - ((val - minVal) / range) * actualHeight;
        return { x, y };
      });
      
      const linePath = points.reduce((acc, p, index) => {
        return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
      }, "");
      
      const areaPath = points.length > 0 
        ? `${linePath} L ${width} ${height} L 0 ${height} Z`
        : "";
        
      return { linePath, areaPath };
    };

    const visits = data.map(d => d.visits);
    const checkouts = data.map(d => d.checkouts);
    const revenue = data.map(d => d.checkouts * (metrics.averageOrderValue || 34));
    const newCust = data.map(d => Math.max(0, d.checkouts - 1));

    return {
      totalRevenue: _generate(revenue),
      totalOrders: _generate(checkouts),
      avgOrder: _generate(visits.map(v => Math.max(1, v - Math.random()*2))), 
      newCustomers: _generate(newCust) 
    };
  }, [metrics]);

  // Pagination for Products
  const [currentProductPage, setCurrentProductPage] = useState<number>(1);
  const productsPerPage = 8;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedProductToEdit, setSelectedProductToEdit] = useState<AdminProduct | null>(null);

  // New Product Form state
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Balms & Solid Perfumes");
  const [newProdPrice, setNewProdPrice] = useState("134");
  const [newProdStock, setNewProdStock] = useState("45");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdSubtitle, setNewProdSubtitle] = useState("Warm • Spicy • Seductive");
  const [newProdImage, setNewProdImage] = useState("");
  const [newProdGalleryImages, setNewProdGalleryImages] = useState<string[]>(["", "", ""]);
  const [newProdHeroIndex, setNewProdHeroIndex] = useState<number>(0);

  // Edit Product Form state
  const [editProdName, setEditProdName] = useState("");
  const [editProdCategory, setEditProdCategory] = useState("");
  const [editProdPrice, setEditProdPrice] = useState("");
  const [editProdStock, setEditProdStock] = useState("");
  const [editProdSku, setEditProdSku] = useState("");
  const [editProdSubtitle, setEditProdSubtitle] = useState("");
  const [editProdImage, setEditProdImage] = useState("");
  const [editProdGalleryImages, setEditProdGalleryImages] = useState<string[]>(["", "", ""]);
  const [editProdHeroIndex, setEditProdHeroIndex] = useState<number>(0);

  // Interface (Header Slides CMS) State
  const [headerSlides, setHeaderSlides] = useState<any[]>([]);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [selectedSlideToEdit, setSelectedSlideToEdit] = useState<any | null>(null);

  // How to Apply section editor states
  const [applyColor, setApplyColor] = useState("#D21B27");
  const [applySteps, setApplySteps] = useState<any[]>([]);
  const [isUpdatingApply, setIsUpdatingApply] = useState(false);
  const [applyMessage, setApplyMessage] = useState({ text: "", type: "success" });

  // Header Slide form states
  const [slideImage, setSlideImage] = useState("");
  const [slideTitle, setSlideTitle] = useState("");
  const [slideSubtitle, setSlideSubtitle] = useState("");
  const [slideDescription, setSlideDescription] = useState("");
  const [slideButtonText, setSlideButtonText] = useState("Shop Now");
  const [slideLinkTo, setSlideLinkTo] = useState("collection");

  // Open modal to add a slide
  const startAddSlide = () => {
    setSelectedSlideToEdit(null);
    setSlideImage("");
    setSlideTitle("");
    setSlideSubtitle("");
    setSlideDescription("");
    setSlideButtonText("Shop Now");
    setSlideLinkTo("collection");
    setIsSlideModalOpen(true);
  };

  // Open modal to edit a slide
  const startEditSlide = (slide: any) => {
    setSelectedSlideToEdit(slide);
    setSlideImage(slide.image || "");
    setSlideTitle(slide.title || "");
    setSlideSubtitle(slide.subtitle || "");
    setSlideDescription(slide.description || "");
    setSlideButtonText(slide.buttonText || "Shop Now");
    setSlideLinkTo(slide.linkTo || "collection");
    setIsSlideModalOpen(true);
  };

  const handleSlideFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      image: slideImage,
      title: slideTitle,
      subtitle: slideSubtitle,
      description: slideDescription,
      buttonText: slideButtonText,
      linkTo: slideLinkTo
    };

    try {
      if (selectedSlideToEdit) {
        const res = await fetch(`/api/admin/header-slides/${encodeURIComponent(selectedSlideToEdit.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to edit slide");
      } else {
        const res = await fetch("/api/admin/header-slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to add slide");
      }

      setIsSlideModalOpen(false);
      setSelectedSlideToEdit(null);
      
      onSyncAllData?.();
      fetchData();
    } catch (err) {
      console.error("Failed to commit header slide action:", err);
    }
  };

  const handleUpdateStepField = (idx: number, field: string, value: any) => {
    setApplySteps(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleIconUpload = async (idx: number, file: File) => {
    handleUpdateStepField(idx, "customIconUrl", "uploading");
    handleUpdateStepField(idx, "iconType", "custom");
    try {
      // TODO: Replace with MERN file upload endpoint
      const downloadUrl = URL.createObjectURL(file);
      handleUpdateStepField(idx, "customIconUrl", downloadUrl);
    } catch (err: any) {
      console.error("Custom icon storage backup failed:", err);
      handleUpdateStepField(idx, "customIconUrl", "");
    }
  };

  const saveHowToApplyConfig = async () => {
    setIsUpdatingApply(true);
    setApplyMessage({ text: "", type: "success" });
    try {
      const res = await fetch("/api/admin/how-to-apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          color: applyColor,
          steps: applySteps
        })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save configuration");
      }
      
      setApplyMessage({ text: "How to Apply configured successfully!", type: "success" });
      onSyncAllData?.();
    } catch (err: any) {
      console.error(err);
      setApplyMessage({ text: err.message || "Failed to save configuration.", type: "error" });
    } finally {
      setIsUpdatingApply(false);
      setTimeout(() => setApplyMessage({ text: "", type: "success" }), 4000);
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (true) {
      try {
        const res = await fetch(`/api/admin/header-slides/${encodeURIComponent(slideId)}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Failed to delete slide");
        
        onSyncAllData?.();
        fetchData();
      } catch (err) {
        console.error("Failed to delete slide:", err);
      }
    }
  };


  // Central Syncing Method
  const fetchData = async (isPolling: boolean = false) => {
    try {
      const [prodRes, ordRes, actRes, metRes, custRes, coupRes, offRes, revRes, slideRes] = await Promise.all([
        fetch("/api/admin/products").then(r => r.ok ? r.json() : []),
        fetch("/api/admin/orders").then(r => r.ok ? r.json() : []),
        fetch("/api/admin/activities").then(r => r.ok ? r.json() : []),
        fetch("/api/admin/metrics").then(r => r.ok ? r.json() : null),
        fetch("/api/admin/customers").then(r => r.ok ? r.json() : []),
        fetch("/api/admin/coupons").then(r => r.ok ? r.json() : []),
        fetch("/api/admin/offers").then(r => r.ok ? r.json() : []),
        fetch("/api/testimonials").then(r => r.ok ? r.json() : []),
        isPolling ? Promise.resolve(null) : fetch("/api/header-slides").then(r => r.ok ? r.json() : [])
      ]);

      if (prodRes && prodRes.length > 0) setProducts(prodRes);
      if (ordRes) setOrders(ordRes);
      if (actRes) setActivities(actRes);
      if (metRes) setMetrics(metRes);
      if (custRes) setCustomers(custRes);
      if (coupRes) setCoupons(coupRes);
      if (offRes) setOffers(offRes);
      if (revRes) setReviews(revRes);
      if (!isPolling && slideRes) setHeaderSlides(slideRes);
    } catch (err) {
      console.error("Failure syncing administrative datasets Over Network:", err);
    }
  };

  // Dedicated single-load effect for How-To-Apply configuration data to protect against dirty-state resets during polling
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      const fetchHowToApply = async () => {
        try {
          const res = await fetch("/api/how-to-apply");
          if (res.ok) {
            const data = await res.json();
            setApplyColor(data.color || "#D21B27");
            if (data.steps && data.steps.length > 0) {
              setApplySteps(data.steps);
            } else {
              setApplySteps([
                { num: "01", title: "SWIPE", desc: "Use your fingertip to gently swipe a small amount of solid perfume.", iconType: "preset", presetName: "Fingerprint", customIconUrl: "" },
                { num: "02", title: "DAB", desc: "Apply to pulse points — neck, wrists, behind ears, or chest.", iconType: "preset", presetName: "CircleDot", customIconUrl: "" },
                { num: "03", title: "MELT", desc: "Let the warmth of your skin melt the perfume naturally.", iconType: "preset", presetName: "Flame", customIconUrl: "" },
                { num: "04", title: "FEEL", desc: "The scent unfolds throughout the day, intimate and lasting.", iconType: "preset", presetName: "Feather", customIconUrl: "" },
                { num: "05", title: "REPEAT", desc: "Reapply anytime to refresh your signature scent.", iconType: "preset", presetName: "Infinity", customIconUrl: "" }
              ]);
            }
          }
        } catch (err) {
          console.error("Error loading How To Apply in AdminPortal:", err);
        }
      };
      fetchHowToApply();
    }
  }, [isAuthenticated, isOpen]);

  // Automated Synchronization Polling Loop & Initial Mounting Load
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      fetchData(false); // initial full load
      const interval = setInterval(() => {
        fetchData(true); // interval polling load
      }, 5000); // Poll every 5 seconds for immediate orders/carts updates
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isOpen]);

  // Handle Login submission with MERN Auth
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isSignUp) {
        await register(email.split('@')[0], email, password);
      } else {
        await login(email, password);
      }
      fetchData();
    } catch (err: any) {
      let customMsg = err.message || "Authentication refused. Please check credentials.";
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already registered") || msg.includes("already exists")) {
        customMsg = "This email is already registered. Please sign in instead.";
      } else if (msg.includes("Invalid") || msg.includes("invalid credential")) {
        customMsg = "Invalid email or password. Please try again.";
      } else if (msg.includes("weak") || msg.includes("6 characters")) {
        customMsg = "Password is too weak. Must be at least 6 characters.";
      }
      setAuthError(customMsg);
    }
  };

  // Robust on-the-fly seed account creator and sign-in bypass
  const handleShortcutLogin = async () => {
    setEmail("admin@neckline.com");
    setPassword("Admin123!");
    setAuthError("");
    try {
      await login("admin@neckline.com", "Admin123!");
      fetchData();
    } catch (err: any) {
      setAuthError(err.message || "Failed bypass connection");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout error", e);
    }
    localStorage.removeItem("aura_admin_token");
    localStorage.removeItem("aura_admin_user");
          };

  // Add Product Flow
  const handleAddProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(newProdPrice) || 0;
    const parsedStock = parseInt(newProdStock) || 0;
    
    const skuCode = newProdSku.trim() || `#P${Math.round(Math.random()*10000)}`;

    const selectedHeroImage = newProdGalleryImages[newProdHeroIndex] || newProdImage;

    const payload = {
      name: newProdName,
      sku: skuCode,
      category: newProdCategory,
      price: parsedPrice,
      stock: parsedStock,
      subtitle: newProdSubtitle,
      image: selectedHeroImage,
      galleryImages: newProdGalleryImages
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Add product request failed");

      const created = await res.json();
      
      // Synchronize back with parent outer app state if handler exists
      if (onSyncNewProduct) {
        onSyncNewProduct({
          id: created.id,
          name: created.name.split(" - ")[0],
          subtitle: created.subtitle,
          description: `High caliber administrative edition of ${created.name}. Designed for exceptional body warmth matches.`,
          longDescription: `An elite scent launched directly via the AURA workspace. Activates on immediate contact with pulse heat structures.`,
          price: created.price,
          image: created.image,
          notes: {
            top: "Wild Saffron, Golden Amber",
            heart: "Precious Oud, Damask Musk",
            base: "Rich Velvet Moss, Cashmere wood"
          },
          intensity: 4,
          vibe: "Clean modern confidence, executive styling, luxury spaces.",
          ingredients: ["Organic Beeswax", "Coconut Oil", "Custom Scent Compound", "Vibe Enhancers"]
        });
      }

      // Reset form & state
      setNewProdName("");
      setNewProdSku("");
      setNewProdImage("");
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed adding product:", err);
    }
  };

  // Trigger editing a product
  const startEditProduct = (prod: AdminProduct) => {
    setSelectedProductToEdit(prod);
    setEditProdName(prod.name);
    setEditProdCategory(prod.category);
    setEditProdPrice(prod.price.toString());
    setEditProdStock(prod.stock.toString());
    setEditProdSku(prod.sku);
    setEditProdSubtitle(prod.subtitle);
    setEditProdImage(prod.image || "");

    const defaultGallery = prod.galleryImages && prod.galleryImages.length > 0 
      ? [...prod.galleryImages] 
      : [prod.image || "", "", ""];
    while (defaultGallery.length < 3) defaultGallery.push("");
    setEditProdGalleryImages(defaultGallery.slice(0, 3));
    
    const heroIndex = defaultGallery.findIndex(img => img === prod.image);
    setEditProdHeroIndex(heroIndex >= 0 ? heroIndex : 0);

    setIsEditModalOpen(true);
  };

  const handleEditProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProductToEdit) return;

    const parsedPrice = parseFloat(editProdPrice) || 0;
    const parsedStock = parseInt(editProdStock) || 0;
    
    // Select the hero image from gallery images if set, otherwise fallback to index 0 or editProdImage
    const selectedHeroImage = editProdGalleryImages[editProdHeroIndex] || editProdImage;

    const payload = {
      name: editProdName,
      category: editProdCategory,
      price: parsedPrice,
      stock: parsedStock,
      sku: editProdSku,
      subtitle: editProdSubtitle,
      image: selectedHeroImage,
      galleryImages: editProdGalleryImages
    };

    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(selectedProductToEdit.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Edit request unsuccessful");

      setIsEditModalOpen(false);
      setSelectedProductToEdit(null);
      
      onSyncNewProduct?.(payload);
      fetchData();
    } catch (err) {
      console.error("Failed editing product:", err);
    }
  };

  // Delete product action
  const deleteProduct = async (prodId: string, prodName: string) => {
    if (true) {
      try {
        const res = await fetch(`/api/admin/products/${encodeURIComponent(prodId)}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Delete request failed");
        fetchData();
      } catch (err) {
        console.error("Failed to delete product:", err);
      }
    }
  };

  // Order Handlers
  const handleUpdateOrder = async (orderId: string, orderPayload: { status?: string; trackingNumber?: string }) => {
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      if (!res.ok) throw new Error("Order upgrade request aborted");
      fetchData();
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Order cancellation aborted");
      fetchData();
    } catch (err) {
      console.error("Failed to cancel order:", err);
    }
  };

  // Coupons / Offers Handlers
  const handleAddCoupon = async (couponPayload: any) => {
    try {
      await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponPayload)
      });
      fetchData();
    } catch (err) {
      console.error("Failed to create coupon:", err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await fetch(`/api/admin/coupons/${encodeURIComponent(id)}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to delete coupon:", err);
    }
  };

  const handleAddOffer = async (offerPayload: any) => {
    try {
      await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerPayload)
      });
      fetchData();
    } catch (err) {
      console.error("Failed to create offer:", err);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      await fetch(`/api/admin/offers/${encodeURIComponent(id)}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to delete offer:", err);
    }
  };

  const handleResetAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/reset-analytics", {
        method: "POST"
      });
      if (!res.ok) throw new Error("Reset request failed");
      
      onSyncAllData?.();
      fetchData();
    } catch (err) {
      console.error("Failed to reset analytics:", err);
    }
  };

  const handleDeleteCustomer = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Delete customer request failed");
      
      onSyncAllData?.();
      fetchData();
    } catch (err) {
      console.error("Failed to delete customer:", err);
    }
  };

  // Review Admin Handlers
  const handleAddReviewAdmin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newReviewName,
          product: newReviewProduct,
          comment: newReviewComment,
          rating: newReviewRating,
          verified: true,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        })
      });
      if (res.ok) {
        setIsAddReviewOpen(false);
        setNewReviewName("");
        setNewReviewComment("");
        setNewReviewRating(5);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to add review from admin:", err);
    }
  };

  const startEditReview = (rev: any) => {
    setEditingReview(rev);
    edtSetReviewName(rev.name);
    edtSetReviewProduct(rev.product);
    edtSetReviewComment(rev.comment);
    edtSetReviewRating(rev.rating);
    edtSetReviewVerified(rev.verified !== false);
    edtSetReviewDate(rev.date || "");
  };

  const handleEditReviewAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    try {
      const res = await fetch(`/api/testimonials/${encodeURIComponent(editingReview.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: edtReviewName,
          product: edtReviewProduct,
          comment: edtReviewComment,
          rating: edtReviewRating,
          verified: edtReviewVerified,
          date: edtReviewDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        })
      });
      if (res.ok) {
        setEditingReview(null);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save edited review:", err);
    }
  };

  const handleDeleteReviewAdmin = async (id: string) => {
    
    try {
      const res = await fetch(`/api/testimonials/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  // Filter products cleanly
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchSearch = prod.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          prod.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                          prod.category.toLowerCase().includes(productSearch.toLowerCase());
      
      const matchCategory = categoryFilter === "All Categories" || prod.category === categoryFilter;
      
      const matchStatus = statusFilter === "All Statuses" || 
                           (statusFilter === "ACTIVE" && prod.status === "ACTIVE") ||
                           (statusFilter === "OUT OF STOCK" && prod.status === "OUT OF STOCK") ||
                           (statusFilter === "LOW STOCK" && prod.status === "LOW STOCK");

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, productSearch, categoryFilter, statusFilter]);

  // Filter reviews dynamically
  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      const q = reviewSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        rev.name.toLowerCase().includes(q) ||
        rev.product.toLowerCase().includes(q) ||
        (rev.comment && rev.comment.toLowerCase().includes(q));
      
      const matchesRating = reviewRatingFilter === "All" || rev.rating === parseInt(reviewRatingFilter);
      return matchesSearch && matchesRating;
    });
  }, [reviews, reviewSearch, reviewRatingFilter]);

  // Paginated product items
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentProductPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentProductPage]);

  // Total pages
  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;

  // Derived metrics counters
  const totalProductsCount = products.length;
  const activeProductsCount = products.filter(p => p.status === "ACTIVE").length;
  const outOfStockCount = products.filter(p => p.status === "OUT OF STOCK").length;
  const totalViewsCount = products.reduce((acc, p) => acc + (p.views || 0), 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex bg-[#090203] text-stone-100 font-sans select-none antialiased">
        
        {/* ========================================================== */}
        {/* LOGIN GATE SCREEN */}
        {/* ========================================================== */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-4 relative bg-[#090203]" id="admin-login-screen">
            {/* Immersive blurred background image */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              <img 
                src="/images/neckline_hero_panoramic_1779647796500.png"
                alt="Neckline Solid Perfume Background"
                className="w-full h-full object-cover filter blur-[10px] scale-105 opacity-40"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#090203]/75" />
            </div>

            {/* Soft decorative background amber and crimson blurs */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#D21B27] opacity-[0.06] blur-[150px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/10 opacity-[0.04] blur-[150px]" />
            
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-md p-8 sm:p-10 rounded-2xl border border-white/[0.06] bg-zinc-950/60 backdrop-blur-2xl shadow-2xl relative z-10 text-left"
              id="admin-login-card"
            >
              
              {/* Back button */}
              <button 
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-full border border-white/5 hover:border-white/20 bg-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
                title="Return to Shop Storefront"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl text-[#D21B27]">✦</span>
                <span className="text-stone-400 text-xs font-mono tracking-[0.3em] uppercase">SYSTEM PORTAL</span>
              </div>
              <h2 className="text-3xl font-serif text-white tracking-wide uppercase mb-6">
                NICKLINE ADMIN
              </h2>

              {/* Tabs for Sign In vs Sign Up */}
              <div className="flex border-b border-white/5 mb-6 text-xs font-mono tracking-wider">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setAuthError(""); }}
                  className={`flex-1 pb-3 text-center transition-all cursor-pointer ${!isSignUp ? "text-[#D21B27] border-b-2 border-[#D21B27] font-bold" : "text-neutral-500 hover:text-stone-300"}`}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setAuthError(""); }}
                  className={`flex-1 pb-3 text-center transition-all cursor-pointer ${isSignUp ? "text-[#D21B27] border-b-2 border-[#D21B27] font-bold" : "text-neutral-500 hover:text-stone-300"}`}
                >
                  SIGN UP
                </button>
              </div>

              {authError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2" id="login-error-toast">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-neutral-400 font-mono font-bold mb-2">
                    EMAIL:
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email"
                    className="w-full h-11 px-4 text-sm rounded-xl outline-none bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#D21B27] text-white transition-all"
                    id="login-email-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-neutral-400 font-mono font-bold mb-2">
                    password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? "Enter new password (min. 6 chars)" : "Enter security passcode"}
                    className="w-full h-11 px-4 text-sm rounded-xl outline-none bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#D21B27] text-white transition-all"
                    id="login-password-input"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-[#D21B27] hover:bg-[#B0151E] text-white text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer shadow-lg hover:shadow-[#D21B27]/15 flex items-center justify-center gap-2"
                    id="login-submit-btn"
                  >
                    {isSignUp ? "Create Admin Account" : "Authorize Workspace Space"}
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        ) : (
          
          // ==========================================================
          // AUTHORIZED CONTROL PANEL WORKSPACE
          // ==========================================================
          <div className="flex-1 flex flex-col md:flex-row max-h-screen overflow-hidden text-stone-200" id="admin-authorized-board">
            
            {/* Mobile Header Menu */}
            <div className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-white/[0.05] z-30">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                  className="p-1 rounded-md text-stone-300 hover:bg-white/5 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>
                <div className="flex flex-col">
                  <span className="font-serif text-sm tracking-[0.2em] font-bold uppercase text-white leading-none">NICKLINE</span>
                  <span className="text-[8px] font-mono text-emerald-400 mt-1 uppercase">Live Admin</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white transition-colors bg-white/5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
              <div 
                className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}

            {/* ========================================== */}
            {/* SIDEBAR NAVIGATION (LEFT) */}
            {/* ========================================== */}
            <aside className={`${isMobileMenuOpen ? "flex fixed inset-y-0 left-0 z-50 w-64 shadow-2xl" : "hidden"} md:flex w-64 bg-zinc-950 border-r border-white/[0.05] flex-col justify-between p-6 flex-shrink-0 transition-transform h-full`} id="admin-sidebar">
              <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Brand Banner Segment */}
                <div className="flex justify-between items-center" id="sidebar-brand-segment">
                  <div className="text-left">
                    <h1 className="text-xl font-serif text-white tracking-[0.2em] font-medium uppercase hover:opacity-90">
                      NICKLINE
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1.5 select-none">
                      <span className="text-[9px] font-mono tracking-widest text-neutral-400">ADMIN • CAIRO</span>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">LIVE</span>
                    </div>
                  </div>
                  {/* Close button inside mobile menu */}
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="md:hidden p-1.5 rounded-full bg-white/5 text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Action Menu List */}
                <nav className="space-y-1 text-left" id="sidebar-navigation-items">
                  
                  {/* Dashboard Menu Button */}
                  <button
                    onClick={() => { setCurrentTab("dashboard"); setIsMobileMenuOpen(false); }}
                    className={`nav-sidebar-btn w-full px-4 h-11 flex items-center justify-between text-xs tracking-wider rounded-xl transition-all cursor-pointer ${
                      currentTab === "dashboard"
                        ? "bg-[#1F0D0F] text-white font-medium border-l-[3px] border-[#D21B27]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sliders className={`w-4 h-4 ${currentTab === "dashboard" ? "text-[#D21B27]" : "text-neutral-400"}`} />
                      <span>Dashboard</span>
                    </div>
                  </button>

                  {/* Products Menu Button */}
                  <button
                    onClick={() => { setCurrentTab("products"); setIsMobileMenuOpen(false); }}
                    className={`nav-sidebar-btn w-full px-4 h-11 flex items-center justify-between text-xs tracking-wider rounded-xl transition-all cursor-pointer ${
                      currentTab === "products"
                        ? "bg-[#1F0D0F] text-white font-medium border-l-[3px] border-[#D21B27]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Package className={`w-4 h-4 ${currentTab === "products" ? "text-[#D21B27]" : "text-neutral-400"}`} />
                      <span>Products</span>
                    </div>
                  </button>

                  {/* Orders Menu Button */}
                  <button
                    onClick={() => { setCurrentTab("orders"); setIsMobileMenuOpen(false); }}
                    className={`nav-sidebar-btn w-full px-4 h-11 flex items-center justify-between text-xs tracking-wider rounded-xl transition-all cursor-pointer ${
                      currentTab === "orders"
                        ? "bg-[#1F0D0F] text-white font-medium border-l-[3px] border-[#D21B27]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className={`w-4 h-4 ${currentTab === "orders" ? "text-[#D21B27]" : "text-neutral-400"}`} />
                      <span>Orders</span>
                    </div>
                    {orders.length > 0 && (
                      <span className="bg-[#D21B27] text-white text-[8px] font-mono h-4 px-1.5 rounded-full flex items-center justify-center font-bold">
                        12P
                      </span>
                    )}
                  </button>

                  {/* Customers Menu Button */}
                  <button
                    onClick={() => { setCurrentTab("customers"); setIsMobileMenuOpen(false); }}
                    className={`nav-sidebar-btn w-full px-4 h-11 flex items-center justify-between text-xs tracking-wider rounded-xl transition-all cursor-pointer ${
                      currentTab === "customers"
                        ? "bg-[#1F0D0F] text-white font-medium border-l-[3px] border-[#D21B27]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className={`w-4 h-4 ${currentTab === "customers" ? "text-[#D21B27]" : "text-neutral-400"}`} />
                      <span>Customers</span>
                    </div>
                  </button>

                  {/* Analytics Menu Button */}
                  <button
                    onClick={() => { setCurrentTab("analytics"); setIsMobileMenuOpen(false); }}
                    className={`nav-sidebar-btn w-full px-4 h-11 flex items-center justify-between text-xs tracking-wider rounded-xl transition-all cursor-pointer ${
                      currentTab === "analytics"
                        ? "bg-[#1F0D0F] text-white font-medium border-l-[3px] border-[#D21B27]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className={`w-4 h-4 ${currentTab === "analytics" ? "text-[#D21B27]" : "text-neutral-400"}`} />
                      <span>Analytics</span>
                    </div>
                  </button>

                  {/* Offers Menu Button */}
                  <button
                    onClick={() => { setCurrentTab("offers"); setIsMobileMenuOpen(false); }}
                    className={`nav-sidebar-btn w-full px-4 h-11 flex items-center justify-between text-xs tracking-wider rounded-xl transition-all cursor-pointer ${
                      currentTab === "offers"
                        ? "bg-[#1F0D0F] text-white font-medium border-l-[3px] border-[#D21B27]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Compass className={`w-4 h-4 ${currentTab === "offers" ? "text-[#D21B27]" : "text-neutral-400"}`} />
                      <span>Offers</span>
                    </div>
                    <span className="bg-[#D21B27] text-white text-[8px] font-mono h-4 width-4 px-1 rounded-full flex items-center justify-center font-bold">
                      3
                    </span>
                  </button>

                  {/* Reports Menu Button */}
                  <button
                    onClick={() => { setCurrentTab("reports"); setIsMobileMenuOpen(false); }}
                    className={`nav-sidebar-btn w-full px-4 h-11 flex items-center justify-between text-xs tracking-wider rounded-xl transition-all cursor-pointer ${
                      currentTab === "reports"
                        ? "bg-[#1F0D0F] text-white font-medium border-l-[3px] border-[#D21B27]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`w-4 h-4 ${currentTab === "reports" ? "text-[#D21B27]" : "text-neutral-400"}`} />
                      <span>Reports</span>
                    </div>
                  </button>

                  {/* Reviews Menu Button */}
                  <button
                    onClick={() => { setCurrentTab("reviews"); setIsMobileMenuOpen(false); }}
                    className={`nav-sidebar-btn w-full px-4 h-11 flex items-center justify-between text-xs tracking-wider rounded-xl transition-all cursor-pointer ${
                      currentTab === "reviews"
                        ? "bg-[#1F0D0F] text-white font-medium border-l-[3px] border-[#D21B27]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Star className={`w-4 h-4 ${currentTab === "reviews" ? "text-red-500 fill-red-500" : "text-neutral-400"}`} />
                      <span>Customer Reviews</span>
                    </div>
                    {reviews.length > 0 && (
                      <span className="bg-[#D21B27] text-white text-[8px] font-mono h-4 px-1.5 rounded-full flex items-center justify-center font-bold">
                        {reviews.length}
                      </span>
                    )}
                  </button>

                  {/* Interface CMS Button */}
                  <button
                    onClick={() => { setCurrentTab("interface"); setIsMobileMenuOpen(false); }}
                    className={`nav-sidebar-btn w-full px-4 h-11 flex items-center justify-between text-xs tracking-wider rounded-xl transition-all cursor-pointer ${
                      currentTab === "interface"
                        ? "bg-[#1F0D0F] text-white font-medium border-l-[3px] border-[#D21B27]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3 font-sans">
                      <Image className={`w-4 h-4 ${currentTab === "interface" ? "text-amber-500" : "text-neutral-400"}`} />
                      <span>Interface Billboard</span>
                    </div>
                  </button>

                  {/* Settings Menu Button */}
                  <button
                    onClick={() => { setCurrentTab("settings"); setIsMobileMenuOpen(false); }}
                    className={`nav-sidebar-btn w-full px-4 h-11 flex items-center justify-between text-xs tracking-wider rounded-xl transition-all cursor-pointer ${
                      currentTab === "settings"
                        ? "bg-[#1F0D0F] text-white font-medium border-l-[3px] border-[#D21B27]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className={`w-4 h-4 ${currentTab === "settings" ? "text-[#D21B27]" : "text-neutral-400"}`} />
                      <span>Settings</span>
                    </div>
                  </button>

                </nav>
              </div>

              {/* Sidebar bottom info box */}
              <div className="space-y-6 text-left">
                
                {/* Need Help card */}
                <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#D21B27]" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-white">Need help?</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-light leading-relaxed">
                    Check our docs or contact support.
                  </p>
                  <button 
                    onClick={() => alert("Connecting to Neckline Engineering support tunnel...")}
                    className="w-full text-center py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-stone-300 text-[9px] font-bold uppercase tracking-wider border border-white/5 transition-colors cursor-pointer"
                  >
                    Contact Support
                  </button>
                </div>

                {/* Account card & Close overlay button */}
                <div className="flex justify-between items-center border-t border-white/[0.06] pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1F0D0F] border border-red-950 flex items-center justify-center text-[#D21B27] font-bold text-xs uppercase font-serif">
                      AA
                    </div>
                    <div>
                      <h4 className="text-[11px] text-white font-semibold">Admin</h4>
                      <p className="text-[9px] text-neutral-400 font-mono">admin@neckline.com</p>
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/5 border border-white/5 hover:border-[#D21B27]/40 text-neutral-400 hover:text-[#D21B27] transition-all cursor-pointer"
                    title="Exit Admin Control Portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </aside>

            {/* ========================================== */}
            {/* WORKSPACE AREA CONTAINER (RIGHT SIDE) */}
            {/* ========================================== */}
            <main className="flex-1 bg-zinc-950 flex flex-col min-h-screen overflow-y-auto" id="admin-main-view">
              
              {/* TOP HEADER STATUS CONTROL BAR */}
              <header className="px-4 md:px-8 py-4 md:py-0 md:h-20 border-b border-white/[0.05] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0" id="admin-panel-topbar">
                
                {/* Burger segment & Breadcrumb */}
                <div className="flex items-center gap-4 hidden md:flex">
                  <div className="flex items-center gap-2 text-xs text-neutral-400" id="topbar-breadcrumb">
                    <span className="uppercase tracking-[0.1em]">OVERVIEW</span>
                    <span className="text-stone-700">·</span>
                    <span className="text-white font-semibold tracking-wider flex items-center gap-1 cursor-pointer">
                      LAST 7 DAYS
                      <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Universal Search & Hot Date switches & Actions */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-4 w-full md:w-auto">
                  
                  {/* Search orders */}
                  <div className="relative flex items-center w-full md:max-w-xs bg-white/[0.02] border border-white/5 hover:border-[#D21B27]/40 focus-within:border-[#D21B27] rounded-xl h-10 px-3 transition-all flex-grow">
                    <Search className={`w-3.5 h-3.5 mr-2 transition-colors ${globalAdminSearch ? "text-[#D21B27]" : "text-neutral-500"}`} />
                    <input
                      type="text"
                      placeholder="Search admin database..."
                      value={globalAdminSearch}
                      onChange={(e) => setGlobalAdminSearch(e.target.value)}
                      className="bg-transparent text-xs outline-none w-full text-white placeholder-neutral-500"
                    />
                    {globalAdminSearch ? (
                      <button onClick={() => setGlobalAdminSearch("")} className="text-neutral-500 hover:text-white text-xs select-none p-0.5 cursor-pointer">
                        ✕
                      </button>
                    ) : (
                      <kbd className="text-[9px] font-mono opacity-50 px-1.5 py-0.5 rounded border border-white/10 text-neutral-400 hidden sm:block">⌘K</kbd>
                    )}
                  </div>

                  {/* Hot Filter Buttons (24H, 7D, 30D, 90D) */}
                  <div className="hidden sm:flex items-center bg-zinc-900 border border-white/5 rounded-xl p-0.5">
                    {["24H", "7D", "30D", "90D"].map((t) => (
                      <button
                        key={t}
                        onClick={() => alert(`Showing analytics for timeline: ${t}`)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                          t === "7D"
                            ? "bg-[#D21B27] text-white shadow-md font-extrabold"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Actions wrapper */}
                  <div className="flex items-center gap-2 ml-auto w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end">
                    {/* Export Trigger */}
                    <button 
                      onClick={() => alert("Initiating high-end CSV exports of sensory metrics...")}
                      className="h-10 px-4 rounded-xl text-neutral-300 hover:text-white text-xs border border-white/[0.08] hover:border-white/20 bg-white/5 transition-colors cursor-pointer flex items-center gap-2 flex-1 md:flex-none justify-center"
                    >
                      <Send className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="hidden sm:inline">Export</span>
                    </button>

                    {/* + New Product Trigger */}
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="h-10 px-4 rounded-xl bg-[#D21B27] hover:bg-[#B0151E] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#D21B27]/10 flex items-center gap-2 flex-1 md:flex-none justify-center"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span className="hidden sm:inline">New Product</span>
                      <span className="sm:hidden">New</span>
                    </button>

                    <button 
                      onClick={onClose}
                      className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.02] text-neutral-400 hover:text-white border border-white/5 hover:border-white/20 transition-all cursor-pointer font-bold"
                      title="Back to store"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </header>

              {/* ======================================================= */}
              {/* TAB 1: ADMINISTRATIVE OVERVIEW DASHBOARD */}
              {/* ======================================================= */}
              {currentTab === "dashboard" && (
                <div className="p-8 space-y-8" id="dashboard-tab-space">
                  
                  {/* Today Core Metrics Header Indicators - matching the screenshot layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard-metric-cards-header">
                    
                    {/* Stat Box 1: TODAY · LIVE */}
                    <div className="p-6 rounded-2xl border border-white/[0.05] relative overflow-hidden bg-gradient-to-r from-[#D21B27]/10 to-[#D21B27]/0 backdrop-blur-md" id="stat-live-orders-card">
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-left">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#D21B27] font-extrabold">TODAY • LIVE</span>
                          <h3 className="text-4xl font-serif text-white tracking-wide font-extrabold block mt-2">{metrics.todayOrdersCount || 0}</h3>
                          <span className="text-[10px] text-zinc-400 font-light block mt-1.5">Orders total recorded today</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-[#D21B27]/15 flex items-center justify-center text-[#D21B27] border border-[#D21B27]/25">
                          <Sliders className="w-5 h-5" />
                        </div>
                      </div>
                      
                      {/* Micro Sparkline Line Chart using beautifully rendered glowing crimson SVG path */}
                      <div className="h-10 w-full pt-1">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                          <path 
                            d="M 0 15 Q 12 5, 24 12 T 48 8 T 72 15 T 100 5" 
                            fill="none" 
                            stroke="#D21B27" 
                            strokeWidth="2" 
                            strokeLinecap="round"
                          />
                          <path 
                            d="M 0 15 Q 12 5, 24 12 T 48 8 T 72 15 T 100 5 L 100 20 L 0 20 Z" 
                            fill="url(#sparkGradientToday)" 
                            opacity="0.15"
                          />
                          <defs>
                            <linearGradient id="sparkGradientToday" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#D21B27" />
                              <stop offset="100%" stopColor="#D21B27" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>

                    </div>

                    {/* Stat Box 2: REVENUE TODAY */}
                    <div className="p-6 rounded-2xl border border-white/[0.05] relative overflow-hidden bg-white/[0.01] backdrop-blur-md" id="stat-revenue-today-card">
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-left">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">REVENUE TODAY</span>
                          <h3 className="text-3xl font-serif text-white tracking-wide font-bold block mt-2">
                            {(metrics.revenueToday || 0).toLocaleString()} <span className="text-xs text-stone-400 font-sans font-normal ml-0.5">EGP</span>
                          </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-stone-100 border border-white/5">
                          <Package className="w-5 h-5 text-stone-100" />
                        </div>
                      </div>

                      {/* Progress Bar metric (69% of daily target, green line bar) */}
                      <div className="space-y-1.5" id="daily-target-progress">
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-emerald-400 font-bold">Dynamic daily target metrics</span>
                          <span className="text-neutral-500">17,000 EGP target</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (metrics.revenueToday || 0) / 17000 * 100)}%` }} />
                        </div>
                      </div>

                    </div>

                    {/* Stat Box 3: SESSIONS • LIVE */}
                    <div className="p-6 rounded-2xl border border-white/[0.05] relative overflow-hidden bg-white/[0.01] backdrop-blur-md" id="stat-sessions-live-card">
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-left">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">SESSIONS • LIVE</span>
                          <h3 className="text-4xl font-serif text-white tracking-wide font-bold block mt-2">{metrics.liveSessions || 0}</h3>
                          <span className="text-[10px] text-zinc-400 font-light block mt-1">Active current channels</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-stone-100 border border-white/5">
                          <Users className="w-5 h-5 text-stone-100" />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Multi-user real-time active streams</span>
                      </div>

                    </div>

                    {/* Stat Box 4: CONVERSION RATE */}
                    <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01]" id="stat-conversion-card">
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-left">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">CONVERSION RATE</span>
                          <h3 className="text-4xl font-serif text-white tracking-wide font-bold block mt-2">{metrics.conversionRate || 0}%</h3>
                          <span className="text-[10px] text-zinc-400 font-light block mt-1">Visit-to-seduce ratio</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-stone-100 border border-white/5">
                          <BarChart3 className="w-5 h-5 text-stone-100" />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                        <span>Calculated dynamically</span>
                      </div>

                    </div>

                  </div>

                    {/* Secondary detailed Sparklines Area with filled glowing area charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard-secondary-stats-charts">
                    
                    {/* Stat Box A: TOTAL REVENUE */}
                    <div className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.01]/40 flex flex-col justify-between" id="secondary-total-revenue">
                      <div className="text-left">
                        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                          <span>Total Revenue</span>
                          <span className="text-emerald-400">Current</span>
                        </div>
                        <h4 className="text-2xl font-serif font-bold text-white mt-2">
                          {(metrics.totalRevenue || 0).toLocaleString()} <span className="text-xs text-stone-500">EGP</span>
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-light block mt-1">Calculated from total orders</span>
                      </div>
                      
                      {/* Area Chart Path SVG */}
                      <div className="h-10 w-full pt-4">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                          <path d={sparklineData.totalRevenue.linePath} fill="none" stroke="#D21B27" strokeWidth="1.5" />
                          <path d={sparklineData.totalRevenue.areaPath} fill="url(#sparkAreaA)" opacity="0.1" />
                          <defs>
                            <linearGradient id="sparkAreaA" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#D21B27" />
                              <stop offset="100%" stopColor="#D21B27" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    {/* Stat Box B: TOTAL ORDERS */}
                    <div className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.01]/40 flex flex-col justify-between" id="secondary-total-orders">
                      <div className="text-left">
                        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                          <span>Total Orders</span>
                          <span className="text-emerald-400">Current</span>
                        </div>
                        <h4 className="text-3xl font-serif font-bold text-white mt-2">{metrics.ordersCount || 0}</h4>
                        <span className="text-[10px] text-zinc-500 font-light block mt-1">Lifetime total</span>
                      </div>

                      {/* Area Chart Path SVG */}
                      <div className="h-10 w-full pt-4">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                          <path d={sparklineData.totalOrders.linePath} fill="none" stroke="#D21B27" strokeWidth="1.5" />
                          <path d={sparklineData.totalOrders.areaPath} fill="url(#sparkAreaB)" opacity="0.1" />
                          <defs>
                            <linearGradient id="sparkAreaB" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#D21B27" />
                              <stop offset="100%" stopColor="#D21B27" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    {/* Stat Box C: AVG. ORDER VALUE */}
                    <div className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.01]/40 flex flex-col justify-between" id="secondary-avg-order">
                      <div className="text-left">
                        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                          <span>Avg. Order Value</span>
                          <span className="text-emerald-400">Current</span>
                        </div>
                        <h4 className="text-2xl font-serif font-bold text-white mt-2">
                          {(metrics.averageOrderValue || 0).toLocaleString()} <span className="text-xs text-stone-500">EGP</span>
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-light block mt-1">Average per cart checkout</span>
                      </div>

                      {/* Area Chart Path SVG */}
                      <div className="h-10 w-full pt-4">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                          <path d={sparklineData.avgOrder.linePath} fill="none" stroke="#D21B27" strokeWidth="1.5" />
                          <path d={sparklineData.avgOrder.areaPath} fill="url(#sparkAreaC)" opacity="0.1" />
                          <defs>
                            <linearGradient id="sparkAreaC" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#D21B27" />
                              <stop offset="100%" stopColor="#D21B27" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    {/* Stat Box D: NEW CUSTOMERS */}
                    <div className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.01]/40 flex flex-col justify-between" id="secondary-new-customers">
                      <div className="text-left">
                        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                          <span>New Customers</span>
                          <span className="text-emerald-400">Current</span>
                        </div>
                        <h4 className="text-3xl font-serif font-bold text-white mt-2">{metrics.newCustomers || 0}</h4>
                        <span className="text-[10px] text-zinc-500 font-light block mt-1">Calculated from unique orders</span>
                      </div>

                      {/* Area Chart Path SVG */}
                      <div className="h-10 w-full pt-4">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                          <path d={sparklineData.newCustomers.linePath} fill="none" stroke="#D21B27" strokeWidth="1.5" />
                          <path d={sparklineData.newCustomers.areaPath} fill="url(#sparkAreaD)" opacity="0.1" />
                          <defs>
                            <linearGradient id="sparkAreaD" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#D21B27" />
                              <stop offset="100%" stopColor="#D21B27" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                  </div>

                  {/* 2-Column workspace layout segment */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="dashboard-two-col-grid">
                    
                    {/* LEFT PART: LINE CHART & RECENT ORDERS TABLE (CSpans 8) */}
                    <div className="lg:col-span-8 space-y-8 text-left" id="dashboard-left-cluster">
                      
                      {/* Interactive Revenue 30 Days chart block */}
                      <div className="p-6 rounded-2xl border border-white/[0.05] bg-zinc-950/60 backdrop-blur-md" id="revenue-30-days-card">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-[#D21B27]" />
                              <h3 className="text-lg font-serif text-white tracking-widest uppercase">REVENUE • 30 DAYS</h3>
                            </div>
                            <p className="text-[11px] text-neutral-400 font-mono mt-1">
                              Daily gross — completed orders only. Cairo timezone.
                            </p>
                          </div>
                          
                          {/* Total Period Sum Label */}
                          <div className="text-left sm:text-right">
                            <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500 block">Period Total</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-2xl font-serif text-white font-bold">{(metrics.totalRevenue || 0).toLocaleString()}</span>
                              <span className="text-[10px] text-stone-400 font-mono">EGP</span>
                              <span className="text-xs text-emerald-400 font-bold ml-1">Live data</span>
                            </div>
                          </div>
                        </div>

                        {/* Beautifully precise Custom SVG line/area chart representing April 23 to May 23 */}
                        <div className="h-64 w-full relative pt-6" id="revenue-30d-svg-container">
                          
                          {/* SVG Grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[8px] font-mono text-neutral-600 border-l border-b border-white/[0.05] pl-1 pb-1">
                            <div>20K</div>
                            <div>15K</div>
                            <div>10K</div>
                            <div>5K</div>
                            <div>0K</div>
                          </div>

                          {/* SVG Line path with custom peaks to match Cairo theme high contrast */}
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                            <defs>
                              {/* Dark luxurious ambient red gradient overlay */}
                              <linearGradient id="chartGradientArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#D21B27" stopOpacity="0.3" />
                                <stop offset="50%" stopColor="#D21B27" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="#D21B27" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            
                            {/* SVG chart ticks background */}
                            <line x1="0" y1="50" x2="500" y2="50" stroke="white" strokeOpacity="0.03" strokeDasharray="3,3" />
                            <line x1="0" y1="100" x2="500" y2="100" stroke="white" strokeOpacity="0.03" strokeDasharray="3,3" />
                            <line x1="0" y1="150" x2="500" y2="150" stroke="white" strokeOpacity="0.03" strokeDasharray="3,3" />

                            {/* Fills the area below */}
                            <path 
                              d="M 0 150 
                                 C 40 135, 60 148, 80 140 
                                 C 120 120, 140 135, 180 115 
                                 C 220 90, 240 110, 280 95
                                 C 320 80, 340 90, 380 75
                                 C 420 60, 450 78, 500 45
                                 L 500 200 L 0 200 Z" 
                              fill="url(#chartGradientArea)" 
                            />

                            {/* Draws the premium crimson line */}
                            <path 
                              d="M 0 150 
                                 C 40 135, 60 148, 80 140 
                                 C 120 120, 140 135, 180 115 
                                 C 220 90, 240 110, 280 95
                                 C 320 80, 340 90, 380 75
                                 C 420 60, 450 78, 500 45" 
                              fill="none" 
                              stroke="#D21B27" 
                              strokeWidth="2.5" 
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Terminal points anchors */}
                            <circle cx="500" cy="45" r="4.5" fill="#090203" stroke="#D21B27" strokeWidth="2" />
                            <text x="470" y="32" fill="#D21B27" className="font-mono text-[9px] font-bold" filter="drop-shadow(0px 2px 4px black)">18.4K</text>
                          </svg>

                          {/* Timeline X axis labels */}
                          <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 mt-2 pr-2 ml-4">
                            <span>APR 23</span>
                            <span>APR 28</span>
                            <span>MAY 03</span>
                            <span>MAY 08</span>
                            <span>MAY 13</span>
                            <span>MAY 18</span>
                            <span className="text-[#D21B27] font-bold">MAY 23</span>
                          </div>

                        </div>
                      </div>

                      {/* RECENT ORDERS COMPONENT TABLE ("12 Pending" indicator) */}
                      <div className="p-6 rounded-2xl border border-white/[0.05] bg-zinc-950/60 backdrop-blur-md" id="recent-orders-card">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">📋</span>
                            <h3 className="text-lg font-serif text-white tracking-widest uppercase">RECENT ORDERS</h3>
                            <span className="bg-[#D21B27]/10 text-[#D21B27] text-[10px] font-mono font-extrabold border border-[#D21B27]/20 px-2.5 py-0.5 rounded-full">
                              {metrics.pendingCount || 0} PENDING
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <select
                              value={dashboardStatusFilter}
                              onChange={(e) => setDashboardStatusFilter(e.target.value)}
                              className="h-9 px-3 border border-white/5 bg-zinc-950 rounded-xl text-neutral-300 text-xs font-semibold outline-none focus:border-[#D21B27] cursor-pointer transition-colors"
                            >
                              <option value="ALL">All Statuses</option>
                              <option value="PENDING">Pending</option>
                              <option value="PROCESSING">Processing</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="DELIVERED">Delivered</option>
                            </select>
                            <button 
                              onClick={() => setCurrentTab("orders")}
                              className="h-9 px-3.5 border border-white/5 bg-[#D21B27]/10 hover:bg-[#D21B27]/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                            >
                              View all
                            </button>
                          </div>
                        </div>

                        {/* Recent orders grid */}
                        <div className="overflow-x-auto" id="orders-dashboard-grid-container">
                          <table className="w-full text-left text-xs text-neutral-300">
                            <thead>
                              <tr className="border-b border-white/[0.05] text-neutral-400 font-bold uppercase font-mono tracking-wider text-[10px]">
                                <th className="pb-4">Order</th>
                                <th className="pb-4">Customer</th>
                                <th className="pb-4">Items</th>
                                <th className="pb-4">Total</th>
                                <th className="pb-4">Status</th>
                                <th className="pb-4">Placed</th>
                                <th className="pb-4 text-right">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                              {filteredDashboardOrders.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="py-8 text-center text-neutral-500 font-light">
                                    No orders match your search criteria.
                                  </td>
                                </tr>
                              ) : (
                                filteredDashboardOrders.slice(0, 8).map((ord) => (
                                  <tr key={ord.id} className="group hover:bg-white/[0.01]">
                                    <td className="py-4 font-mono font-bold text-white tracking-widest">{ord.id}</td>
                                    <td className="py-4 font-light text-neutral-200">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] uppercase font-serif-neckline ${ord.customerAvatarBg || 'bg-stone-500/10 text-white border border-stone-500/20'}`}>
                                          {ord.customerInitials || ord.customerName?.[0] || '?'}
                                        </div>
                                        <div>
                                          <div className="font-semibold">{ord.customerName}</div>
                                          <div className="text-[9px] text-zinc-500">{ord.location}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-4 font-mono text-[10.5px] max-w-[180px] truncate text-stone-300 font-light pr-2">
                                      {ord.itemsSummary}
                                      <span className="text-[9px] text-zinc-500 block">{ord.itemCount} items</span>
                                    </td>
                                    <td className="py-4 font-mono font-bold text-white">
                                      {ord.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} EGP
                                    </td>
                                    <td className="py-4">
                                      <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md border inline-block ${
                                        ord.status === "PENDING"
                                          ? "bg-amber-500/15 text-amber-500 border-amber-500/20"
                                          : ord.status === "PROCESSING"
                                          ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                                          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                      }`}>
                                        {ord.status}
                                      </span>
                                    </td>
                                    <td className="py-4 font-light text-[11px] text-neutral-400">{ord.placedAt}</td>
                                    <td className="py-4 text-right">
                                      <button 
                                        onClick={() => setCurrentTab("orders")}
                                        className="p-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
                                        title="Review order specs"
                                      >
                                        →
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                      </div>

                    </div>

                    {/* RIGHT PART: TOP PRODUCTS & LIVE REALTIME ACTIVITY (CSpans 4) */}
                    <div className="lg:col-span-4 space-y-8 text-left" id="dashboard-right-cluster">
                      
                      {/* TOP PRODUCTS card */}
                      <div className="p-6 rounded-2xl border border-white/[0.05] bg-zinc-950/60 backdrop-blur-md" id="top-products-card">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-sm tracking-widest font-serif font-bold text-white flex items-center gap-2">
                              <span>🏆</span> TOP PRODUCTS
                            </h3>
                            <p className="text-[10px] text-neutral-500 font-light mt-1">
                              Ranked by units sold this week.
                            </p>
                          </div>
                          <span className="text-[9px] uppercase font-mono text-amber-500 tracking-wider font-extrabold">UNITS · 7D</span>
                        </div>

                        {/* Top products ranking items list with crimson bars */}
                        <div className="space-y-4" id="top-products-indicators-list">
                          {products.length === 0 ? (
                            <div className="text-xs text-neutral-500 font-light text-center py-4">
                              No products available yet.
                            </div>
                          ) : (
                            products.slice(0, 5).map((prod, index) => {
                              // Compute a simple percentage bar for visual strength
                              const maxSales = products[0]?.sales || 1;
                              const percentageWidth = Math.max(15, Math.min(100, Math.round((prod.sales / maxSales) * 100)));
                              
                              return (
                                <div key={prod.id} className="space-y-2">
                                  <div className="flex justify-between items-center text-xs font-mono">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[#D21B27] font-serif font-bold tracking-wider">
                                        0{index + 1}
                                      </span>
                                      <span className="text-white hover:text-stone-350 cursor-pointer font-light">
                                        {prod.name.split(" - ")[0]}
                                      </span>
                                    </div>
                                    <span className="text-white font-extrabold">{prod.sales}</span>
                                  </div>
                                  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-[#D21B27]/60 to-[#D21B27] rounded-full transition-all duration-1000"
                                      style={{ width: `${percentageWidth}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <button 
                          onClick={() => setCurrentTab("products")}
                          className="w-full text-center py-3 border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/[0.03] text-neutral-300 text-[10px] font-bold uppercase tracking-wider mt-6 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>View full catalog</span>
                          <span>→</span>
                        </button>

                      </div>

                      {/* LIVE REAL-TIME TELEMETRY FEED (real-time toggle updates) */}
                      <div className="p-6 rounded-2xl border border-white/[0.05] bg-zinc-950/60 backdrop-blur-md" id="live-activity-feed-card">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-white uppercase font-serif tracking-widest font-bold">
                              <span className="h-2 w-2 rounded-full bg-[#D21B27] animate-pulse"></span>
                              <span>LIVE ACTIVITY</span>
                            </div>
                            <p className="text-[10px] text-neutral-500 font-light mt-1">
                              Storefront events as they happen.
                            </p>
                          </div>
                          <span className="text-[9px] font-mono text-neutral-500">REAL-TIME</span>
                        </div>

                        {/* Event Feed log */}
                        <div className="space-y-4" id="realtime-logs-feed">
                          {activities.slice(0, 5).map((act) => (
                            <div key={act.id} className="flex gap-3 text-xs">
                              
                              {/* Left icon wrapper */}
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                                act.iconType === "order" 
                                  ? "bg-red-500/10 border-red-500/15 text-[#D21B27]"
                                  : act.iconType === "ship"
                                  ? "bg-emerald-500/10 border-emerald-500/15 text-emerald-400"
                                  : act.iconType === "alert"
                                  ? "bg-amber-500/10 border-amber-500/15 text-amber-500"
                                  : "bg-white/[0.04] border-white/5 text-stone-200"
                              }`}>
                                {act.iconType === "order" ? <ShoppingBag className="w-3.5 h-3.5" /> :
                                 act.iconType === "ship" ? <Truck className="w-3.5 h-3.5" /> :
                                 act.iconType === "alert" ? <AlertCircle className="w-3.5 h-3.5" /> :
                                 act.iconType === "cart" ? <Package className="w-3.5 h-3.5" /> :
                                 <Users className="w-3.5 h-3.5" />}
                              </div>

                              {/* Text log detail */}
                              <div className="flex-1 text-left">
                                <p className="text-zinc-300 antialiased font-light text-[11.5px] leading-relaxed">
                                  <span className="font-semibold text-white mr-1">{act.user}</span>
                                  {act.text}
                                  {act.sub && <span className="font-mono text-[10.5px] text-[#C29F68] block mt-0.5">{act.sub}</span>}
                                </p>
                              </div>

                              {/* Period time elapsed */}
                              <span className="text-[10px] font-mono text-neutral-500 pr-1">{act.time}</span>

                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={() => alert("Connecting to live server log tunnel...")}
                          className="w-full text-center py-3 border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/[0.03] text-neutral-300 text-[10px] font-bold uppercase tracking-wider mt-6 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>View all activity</span>
                          <span>→</span>
                        </button>

                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* ======================================================= */}
              {/* TAB 2: PRODUCTS CATALOG INVENTORY (ACTIVE / OUT OF STOCK) */}
              {/* ======================================================= */}
              {currentTab === "products" && (
                <div className="p-8 space-y-8" id="products-tab-space">
                  
                  {/* Products summary stats counters header bar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="products-metric-row">
                    
                    {/* Total products Counter Box */}
                    <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01]/60 text-left" id="prod-total-box">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500">TOTAL PRODUCTS</span>
                          <h3 className="text-3xl font-serif text-white tracking-wide font-extrabold mt-2">
                            {totalProductsCount}
                          </h3>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center text-[#D21B27]">
                          <Package className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-3">
                        Live data sync
                      </span>
                    </div>

                    {/* Active products Counter Box */}
                    <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01]/60 text-left" id="prod-active-box">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500">ACTIVE PRODUCTS</span>
                          <h3 className="text-3xl font-serif text-white tracking-wide font-extrabold mt-2">
                            {activeProductsCount}
                          </h3>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="h-1 bg-zinc-900 rounded-full w-full mt-3 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(activeProductsCount/totalProductsCount)*100}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-neutral-400 mt-1 block">
                        {Math.round((activeProductsCount/totalProductsCount)*100)}% of total scents catalog
                      </span>
                    </div>

                    {/* Out of Stock Counter Box */}
                    <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01]/60 text-left" id="prod-stockout-box">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500">OUT OF STOCK</span>
                          <h3 className="text-3xl font-serif text-white tracking-wide font-extrabold mt-2">
                            {outOfStockCount}
                          </h3>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center text-[#D21B27]">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="h-1 bg-zinc-900 rounded-full w-full mt-3 overflow-hidden">
                        <div className="h-full bg-[#D21B27] rounded-full" style={{ width: `${(outOfStockCount/totalProductsCount)*100}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-[#D21B27] font-bold mt-1 block">
                        {Math.round((outOfStockCount/totalProductsCount)*100)}% out of physical wax levels
                      </span>
                    </div>

                    {/* Total Views */}
                    <div className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.01]/60 text-left" id="prod-views-box">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500">TOTAL VIEWS</span>
                          <h3 className="text-3xl font-serif text-white tracking-wide font-extrabold mt-2">
                            {totalViewsCount.toLocaleString()}
                          </h3>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center text-orange-400">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-3">
                        Total across catalog
                      </span>
                    </div>

                  </div>

                  {/* Product filters action layout block */}
                  <div className="p-6 rounded-2xl border border-white/[0.05] bg-zinc-950/60 backdrop-blur-md" id="products-catalog-manager-block">
                    
                    {/* Filter Inputs Grid row */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6" id="products-filters-container">
                      
                      {/* Search box input */}
                      <div className="relative flex items-center max-w-sm w-full bg-white/[0.02] border border-white/5 hover:border-white/10 focus-within:border-[#D21B27] rounded-xl h-11 px-3.5 transition-all">
                        <Search className="w-4 h-4 text-neutral-500 mr-2" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setCurrentProductPage(1);
                          }}
                          placeholder="Search product name, SKU, or category..."
                          className="bg-transparent text-xs outline-none w-full text-white placeholder-neutral-500 focus:ring-0"
                        />
                      </div>

                      {/* Dropdowns */}
                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                        
                        {/* Category Dropdown */}
                        <div className="relative h-11 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl px-4 flex items-center z-10">
                          <select
                            value={categoryFilter}
                            onChange={(e) => {
                              setCategoryFilter(e.target.value);
                              setCurrentProductPage(1);
                            }}
                            className="bg-transparent text-xs text-white outline-none cursor-pointer pr-4 appearance-none"
                          >
                            <option value="All Categories" className="bg-zinc-950">All Categories</option>
                            <option value="Balms & Solid Perfumes" className="bg-zinc-950">Balms & Solid Perfumes</option>
                            <option value="Tins" className="bg-zinc-950">Tins</option>
                            <option value="Duo Packs" className="bg-zinc-950">Duo Packs</option>
                            <option value="Gift Sets" className="bg-zinc-950">Gift Sets</option>
                            <option value="Home Fragrance" className="bg-zinc-950">Home Fragrance</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 pointer-events-none" />
                        </div>

                        {/* Status Dropdown */}
                        <div className="relative h-11 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl px-4 flex items-center z-10">
                          <select
                            value={statusFilter}
                            onChange={(e) => {
                              setStatusFilter(e.target.value);
                              setCurrentProductPage(1);
                            }}
                            className="bg-transparent text-xs text-white outline-none cursor-pointer pr-4 appearance-none"
                          >
                            <option value="All Statuses" className="bg-zinc-950">All Statuses</option>
                            <option value="ACTIVE" className="bg-zinc-950">ACTIVE</option>
                            <option value="LOW STOCK" className="bg-zinc-950">LOW STOCK</option>
                            <option value="OUT OF STOCK" className="bg-zinc-950">OUT OF STOCK</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 pointer-events-none" />
                        </div>

                        {/* Filter Trigger Button */}
                        <button 
                          onClick={() => alert("Complex filtering index synchronized!")}
                          className="h-11 px-4 border border-white/5 hover:border-white/10 bg-[#D21B27]/10 text-[#D21B27] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Filter className="w-3.5 h-3.5" />
                          <span>Filter</span>
                        </button>

                        {/* Sort selector dropdown */}
                        <div className="relative h-11 bg-zinc-900 border border-white/5 rounded-xl px-4 flex items-center z-10">
                          <span className="text-[10px] uppercase font-mono text-neutral-500 mr-2 font-bold select-none">Sort:</span>
                          <select
                            onChange={() => alert("Re-sorted catalogue list")}
                            className="bg-transparent text-xs text-white outline-none cursor-pointer pr-4 appearance-none"
                          >
                            <option value="newest" className="bg-zinc-950">Newest</option>
                            <option value="sales" className="bg-zinc-950">Most Sold</option>
                            <option value="price-asc" className="bg-zinc-950">Price: Low-High</option>
                            <option value="price-desc" className="bg-zinc-950">Price: High-Low</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-3 pointer-events-none" />
                        </div>

                      </div>

                    </div>

                    {/* PRODUCTS TABLE */}
                    <div className="overflow-x-auto" id="products-table-scroll-box">
                      <table className="w-full text-left text-xs text-neutral-300 min-w-[800px]">
                        <thead>
                          <tr className="border-b border-white/[0.05] text-neutral-400 font-bold uppercase font-mono tracking-wider text-[10px]">
                            <th className="pb-4 w-12 text-center">Select</th>
                            <th className="pb-4">Product</th>
                            <th className="pb-4">SKU</th>
                            <th className="pb-4">Category</th>
                            <th className="pb-4">Price</th>
                            <th className="pb-4">Stock</th>
                            <th className="pb-4">Status</th>
                            <th className="pb-4">Views · 7D</th>
                            <th className="pb-4">Sales · 7D</th>
                            <th className="pb-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {paginatedProducts.map((prod) => (
                            <tr key={prod.id} className="group hover:bg-white/[0.01]">
                              <td className="py-4 text-center">
                                <input 
                                  type="checkbox" 
                                  className="accent-[#D21B27] cursor-pointer"
                                  id={`checkbox-row-${prod.id}`}
                                />
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/[0.05] bg-black flex-shrink-0">
                                    <img 
                                      src={prod.image} 
                                      alt={prod.name} 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="text-left font-light">
                                    <div className="font-semibold text-white text-[12.5px] tracking-wide">{prod.name.split(" - ")[0]}</div>
                                    <div className="text-[10px] text-zinc-500 capitalize">{prod.name.split(" - ")[1] || prod.subtitle}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 font-mono font-bold tracking-widest text-[#C29F68]">{prod.sku}</td>
                              <td className="py-4 font-light text-neutral-400">{prod.category}</td>
                              <td className="py-4 font-mono font-bold text-white">
                                {prod.price.toFixed(2)} <span className="text-[10px] text-zinc-500">EGP</span>
                              </td>
                              <td className="py-4">
                                <span className={`font-mono font-bold ${
                                  prod.stock === 0 
                                    ? "text-red-500" 
                                    : prod.stock < 20 
                                    ? "text-amber-500" 
                                    : "text-emerald-500"
                                }`}>
                                  {prod.stock}
                                </span>
                              </td>
                              <td className="py-4">
                                <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md border inline-block ${
                                  prod.status === "ACTIVE"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"
                                    : prod.status === "LOW STOCK"
                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/15"
                                    : "bg-red-500/10 text-[#D21B27] border-[#D21B27]/15"
                                }`}>
                                  {prod.status}
                                </span>
                              </td>
                              <td className="py-4 font-mono text-stone-300">{prod.views.toLocaleString()}</td>
                              <td className="py-4 font-mono text-stone-350 font-semibold">{prod.sales}</td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => alert(`Scent details preview:\nName: ${prod.name}\nPrice: ${prod.price} EGP\nSKU: ${prod.sku}\nViews: ${prod.views}`)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
                                    title="View Product Scent Stats"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => startEditProduct(prod)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-amber-500" />
                                  </button>
                                  <button
                                    onClick={() => deleteProduct(prod.id, prod.name)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-neutral-400 hover:text-[#D21B27] transition-all cursor-pointer"
                                    title="Delete product scent item from shop catalog"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Pagination Segment - matching the screen mock */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-white/[0.04]" id="products-table-pagination">
                      <p className="text-[11px] font-mono text-neutral-500">
                        Showing {(currentProductPage-1)*productsPerPage + 1} to {Math.min(filteredProducts.length, currentProductPage*productsPerPage)} of {filteredProducts.length} product scents
                      </p>

                      <div className="flex items-center gap-1.5">
                        
                        <button
                          disabled={currentProductPage === 1}
                          onClick={() => setCurrentProductPage(prev => Math.max(1, prev - 1))}
                          className="h-8 w-8 rounded-lg flex items-center justify-center border border-white/5 bg-white/5 hover:border-white/10 text-stone-400 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ‹
                        </button>

                        {/* Pagination Numbers dynamically generated */}
                        {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((pg) => (
                          <button
                            key={pg}
                            onClick={() => setCurrentProductPage(pg)}
                            className={`h-8 w-8 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
                              pg === currentProductPage
                                ? "bg-[#D21B27] text-white"
                                : "border border-white/5 bg-white/5 text-neutral-400 hover:text-white"
                            }`}
                          >
                            {pg}
                          </button>
                        ))}

                        <button
                          disabled={currentProductPage === totalProductPages}
                          onClick={() => setCurrentProductPage(prev => Math.min(totalProductPages, prev + 1))}
                          className="h-8 w-8 rounded-lg flex items-center justify-center border border-white/5 bg-white/5 hover:border-white/10 text-stone-400 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ›
                        </button>

                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ======================================================= */}
              {/* COMPREHENSIVE ACTIVE WORKSPACE SECTIONS */}
              {/* ======================================================= */}
              {currentTab === "orders" && (
                <AdminOrdersTab 
                  orders={orders} 
                  onUpdateOrder={handleUpdateOrder} 
                  onDeleteOrder={handleDeleteOrder} 
                  onRefresh={fetchData} 
                  globalSearchQuery={globalAdminSearch}
                  onGlobalSearchChange={setGlobalAdminSearch}
                />
              )}

              {currentTab === "customers" && (
                <AdminCustomersTab 
                  customers={customers} 
                  onRefresh={fetchData} 
                  globalSearchQuery={globalAdminSearch}
                  onGlobalSearchChange={setGlobalAdminSearch}
                  onDeleteCustomer={handleDeleteCustomer}
                />
              )}

              {currentTab === "analytics" && (
                <AdminAnalyticsTab 
                  metrics={metrics} 
                  onRefresh={fetchData} 
                  onResetAnalytics={handleResetAnalytics}
                />
              )}

              {currentTab === "offers" && (
                <AdminOffersTab 
                  coupons={coupons} 
                  offers={offers} 
                  onAddCoupon={handleAddCoupon} 
                  onDeleteCoupon={handleDeleteCoupon} 
                  onAddOffer={handleAddOffer} 
                  onDeleteOffer={handleDeleteOffer} 
                  onRefresh={fetchData} 
                  globalSearchQuery={globalAdminSearch}
                />
              )}

              {currentTab === "reviews" && (
                <div className="p-8 space-y-8 text-left animate-fade-in" id="admin-reviews-workspace">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#D21B27] tracking-[0.2em] uppercase">User Experience Controls</span>
                      </div>
                      <h2 className="text-3xl font-serif text-white tracking-wide uppercase">Sensory Reviews</h2>
                      <p className="text-xs text-neutral-400 font-light mt-1">
                        Manage, verify, edit, and formulate client fragrance impressions for the looping marquee.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddReviewOpen(true)}
                      className="h-11 px-6 rounded-xl bg-[#D21B27] hover:bg-[#B0151E] text-white text-[11px] font-bold uppercase tracking-[0.15em] hover:shadow-lg hover:shadow-[#D21B27]/10 transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
                      id="admin-add-review-trigger"
                    >
                      <Plus className="w-4 h-4" /> Add Sensory Review
                    </button>
                  </div>

                  {/* Rating Summaries & Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#C29F68]">Total Feedback Items</span>
                      <h4 className="text-3xl font-serif text-white mt-1.5">{reviews.length}</h4>
                      <span className="text-[9px] text-zinc-500 font-mono block mt-1">Published live on storefront marquee</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#C29F68]">Average Rating</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <h4 className="text-3xl font-serif text-white">
                          {(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)}
                        </h4>
                        <div className="flex text-amber-500">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        </div>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono block mt-1">Based on global active reviewers</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#C29F68]">Verified Share Ratio</span>
                      <h4 className="text-3xl font-serif text-white">
                        {Math.round((reviews.filter(r => r.verified !== false).length / (reviews.length || 1)) * 100)}%
                      </h4>
                      <span className="text-[9px] text-zinc-500 font-mono block mt-1">System validated buyer purchases</span>
                    </div>
                  </div>

                  {/* Filter Sub-header control */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.05] bg-zinc-950/40">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        value={reviewSearch}
                        onChange={(e) => setReviewSearch(e.target.value)}
                        placeholder="Search reviewer or comment..."
                        className="w-full h-10 pl-10 pr-4 bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#D21B27] rounded-xl text-xs text-white outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider hidden sm:block">Filter Stars:</label>
                      <select
                        value={reviewRatingFilter}
                        onChange={(e) => setReviewRatingFilter(e.target.value)}
                        className="h-10 px-4 bg-zinc-900 border border-white/10 rounded-xl text-xs text-stone-200 outline-none focus:border-[#D21B27] cursor-pointer flex-1 sm:flex-none"
                      >
                        <option value="All">All Stars</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                      </select>
                    </div>
                  </div>

                  {/* Listing Table */}
                  <div className="border border-white/[0.05] rounded-2xl bg-[#090203] overflow-hidden">
                    <div className="overflow-x-auto font-sans">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-white/[0.05] bg-white/[0.02]/30 text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase font-mono">
                            <th className="py-4 px-6">Customer</th>
                            <th className="py-4 px-6">Product</th>
                            <th className="py-4 px-6">Rating</th>
                            <th className="py-4 px-6">Scent Commentary</th>
                            <th className="py-4 px-6">Verified</th>
                            <th className="py-4 px-6">Date</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {filteredReviews.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-xs text-neutral-500 font-mono">
                                No customer reviews match your search filtering parameters.
                              </td>
                            </tr>
                          ) : (
                            filteredReviews.map((rev) => (
                              <tr key={rev.id} className="hover:bg-white/[0.01] group">
                                <td className="py-4 px-6">
                                  <div className="font-semibold text-white text-[12.5px] tracking-wide">{rev.name}</div>
                                </td>
                                <td className="py-4 px-6">
                                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/[0.08] text-[10px] font-mono font-bold tracking-widest text-[#C29F68]">
                                    {rev.product}
                                  </span>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex text-amber-500 gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-amber-500 text-amber-500" : "text-zinc-800 opacity-20"}`} />
                                    ))}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-xs text-neutral-300 font-light max-w-sm">
                                  <p className="line-clamp-2 leading-relaxed" title={rev.comment}>{rev.comment}</p>
                                </td>
                                <td className="py-4 px-6">
                                  {rev.verified !== false ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[9px] font-bold uppercase tracking-wider">
                                      <CheckCircle2 className="w-3 h-3" /> Yes
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-805 text-zinc-400 border border-zinc-700 text-[9px] font-bold uppercase tracking-wider">
                                      No
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-[11px] font-mono text-neutral-500">{rev.date || "May 24, 2026"}</td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => startEditReview(rev)}
                                      className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
                                      title="Modify/Edit Scent Review"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-amber-500" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteReviewAdmin(rev.id)}
                                      className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-neutral-400 hover:text-[#D21B27] transition-all cursor-pointer"
                                      title="Delete Sensory Review"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === "interface" && (
                <div className="p-8 space-y-8 text-left animate-fade-in" id="admin-interface-workspace">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#D21B27] tracking-[0.2em] uppercase">Visual Experience CMS</span>
                      </div>
                      <h2 className="text-3xl font-serif text-white tracking-wide uppercase">Header Billboard</h2>
                      <p className="text-xs text-neutral-400 font-light mt-1">
                        Control visual slides on the home page hero marquee. Customize imagery, subtitles, titles, button call-to-actions, and paths.
                      </p>
                    </div>

                    <button
                      onClick={startAddSlide}
                      className="h-11 px-6 rounded-xl bg-[#D21B27] hover:bg-[#B0151E] text-white text-[11px] font-bold uppercase tracking-[0.15em] hover:shadow-lg hover:shadow-[#D21B27]/10 transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" /> Add Billboard Slide
                    </button>
                  </div>

                  {/* RECOMMENDED SPECIFICATION INFO DETAILS ALERT */}
                  <div className="p-5 border rounded-2xl border-amber-900/30 bg-amber-950/20 text-stone-200" id="cms-specification-guide">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      <div className="space-y-1 text-xs">
                        <h4 className="font-semibold text-amber-500 uppercase tracking-wider font-mono">Recommended Image Specifications:</h4>
                        <p className="text-stone-300 font-light leading-relaxed">
                          For absolute wide-screen visual elegance across displays:
                        </p>
                        <ul className="list-disc pl-4 space-y-1 pt-1 text-stone-300 font-mono text-[10.5px]">
                          <li><strong>Size & Resolution:</strong> Aspect ratio <strong>16:9</strong> (like <span className="text-amber-400">1920x1080px</span>) or panoramic wide aspect ratios (like <span className="text-amber-400">2560x1080px</span>) represent optimal coverage.</li>
                          <li><strong>File Weight:</strong> Compress images to under <strong>450KB</strong> (using modern formats like WebP or high-quality JPG) to maintain pristine load performance.</li>
                          <li><strong>Color Palette:</strong> Dark background textures work beautifully with the overlay white-display typography and intimate red details.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* SLIDES PREVIEW ROW/GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="cms-slides-collection">
                    {headerSlides.length === 0 ? (
                      <div className="col-span-1 md:col-span-2 p-12 text-center text-xs border border-dashed border-white/10 rounded-2xl bg-[#090203] text-neutral-500 font-mono">
                        No custom billboard slides declared. Storefront is displaying standard fallbacks.
                      </div>
                    ) : (
                      headerSlides.map((slide, idx) => (
                        <div key={slide.id} className="border border-white/[0.06] rounded-2xl bg-zinc-950 overflow-hidden flex flex-col relative group transition-all duration-300 hover:border-[#D21B27]/20 hover:shadow-xl hover:shadow-[#D21B27]/5">
                          
                          {/* Slide preview snapshot */}
                          <div className="aspect-[21/9] w-full bg-zinc-900 relative overflow-hidden">
                            <img 
                              src={slide.image} 
                              alt={slide.title} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 text-left">
                              <span className="text-[9px] font-mono tracking-widest text-[#D21B27] font-bold uppercase mb-1">{slide.subtitle || "Neckline Active Scent"}</span>
                              <h3 className="text-base font-serif text-white uppercase leading-tight">{slide.title}</h3>
                            </div>
                            <span className="absolute top-3 right-3 shrink-0 h-5 px-2 bg-stone-900/80 backdrop-blur border border-white/10 text-[9px] font-mono text-[#C29F68] rounded-full flex items-center font-bold">
                              Slide {idx + 1}
                            </span>
                          </div>

                          {/* Slide specs description */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-xs">
                            <div className="space-y-1 text-left">
                              <span className="font-mono text-[9px] uppercase tracking-wider block text-zinc-500 font-bold">Overlay Commentary:</span>
                              <p className="line-clamp-2 font-light leading-relaxed text-stone-300">{slide.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 text-[10.5px] text-left">
                              <div>
                                <span className="font-mono text-[9px] text-zinc-500 uppercase block tracking-wider font-bold">Button CTA:</span>
                                <span className="font-semibold text-white">{slide.buttonText}</span>
                              </div>
                              <div>
                                <span className="font-mono text-[9px] text-zinc-500 uppercase block tracking-wider font-bold">Routes Anchor:</span>
                                <span className="font-semibold text-red-500 font-mono">#{slide.linkTo}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-white/[0.04] pt-4 mt-auto">
                              <button
                                onClick={() => startEditSlide(slide)}
                                className="h-9 px-4 rounded-lg bg-zinc-900 border border-white/10 hover:border-amber-600/40 text-amber-500 hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Edit className="w-3 h-3" /> Edit Slide
                              </button>
                              <button
                                onClick={() => handleDeleteSlide(slide.id)}
                                className="h-9 px-4 rounded-lg bg-red-950/10 border border-red-950/20 hover:border-red-500 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>

                  {/* BEAUTIFUL "HOW TO APPLY" CONFIGURATION SUB-SECTION */}
                  <div className="border-t border-white/[0.05] pt-10 mt-12" id="cms-apply-setup-section">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#D21B27] tracking-[0.2em] uppercase">UX Section Customizer</span>
                      </div>
                      <h2 className="text-3xl font-serif text-white tracking-wide uppercase">"How To Apply" Experience Settings</h2>
                      <p className="text-xs text-neutral-400 font-light mt-1 mb-8">
                        Configure the global brand accent color, steps description text, titles, and replace standard Lucide icons with custom uploaded assets.
                      </p>
                    </div>

                    {/* Accent Color picker */}
                    <div className="p-6 border border-white/[0.05] rounded-2xl bg-[#090203] flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Brand Accent Color</h4>
                        <p className="text-xs text-neutral-500 font-light mt-0.5">
                          Controls the custom highlight tone for headers, pulse points, icons, and pro-tips across the page.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={applyColor} 
                          onChange={(e) => setApplyColor(e.target.value)} 
                          className="w-12 h-12 bg-transparent border-0 rounded-lg cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={applyColor} 
                          onChange={(e) => setApplyColor(e.target.value)} 
                          className="h-10 w-24 px-3 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-stone-200 text-center uppercase"
                        />
                      </div>
                    </div>

                    {/* Step-by-Step interactive panels */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8" id="cms-steps-grid">
                      {applySteps.length === 0 ? (
                        <div className="col-span-5 text-center text-xs font-mono text-zinc-500 py-12 border border-dashed border-white/10 rounded-2xl">
                          Loading application steps datasets...
                        </div>
                      ) : (
                        applySteps.map((step, idx) => (
                          <div key={idx} className="border border-white/[0.04] rounded-2xl bg-zinc-950 p-5 flex flex-col justify-between space-y-4 hover:border-white/[0.08] transition-all relative">
                            <span 
                              className="absolute top-4 right-4 h-5 px-1.5 rounded bg-stone-900 border border-white/10 text-[9px] font-mono font-bold"
                              style={{ color: applyColor }}
                            >
                              Step {step.num || `0${idx+1}`}
                            </span>

                            <div className="space-y-3">
                              <label className="block text-[9px] font-mono uppercase text-zinc-500 font-bold tracking-wider">Step Title</label>
                              <input 
                                type="text"
                                value={step.title || ""}
                                onChange={(e) => handleUpdateStepField(idx, "title", e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
                                placeholder="E.g. SWIPE"
                              />

                              <label className="block text-[9px] font-mono uppercase text-zinc-500 font-bold tracking-wider">Instructions</label>
                              <textarea 
                                value={step.desc || ""}
                                onChange={(e) => handleUpdateStepField(idx, "desc", e.target.value)}
                                className="w-full h-20 p-2.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-stone-300 resize-none font-light leading-relaxed"
                                placeholder="Instructions detail..."
                              />

                              {/* Icon mode selector */}
                              <div className="space-y-2 pt-1">
                                <label className="block text-[9px] font-mono uppercase text-zinc-500 font-bold tracking-wider">Icon Mode</label>
                                <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-lg border border-white/5">
                                  <button 
                                    onClick={() => handleUpdateStepField(idx, "iconType", "preset")}
                                    className={`h-7 rounded text-[9px] font-bold uppercase tracking-wider ${step.iconType === "preset" ? "bg-[#D21B27] text-white" : "text-zinc-500 hover:text-white"}`}
                                  >
                                    Preset
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateStepField(idx, "iconType", "custom")}
                                    className={`h-7 rounded text-[9px] font-bold uppercase tracking-wider ${step.iconType === "custom" ? "bg-[#D21B27] text-white" : "text-zinc-500 hover:text-white"}`}
                                  >
                                    Custom
                                  </button>
                                </div>
                              </div>

                              {/* Preset Dropdown or Custom Uploader */}
                              {step.iconType === "preset" ? (
                                <div className="space-y-2">
                                  <label className="block text-[9px] font-mono uppercase text-zinc-500 font-bold tracking-wider">Preset Icon</label>
                                  <select 
                                    value={step.presetName || "Fingerprint"}
                                    onChange={(e) => handleUpdateStepField(idx, "presetName", e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-white/10 text-xs text-stone-300 uppercase font-mono"
                                  >
                                    <option value="Fingerprint">Fingerprint</option>
                                    <option value="CircleDot">CircleDot</option>
                                    <option value="Flame">Flame</option>
                                    <option value="Feather">Feather</option>
                                    <option value="Infinity">Infinity</option>
                                    <option value="Hand">Hand</option>
                                    <option value="Droplet">Droplet</option>
                                    <option value="Sparkles">Sparkles</option>
                                    <option value="RefreshCcw">RefreshCcw</option>
                                    <option value="Heart">Heart</option>
                                    <option value="Smile">Smile</option>
                                    <option value="Compass">Compass</option>
                                    <option value="Eye">Eye</option>
                                    <option value="Stars">Stars</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <label className="block text-[9px] font-mono uppercase text-zinc-500 font-bold tracking-wider">Custom Icon</label>
                                  {step.customIconUrl === "uploading" ? (
                                    <div className="flex items-center justify-center gap-2 p-3 border border-white/10 bg-zinc-900 rounded-lg text-[9px] font-mono text-zinc-400">
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D21B27]" />
                                      <span>Backing up to Storage...</span>
                                    </div>
                                  ) : step.customIconUrl ? (
                                    <div className="flex items-center gap-2 p-2 border border-white/10 bg-zinc-900 rounded-lg">
                                      <img 
                                        src={step.customIconUrl} 
                                        alt="Preview" 
                                        className="w-8 h-8 object-contain shrink-0 bg-black/40 p-1 border border-white/5 rounded"
                                        referrerPolicy="no-referrer"
                                      />
                                      <button 
                                        onClick={() => handleUpdateStepField(idx, "customIconUrl", "")}
                                        className="text-[9px] font-mono uppercase font-bold text-red-500 hover:text-red-400 bg-red-950/20 hover:bg-red-950/40 px-2 py-1 rounded"
                                      >
                                        Remove
                                      </button>
                                      <div className="ml-auto text-[7px] font-mono text-emerald-500 tracking-tight uppercase flex items-center gap-0.5 whitespace-nowrap bg-emerald-950/20 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                        <Check className="w-2.5 h-2.5" /> Checked
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="relative group flex items-center justify-center p-3 border border-dashed border-white/10 bg-zinc-900 rounded-lg hover:border-white/20 transition-all cursor-pointer">
                                      <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleIconUpload(idx, file);
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      />
                                      <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 transition-all font-mono">Upload SVG/PNG</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.04]">
                      {applyMessage.text && (
                        <span className={`text-xs font-mono font-medium ${applyMessage.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
                          {applyMessage.text}
                        </span>
                      )}
                      
                      <button 
                        onClick={saveHowToApplyConfig}
                        disabled={isUpdatingApply}
                        className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white text-[11px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isUpdatingApply ? "Saving..." : "Apply Config Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Keep other tabs (reports, settings) properly rendered */}
              {currentTab !== "dashboard" && currentTab !== "products" && 
               currentTab !== "orders" && currentTab !== "customers" && 
               currentTab !== "analytics" && currentTab !== "offers" && 
               currentTab !== "reviews" && currentTab !== "interface" && (
                <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-center" id="pending-tabs-placeholder">
                  
                  {/* Subtle pulsing orb badge */}
                  <div className="w-16 h-16 rounded-full bg-[#D21B27]/10 flex items-center justify-center border border-[#D21B27]/25 mb-6 text-[#D21B27] text-xl animate-pulse">
                    ✦
                  </div>

                  <h3 className="text-2xl font-serif text-white uppercase tracking-widest">
                    {currentTab} WORKSPACE SEGMENT
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-md font-light leading-relaxed mt-2" id="dashboard-dynamic-description">
                    This module is active and properly integrated with real-time application data sensors and performance matrices.
                  </p>
                  
                  <button
                    onClick={() => setCurrentTab("dashboard")}
                    className="mt-6 px-6 py-2.5 bg-[#D21B27] hover:bg-[#B0151E] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-lg"
                  >
                    Return to Core Dashboard
                  </button>

                </div>
              )}

            </main>

          </div>
        )}

        {/* ========================================================== */}
        {/* MODAL: ADD NEW PRODUCT FORM */}
        {/* ========================================================== */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" id="add-product-modal-wrapper">
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                onClick={() => setIsAddModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-lg border rounded-2xl p-6 md:p-8 text-left z-10 shadow-2xl bg-zinc-950 border-white/[0.08]"
                id="add-product-modal-dialog"
              >
                
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/5 border border-white/5 hover:border-[#D21B27]/20 text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#D21B27]">✦</span>
                  <span className="text-xs uppercase font-mono tracking-widest text-[#C29F68] font-bold">Aura Catalog</span>
                </div>
                <h3 className="text-2xl font-serif text-white uppercase tracking-wider mb-6">Create New Scent</h3>

                <form onSubmit={handleAddProductSubmit} className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Scent Display Title</label>
                      <input 
                        type="text" 
                        required
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="e.g. CAIRO BLOSSOM"
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Category Class</label>
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27]"
                      >
                        <option value="Balms & Solid Perfumes">Balms & Solid Perfumes</option>
                        <option value="Tins">Tins</option>
                        <option value="Duo Packs">Duo Packs</option>
                        <option value="Gift Sets">Gift Sets</option>
                        <option value="Home Fragrance font-sans">Home Fragrance</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Mabhouh Price (EGP)</label>
                      <input 
                        type="number" 
                        required
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Stock Volume</label>
                      <input 
                        type="number" 
                        required
                        value={newProdStock}
                        onChange={(e) => setNewProdStock(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Custom Scent SKU code (Optional)</label>
                      <input 
                        type="text" 
                        value={newProdSku}
                        onChange={(e) => setNewProdSku(e.target.value)}
                        placeholder="e.g. #CS-BLO"
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Fragrance subtitle aura</label>
                      <input 
                        type="text" 
                        required
                        value={newProdSubtitle}
                        onChange={(e) => setNewProdSubtitle(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-2 text-left">
                    <ImageUploader 
                      onUploadComplete={(url) => setNewProdImage(url)} 
                      initialUrl={newProdImage} 
                      label="Scent Display Image (Upload)" 
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full h-11 bg-[#D21B27] hover:bg-[#B0151E] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer"
                    >
                      Save and Publish Scent Item
                    </button>
                  </div>

                </form>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================== */}
        {/* MODAL: EDIT PRODUCT FORM */}
        {/* ========================================================== */}
        <AnimatePresence>
          {isEditModalOpen && selectedProductToEdit && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn" id="edit-product-modal-wrapper">
              
              <div 
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedProductToEdit(null);
                }}
              />

              <div
                className="relative w-full max-w-lg border rounded-2xl p-6 md:p-8 text-left z-10 shadow-2xl bg-zinc-950 border-white/[0.08]"
                id="edit-product-modal-dialog"
              >
                
                <button 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedProductToEdit(null);
                  }}
                  className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/5 border border-white/5 hover:border-[#D21B27]/20 text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#D21B27]">✦</span>
                  <span className="text-xs uppercase font-mono tracking-widest text-[#C29F68] font-bold">Aura Catalog Updates</span>
                </div>
                <h3 className="text-2xl font-serif text-white uppercase tracking-wider mb-6">Modify Scent Specs</h3>

                <form onSubmit={handleEditProductSubmit} className="space-y-4">
                  
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Scent Display Title</label>
                    <input 
                      type="text" 
                      required
                      value={editProdName}
                      onChange={(e) => setEditProdName(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Mabhouh Price (EGP)</label>
                      <input 
                        type="number" 
                        required
                        value={editProdPrice}
                        onChange={(e) => setEditProdPrice(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Stock Volume</label>
                      <input 
                        type="number" 
                        required
                        value={editProdStock}
                        onChange={(e) => setEditProdStock(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Scent SKU Code</label>
                      <input 
                        type="text" 
                        required
                        value={editProdSku}
                        onChange={(e) => setEditProdSku(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Aura Subtitle</label>
                      <input 
                        type="text" 
                        required
                        value={editProdSubtitle}
                        onChange={(e) => setEditProdSubtitle(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-2 text-left">
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-3">Product Gallery & Hero Image</label>
                    <div className="flex flex-col gap-4">
                      {[0, 1, 2].map((idx) => (
                        <div key={idx} className={`p-3 rounded-xl border ${editProdHeroIndex === idx ? 'border-[#D21B27] bg-[#D21B27]/5' : 'border-white/10 bg-white/[0.02]'} transition-colors`}>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] uppercase text-neutral-400 font-mono">Image {idx + 1}</span>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="heroImageSelection" 
                                checked={editProdHeroIndex === idx} 
                                onChange={() => setEditProdHeroIndex(idx)} 
                                className="accent-[#D21B27]"
                              />
                              <span className="text-[10px] text-white/70 uppercase">Set as Hero</span>
                            </label>
                          </div>
                          <ImageUploader 
                            onUploadComplete={(url) => {
                              const newGallery = [...editProdGalleryImages];
                              newGallery[idx] = url;
                              setEditProdGalleryImages(newGallery);
                              if (editProdHeroIndex === idx) setEditProdImage(url);
                            }} 
                            initialUrl={editProdGalleryImages[idx] || ""} 
                            label={`Upload Image ${idx + 1}`} 
                          />
                          <div className="mt-2">
                            <input 
                              type="text" 
                              placeholder="Or manual URL..."
                              value={editProdGalleryImages[idx] || ""}
                              onChange={(e) => {
                                const newGallery = [...editProdGalleryImages];
                                newGallery[idx] = e.target.value;
                                setEditProdGalleryImages(newGallery);
                                if (editProdHeroIndex === idx) setEditProdImage(e.target.value);
                              }}
                              className="w-full h-8 px-3 text-xs bg-black/40 border border-white/5 rounded-md text-neutral-400 outline-none focus:border-[#D21B27]/50 transition-colors font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 font-sans">
                    <button 
                      type="submit"
                      className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer"
                    >
                      Update Scent Details
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================== */}
        {/* MODAL: ADD SENSORY REVIEW */}
        {/* ========================================================== */}
        <AnimatePresence>
          {isAddReviewOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 shadow-3xl" id="add-review-modal-wrapper">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                onClick={() => setIsAddReviewOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-lg border rounded-2xl p-6 md:p-8 text-left z-10 bg-zinc-950 border-white/[0.08]"
                id="add-review-modal-dialog"
              >
                <button 
                  onClick={() => setIsAddReviewOpen(false)}
                  className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/5 border border-white/5 hover:border-[#D21B27]/20 text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#D21B27]">✦</span>
                  <span className="text-xs uppercase font-mono tracking-widest text-[#C29F68] font-bold">Feedback Seeding</span>
                </div>
                <h3 className="text-2xl font-serif text-white uppercase tracking-wider mb-6">Add Sensory Review</h3>

                <form onSubmit={handleAddReviewAdmin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Customer Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sandra L."
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Target Fragrance</label>
                      <select 
                        value={newReviewProduct}
                        onChange={(e) => setNewReviewProduct(e.target.value)}
                        className="w-full h-10 px-3 bg-zinc-90 w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#D21B27] cursor-pointer"
                      >
                        <option value="CAIRO">CAIRO OUD</option>
                        <option value="MIDNIGHT">MIDNIGHT</option>
                        <option value="VELVET">VELVET</option>
                        <option value="EMBER">EMBER</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Sensory Rating</label>
                      <select 
                        value={newReviewRating}
                        onChange={(e) => setNewReviewRating(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-zinc-90 w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#D21B27] cursor-pointer"
                      >
                        <option value={5}>5 Stars (Perfect)</option>
                        <option value={4}>4 Stars (Intoxicating)</option>
                        <option value={3}>3 Stars (Decent)</option>
                        <option value={2}>2 Stars (Faint)</option>
                        <option value={1}>1 Star (None)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Fragrance Comment</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Provide the raw sensory response or skin melt commentary..."
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="w-full p-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full h-11 bg-[#D21B27] hover:bg-[#B0151E] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer"
                    >
                      Publish Sensory Review
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================== */}
        {/* MODAL: EDIT/MODIFY SENSORY REVIEW */}
        {/* ========================================================== */}
        <AnimatePresence>
          {editingReview && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 shadow-3xl" id="edit-review-modal-wrapper">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                onClick={() => setEditingReview(null)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-lg border rounded-2xl p-6 md:p-8 text-left z-10 bg-zinc-950 border-white/[0.08]"
                id="edit-review-modal-dialog"
              >
                <button 
                  onClick={() => setEditingReview(null)}
                  className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/5 border border-white/5 hover:border-[#D21B27]/20 text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-500">✦</span>
                  <span className="text-xs uppercase font-mono tracking-widest text-[#C29F68] font-bold">Feedback Tuning</span>
                </div>
                <h3 className="text-2xl font-serif text-white uppercase tracking-wider mb-6">Modify Sensory Review</h3>

                <form onSubmit={handleEditReviewAdminSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Customer Name</label>
                      <input 
                        type="text" 
                        required
                        value={edtReviewName}
                        onChange={(e) => edtSetReviewName(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Review Date</label>
                      <input 
                        type="text" 
                        required
                        value={edtReviewDate}
                        onChange={(e) => edtSetReviewDate(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Target Fragrance</label>
                      <select 
                        value={edtReviewProduct}
                        onChange={(e) => edtSetReviewProduct(e.target.value)}
                        className="w-full h-10 px-3 bg-zinc-90 w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#D21B27] cursor-pointer"
                      >
                        <option value="CAIRO">CAIRO OUD</option>
                        <option value="MIDNIGHT">MIDNIGHT</option>
                        <option value="VELVET">VELVET</option>
                        <option value="EMBER">EMBER</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Sensory Rating</label>
                      <select 
                        value={edtReviewRating}
                        onChange={(e) => edtSetReviewRating(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-zinc-90 w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#D21B27] cursor-pointer"
                      >
                        <option value={5}>5 Stars (Perfect)</option>
                        <option value={4}>4 Stars (Intoxicating)</option>
                        <option value={3}>3 Stars (Decent)</option>
                        <option value={2}>2 Stars (Faint)</option>
                        <option value={1}>1 Star (None)</option>
                      </select>
                    </div>
                  </div>

                  <div className="font-sans">
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Verified Scent Buyer</label>
                    <select 
                      value={edtReviewVerified ? "yes" : "no"}
                      onChange={(e) => edtSetReviewVerified(e.target.value === "yes")}
                      className="w-full h-10 px-3 bg-zinc-90 w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#D21B27] cursor-pointer"
                    >
                      <option value="yes">Yes, verified buyer</option>
                      <option value="no">No, community feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Fragrance Comment</label>
                    <textarea 
                      required
                      rows={4}
                      value={edtReviewComment}
                      onChange={(e) => edtSetReviewComment(e.target.value)}
                      className="w-full p-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors resize-none font-light"
                    />
                  </div>

                  <div className="pt-4 font-sans">
                    <button 
                      type="submit"
                      className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer"
                    >
                      Save Review Modifications
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================== */}
        {/* MODAL: ADD/EDIT CAROUSEL SLIDE */}
        {/* ========================================================== */}
        <AnimatePresence>
          {isSlideModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 shadow-3xl" id="slide-cms-modal-wrapper">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                onClick={() => {
                  setIsSlideModalOpen(false);
                  setSelectedSlideToEdit(null);
                }}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-lg border rounded-2xl p-6 md:p-8 text-left z-10 bg-zinc-950 border-white/[0.08]"
                id="slide-cms-modal-dialog"
              >
                <button 
                  onClick={() => {
                    setIsSlideModalOpen(false);
                    setSelectedSlideToEdit(null);
                  }}
                  className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/5 border border-white/5 hover:border-[#D21B27]/20 text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-2 font-sans">
                  <span className="text-[#D21B27]">✦</span>
                  <span className="text-xs uppercase font-mono tracking-widest text-[#C29F68] font-bold">Marquee CMS Tuning</span>
                </div>
                <h3 className="text-2xl font-serif text-white uppercase tracking-wider mb-6">
                  {selectedSlideToEdit ? "Modify Billboard Slide" : "Create Billboard Slide"}
                </h3>

                <form onSubmit={handleSlideFormSubmit} className="space-y-4 font-sans text-left">
                  <div className="pt-2 text-left">
                    <ImageUploader 
                      onUploadComplete={(url) => setSlideImage(url)} 
                      initialUrl={slideImage} 
                      label="Billboard Slide Image (Upload)" 
                    />
                    <div className="mt-2">
                      <label className="block text-[8px] uppercase tracking-wider text-neutral-500 font-mono font-bold mb-1">Manual Billboard URL / Path</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. https://images.unsplash.com/photo-example"
                        value={slideImage}
                        onChange={(e) => setSlideImage(e.target.value)}
                        className="w-full h-8 px-3 text-xs bg-white/[0.01] border border-white/10 rounded-xl text-neutral-400 outline-none focus:border-[#D21B27] transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Billboard Title</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Wear Your Scent"
                        value={slideTitle}
                        onChange={(e) => setSlideTitle(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Subtitle (Category Lead)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Solid Perfumes · Intense Intimacy"
                        value={slideSubtitle}
                        onChange={(e) => setSlideSubtitle(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Billboard Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Enter the main sensory sales hook or description..."
                      value={slideDescription}
                      onChange={(e) => setSlideDescription(e.target.value)}
                      className="w-full p-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors resize-none text-left font-light leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Button Text Accent</label>
                      <input 
                        type="text" 
                        required
                        value={slideButtonText}
                        onChange={(e) => setSlideButtonText(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/[0.03] border border-white/10 rounded-xl text-white outline-none focus:border-[#D21B27] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold mb-1.5">Button Action Target Link</label>
                      <select 
                        value={slideLinkTo}
                        onChange={(e) => setSlideLinkTo(e.target.value)}
                        className="w-full h-10 px-3 bg-zinc-90 w-full bg-zinc-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#D21B27] cursor-pointer"
                      >
                        <option value="collection">Product Catalog Anchor (#collection)</option>
                        <option value="story">Our Brand Story Anchor (#story)</option>
                        <option value="reviews">Sensory Reviews Space (#reviews)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full h-11 bg-[#D21B27] hover:bg-[#B0151E] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer"
                    >
                      {selectedSlideToEdit ? "Save Slide Changes" : "Commit New Slide"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AnimatePresence>
  );
}

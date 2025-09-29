"use client"

import { useEffect, useState } from "react"
import Slider from "react-slick"
import Image from "next/image"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
import { FaFire } from "react-icons/fa6"
import { Heart, Flame, ChevronLeft, ChevronRight } from "lucide-react"
import { FaRegClock } from "react-icons/fa"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Footer from "./components/footer/page"
import Navbar from "./components/navBar/page"
import { useDispatch, useSelector } from "react-redux"
import { getProducts } from "./actions/productAction" 
import { getCategories } from "./actions/categoryAction"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AiFillStar, AiOutlineStar, AiTwotoneStar } from 'react-icons/ai';
import Loader from "./components/loader/page"
import { addToCart } from "./slices/cartSlice";
import { addToWishlist } from "./slices/wishlistSlice";
import { toast, Toaster } from 'sonner';
import { FiShoppingBag } from 'react-icons/fi'
import { FaUserCircle } from 'react-icons/fa'

const images = ["/1.jpg", "/2.jpg", "/3.jpg"]

export default function FancyCarousel() {
  const { allProducts } = useSelector((state) => state.productsState)
  const { categories = [] } = useSelector((state) => state.categoriesState || {})
  const { isAuthenticated } = useSelector((state) => state.userState)
  const dispatch = useDispatch()

  const [loading, setLoading] = useState(true);
  const [localCategories, setLocalCategories] = useState([]);

  const [heroSections, setHeroSections] = useState([]);
  const [heroImages, setHeroImages] = useState([]);
  const [events, setEvents] = useState([]);

  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiUrl2 = process.env.NEXT_PUBLIC_API_URL_2;

  // Event data for Upcoming Events section
  const staticEvents = [
    {
      name: "Father's Day",
      key: "fathers-day",
      image: "/fatherday.jpg", // Add this image to public if not present
    },
    {
      name: "Mother's Day",
      key: "mothers-day",
      image: "/motherday.jpg",
    },
    {
      name: "Birthday",
      key: "birthday",
      image: "/birthday-invitation.svg",
    },
    {
      name: "Brother's Day",
      key: "brothers-day",
      image: "/profile-avatar.png", // Use a suitable image or add one
    },
    {
      name: "Christmas",
      key: "christmas",
      image: "/christmas.jpg", // Add this image to public if not present
    },
    {
      name: "New Year",
      key: "newyear",
      image: "/newyear.jpg", // Add this image to public if not present
    },
  ];

  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [sliderRef, setSliderRef] = useState(null);
  const [randomAllProducts, setRandomAllProducts] = useState([]);
  const [randomAllLoading, setRandomAllLoading] = useState(false);

  useEffect(() => {
    dispatch(getProducts())
    dispatch(getCategories())

    // Fetch categories from backend with fallback URL
    const fetchCategories = async () => {
      try {
        const baseUrl = apiUrl || 'https://best-wishes-final-production-e20b.up.railway.app/api';
        console.log('Fetching categories from:', `${baseUrl}/categories`);
        const res = await fetch(`${baseUrl}/categories`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Categories response:', data);
        
        // If data is an array, use it directly; if wrapped in {data: []}, unwrap
        const cats = Array.isArray(data) ? data : (data.data || []);
        setLocalCategories(cats);
        console.log('Local categories set:', cats);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setLocalCategories([]);
      }
    };


    // Fetch hero sections from backend
    const fetchHeroSections = async () => {
      try {
        const baseUrl = apiUrl || 'https://best-wishes-final-production-e20b.up.railway.app/api';
        const res = await fetch(`${baseUrl}/hero-sections/active`);
        const data = await res.json();
        if (data.success && data.data) {
          setHeroSections(data.data);
        } else {
          // Fallback to static images if no hero sections
          setHeroSections([
            { image: "/1.jpg", title: "Welcome", description: "Slide 1" },
            { image: "/2.jpg", title: "Explore", description: "Slide 2" },
            { image: "/3.jpg", title: "Discover", description: "Slide 3" }
          ]);
        }
      } catch (err) {
        console.error("Error fetching hero sections:", err);
        // Fallback to static images
        setHeroSections([
          { image: "/1.jpg", title: "Welcome", description: "Slide 1" },
          { image: "/2.jpg", title: "Explore", description: "Slide 2" },
          { image: "/3.jpg", title: "Discover", description: "Slide 3" }
        ]);
      }
    };

    // Fetch only images from HeroSection database
    const fetchHeroImages = async () => {
      try {
        const baseUrl = apiUrl || 'https://best-wishes-final-production-e20b.up.railway.app/api';
        const res = await fetch(`${baseUrl}/hero-sections/active`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Only extract image URLs
          setHeroImages(data.data.map(item => item.image).filter(Boolean));
        } else {
          setHeroImages(["/1.jpg", "/2.jpg", "/3.jpg"]);
        }
      } catch (err) {
        setHeroImages(["/1.jpg", "/2.jpg", "/3.jpg"]);
      }
    };

    // Fetch active events from backend
    const fetchActiveEvents = async () => {
      try {
        const baseUrl = apiUrl || 'https://best-wishes-final-production-e20b.up.railway.app/api';
        const response = await fetch(`${baseUrl}/events?isActive=true`);
        const data = await response.json();
        if (data.events && data.events.length > 0) {
          const activeEvents = data.events.filter(event => event.isActive); // Filter active events
          setEvents(activeEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error("Error fetching active events:", error);
        setEvents([]);
      }
    };

    fetchCategories();
    fetchHeroSections();
    fetchHeroImages();
    fetchActiveEvents();

    fetchCategories();

    // Fetch a random sample of products for the All Products grid
    const fetchRandomAll = async () => {
      try {
        setRandomAllLoading(true);
        const baseUrl = apiUrl || 'https://best-wishes-final-production-e20b.up.railway.app/api';
        const res = await fetch(`${baseUrl}/products/random?limit=12`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setRandomAllProducts(data.data);
        } else if (Array.isArray(data)) {
          // Some APIs return arrays directly
          setRandomAllProducts(data.slice(0, 12));
        } else {
          // Fallback: shuffle local allProducts if available
          if (Array.isArray(allProducts) && allProducts.length > 0) {
            const shuffled = [...allProducts].sort(() => Math.random() - 0.5).slice(0, 12);
            setRandomAllProducts(shuffled);
          } else {
            setRandomAllProducts([]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch random products:', e);
        // Fallback: local shuffle
        if (Array.isArray(allProducts) && allProducts.length > 0) {
          const shuffled = [...allProducts].sort(() => Math.random() - 0.5).slice(0, 12);
          setRandomAllProducts(shuffled);
        } else {
          setRandomAllProducts([]);
        }
      } finally {
        setRandomAllLoading(false);
      }
    };

    fetchRandomAll();

  }, [dispatch])

  // If server random fetch failed/empty, derive a random sample from redux products when they arrive
  useEffect(() => {
    if ((!randomAllProducts || randomAllProducts.length === 0) && Array.isArray(allProducts) && allProducts.length > 0) {
      const shuffled = [...allProducts].sort(() => Math.random() - 0.5).slice(0, 12);
      setRandomAllProducts(shuffled);
    }
  }, [allProducts]);

  // Helper function to get product image
  const getProductImage = (product) => {
    if (product?.images && product.images.length > 0) {
      if (typeof product.images[0] === 'object' && product.images[0].url) {
        return product.images[0].url;
      }
      return product.images[0];
    }
    return '/placeholder.svg';
  };

  // Helper function to check if image is external
  const isExternalImage = (src) => {
    return src && (src.startsWith('http://') || src.startsWith('https://'));
  };

  // Helper function to get category image
  const getCategoryImage = (category) => {
    if (category?.icon) {
      return category.icon;
    }
    if (category?.image) {
      return category.image;
    }
    // Fallback to icon or default image based on category name
    const categoryName = category?.name?.toLowerCase();
    if (categoryName?.includes('balloon')) return '/balloon.svg';
    if (categoryName?.includes('mug')) return '/mug.svg';
    if (categoryName?.includes('birthday') || categoryName?.includes('card')) return '/birthday-invitation.svg';
    if (categoryName?.includes('home') || categoryName?.includes('living')) return '/home.svg';
    return '/placeholder.svg';
  };

  const cards = [
    {
      icon: "✏️",
      title: "Customizable Gift",
      description:
        "Design gifts your way — choose packaging, add notes, select colors or themes. Every gift becomes a reflection of your style and emotion.",
    },
    {
      icon: "⏰",
      title: "Reminder Gift Notify",
      description:
        "Never miss special moments. Set reminders for birthdays, anniversaries, and holidays to ensure your loved ones feel remembered.",
    },
    {
      icon: "👨‍👩‍👦",
      title: "Collaborative Gift",
      description:
        "Invite your friends and family to join in on a special gift. Split the cost, share the joy, and create memorable surprises — together.",
    },
    {
      icon: "🎁",
      title: "Surprise Gift Delivery",
      description:
        "Schedule a surprise delivery for your loved ones at just the right moment. We'll handle the magic while you enjoy the reactions.",
    },
  ]

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
        },
      },
    ],
  }

  // Handle category click navigation - improved to use category key or name
  const handleCategoryClick = (category) => {
    console.log('Category clicked:', category);
    // Use category key if available, otherwise use name
    const categoryParam = category.key || category.name;
    if (categoryParam) {
      router.push(`/allProducts/showcase?category=${encodeURIComponent(categoryParam)}`);
    } else {
      console.error('No valid category parameter found');
    }
  };

  // Handle explore more functionality
  const handleExploreMore = () => {
    setShowMoreCategories(!showMoreCategories);
  };

  // Combine categories from multiple sources with priority: localCategories > redux categories > fallback
  const availableCategories = (() => {
    if (localCategories && localCategories.length > 0) {
      console.log('Using local categories:', localCategories);
      return localCategories;
    }
    if (categories && categories.length > 0) {
      console.log('Using redux categories:', categories);
      return categories;
    }
    console.log('Using fallback categories');
    return [
      { name: "Balloons", key: "balloon", image: "/balloon.svg" },
      { name: "Mugs", key: "mug", image: "/mug.svg" },
      { name: "Birthday Cards", key: "card", image: "/birthday-invitation.svg" },
      { name: "Home & Living", key: "home-living", image: "/home.svg" },
      { name: "Party Supplies", key: "party", image: "/party.svg" },
      { name: "Decorations", key: "decoration", image: "/decoration.svg" },
    ];
  })();

  // Ensure unique categories
  const uniqueCategories = Array.isArray(availableCategories) 
    ? Array.from(new Set(availableCategories.map(category => category.name)))
        .map(name => availableCategories.find(category => category.name === name))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Hero Carousel */}
        <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] relative rounded-xl overflow-hidden shadow-lg">
          {/* Custom Arrows - default style, no purple or gradient */}
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
            <button
              className="pointer-events-auto bg-white rounded-full p-2 shadow-lg hover:scale-105 transition ml-2"
              onClick={() => sliderRef && sliderRef.slickPrev()}
              aria-label="Previous Slide"
              type="button"
              style={{ zIndex: 20 }}
            >
              <ChevronLeft className="w-7 h-7 text-gray-700" />
            </button>
            <button
              className="pointer-events-auto bg-white rounded-full p-2 shadow-lg hover:scale-105 transition mr-2"
              onClick={() => sliderRef && sliderRef.slickNext()}
              aria-label="Next Slide"
              type="button"
              style={{ zIndex: 20 }}
            >
              <ChevronRight className="w-7 h-7 text-gray-700" />
            </button>
          </div>
          <Slider {...settings} ref={setSliderRef}>
            {(heroImages.length > 0 ? heroImages : images).map((src, index) => (
              <div key={index} className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px]">
                <Image
                  src={src || "/placeholder.svg"}
                  alt={`Slide ${index}`}
                  fill
                  className="object-cover animate-slide"
                  priority={index === 0}
                />
              </div>
            ))}
          </Slider>
        </div>

        {/* Categories Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Shop by Categories</h2>
            <Button
              variant="ghost"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200 hover:cursor-pointer"
              onClick={handleExploreMore}
            >
              {showMoreCategories ? 'Show Less' : 'Explore more'}
              <ChevronRight className={`ml-1 h-4 w-4 transition-transform duration-200  ${showMoreCategories ? 'rotate-90' : ''}`} />
            </Button>
          </div>


          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {availableCategories.slice(0, 6).map((category, index) => (
              <div 
                key={category._id || category.key || index} 
                className="flex flex-col items-center space-y-2 group cursor-pointer transform hover:scale-105 transition-all duration-300"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gray-200 overflow-hidden group-hover:border-purple-400 group-hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
                  <Image
                    src={getCategoryImage(category)}
                    alt={category.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-xs sm:text-sm text-center text-gray-700 group-hover:text-purple-600 transition-colors font-medium">
                  {category.name}
                </span>
              </div>
            ))}
          </div>


          {showMoreCategories && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 mt-4">
              {availableCategories.slice(6).map((category, index) => (
                <div 
                  key={category._id || category.key || index} 
                  className="flex flex-col items-center space-y-2 group cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gray-200 overflow-hidden group-hover:border-purple-400 group-hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
                    <Image
                      src={getCategoryImage(category)}
                      alt={category.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-xs sm:text-sm text-center text-gray-700 group-hover:text-purple-600 transition-colors font-medium">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
          )}

        </section>
   

        {/* Hot Sales Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <FaFire className="text-red-500" />
              Hot Sales
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {allProducts && allProducts.length > 0 ? (
              allProducts.filter(product => Math.floor(product.rating || 0) === 5).slice(0, 6).map((product) => (
                <Link key={product._id} href={`/productDetail/${product._id}`} className="block">
                  <CardContent className="p-0 border-1 border-[#D9D9D9] rounded-[10px]">
                    <div className="relative">
                      <Image
                        src={product.images[0].url || "/placeholder.svg"}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="w-full aspect-square object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 left-2 bg-red-100 rounded-full p-1">
                        <Flame className="text-red-500 w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="absolute top-2 right-2 bg-purple-100 rounded-full p-1 cursor-pointer hover:bg-purple-200 transition-colors"
                        onClick={e => {
                          e.preventDefault();
                          if (!isAuthenticated) return alert('Please login to add to wishlist');
                          dispatch(addToWishlist(product));
                          toast.success('Added to wishlist!');
                        }}
                      >
                        <Heart className="text-purple-500 w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm sm:text-base truncate">{product.name}</h3>
                      <p className="font-semibold text-purple-600 text-sm sm:text-base">UK £{product.price || product.retailPrice}</p>
                      <div className="flex text-yellow-400 text-xs sm:text-sm mt-1">
                        {Array.from({ length: 5 }, (_, i) => {
                          const fullStars = Math.floor(product.rating || 0);
                          const hasHalfStar = (product.rating || 0) - fullStars >= 0.5;
                          if (i < fullStars) {
                            return <AiFillStar key={i} />;
                          } else if (i === fullStars && hasHalfStar) {
                            return <AiTwotoneStar key={i} />;
                          } else {
                            return <AiOutlineStar key={i} />;
                          }
                        })}
                      </div>
                      <Button
                        className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={e => {
                          e.preventDefault();
                          if (!isAuthenticated) return alert('Please login to add to cart');
                          dispatch(addToCart({ product, quantity: 1 }));
                          toast.success('Added to cart!');
                        }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Link>
              ))
            ) : (
              // Fallback to static items if no products
              [1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative">
                      <Image
                        src="/mug.jpg"
                        alt="Birthday Mug"
                        width={200}
                        height={200}
                        className="w-full aspect-square object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 left-2 bg-red-100 rounded-full p-1">
                        <Flame className="text-red-500 w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="absolute top-2 right-2 bg-purple-100 rounded-full p-1 cursor-pointer hover:bg-purple-200 transition-colors">
                        <Heart className="text-purple-500 w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm sm:text-base truncate">Birthday Mug</h3>
                      <p className="font-semibold text-purple-600 text-sm sm:text-base">UK £25.75</p>
                      <div className="flex text-yellow-400 text-xs sm:text-sm mt-1">
                        <span>★★★★★</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <FaRegClock className="text-purple-600" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Upcoming Events</h2>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                  <div className="relative h-32 sm:h-40 lg:h-48">
                    <Image
                      src={event.image || "/placeholder.svg"}
                      alt={event.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{event.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      <span className="animate-blink font-bold bg-gradient-to-r from-pink-400 via-yellow-400 to-purple-400 bg-clip-text text-transparent">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </p>
                    <Button
                      className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => router.push(`/allProducts/showcase`)}
                    >
                      Explore More
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No upcoming events at the moment. Check back later!</p>
              </div>
            )}
          </div>
        </section>

        {/* All Products */}

        <section className="space-y-6 ">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              All Products
            </h2>
            <Button
              variant="ghost"
              className="text-purple-600 hover:text-purple-700 hover:cursor-pointer"
              onClick={() => router.push("/allProducts/showcase")}>
              Explore more <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ">
            {randomAllLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading products...</p>
              </div>
            ) : randomAllProducts && randomAllProducts.length > 0 ? (
              randomAllProducts.map((product) => (
                <Link key={product._id} href={`/productDetail/${product._id}`} className="block">
                  <CardContent className="p-0 border-1 border-[#D9D9D9] rounded-[10px]">
                    <div className="relative">
                      <Image
                        src={getProductImage(product)}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="w-full aspect-square object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 left-2 bg-red-100 rounded-full p-1">
                        <Flame className="text-red-500 w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="absolute top-2 right-2 bg-purple-100 rounded-full p-1 cursor-pointer hover:bg-purple-200 transition-colors"
                        onClick={e => {
                          e.preventDefault();
                          if (!isAuthenticated) return alert('Please login to add to wishlist');
                          dispatch(addToWishlist(product));
                          toast.success('Added to wishlist!');
                        }}
                      >
                        <Heart className="text-purple-500 w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm sm:text-base truncate">{product.name}</h3>
                      <p className="font-semibold text-purple-600 text-sm sm:text-base">UK £{product.price || product.retailPrice}</p>
                      <div className="flex text-yellow-400 text-xs sm:text-sm mt-1">
                        <div className="flex text-yellow-400 text-xs sm:text-sm mt-1">
                          {Array.from({ length: 5 }, (_, i) => {
                            const fullStars = Math.floor(product.rating || 0);
                            const hasHalfStar = (product.rating || 0) - fullStars >= 0.5;
                            if (i < fullStars) {
                              return <AiFillStar key={i} />;
                            } else if (i === fullStars && hasHalfStar) {
                              return <AiTwotoneStar key={i} />;
                            } else {
                              return <AiOutlineStar key={i} />;
                            }
                          })}
                        </div>
                      </div>
                      <Button
                        className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={e => {
                          e.preventDefault();
                          if (!isAuthenticated) return alert('Please login to add to cart');
                          dispatch(addToCart({ product, quantity: 1 }));
                          toast.success('Added to cart!');
                        }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-red-500 text-lg">Server currently busy!</p>
              </div>
            )}
          </div>
        </section>

        {/* Services Cards */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Our Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {cards.map((card, index) => (
              <div
                key={index}
                className="relative group rounded-2xl bg-white/70 backdrop-blur-md border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                style={{
                  border: "1.5px solid #d1b3ff",
                  boxShadow: "0 8px 32px 0 rgba(130,43,226,0.10)",
                }}
              >
                {/* Gradient Accent Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-400 to-yellow-400" />
                <div className="p-7 flex flex-col items-center gap-4">
                  {/* Icon with Glow */}
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">{card.icon}</span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-purple-700 text-center">{card.title}</h3>
                  <p className="text-gray-600 text-sm text-center">{card.description}</p>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-purple-600 text-purple-700 font-semibold rounded-lg hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 hover:text-white transition-all duration-200"
                  >
                    Explore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Services */}
        <section className="space-y-6">
          <Card className="border-2 border-purple-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-purple-600 text-white p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl">💖</div>
                <h2 className="text-xl font-semibold">Trending Services</h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <Image src="/decoration4.jpg" alt="decoration" fill className="object-cover" />
                      </div>
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <Image src="/decoration1.jpg" alt="decoration" fill className="object-cover" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <Image src="/decoration2.jpg" alt="decoration" fill className="object-cover" />
                      </div>
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <Image src="/decoration3.jpg" alt="decoration" fill className="object-cover" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="text-gray-600 leading-relaxed">
                      There are many variations of passages of Lorem Ipsum available, but the majority have suffered
                      alteration in some form, by injected humour, or randomised words which don't look even slightly
                      believable.
                    </p>

                    <div className="flex gap-4">
                      <div className="w-2 bg-purple-600 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="font-medium">All Decoration Items</div>
                        <div className="text-gray-600">Party Table</div>
                        <div className="text-gray-600">Other Elegant Items</div>
                      </div>
                    </div>

                    <Button className="w-full bg-purple-600 hover:bg-purple-700">Explore</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* About Us */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="relative h-64 sm:h-80 rounded-lg overflow-hidden">
              <Image src="/map.jpg" alt="Our location" fill className="object-cover" />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">About Us</h2>
              <p className="text-gray-600 leading-relaxed">
                There are many variations of passages of Lorem Ipsum available, but the majority have suffered
                alteration in some form, by injected humour, or randomised words which don't look even slightly
                believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything
                embarrassing hidden in the middle of text.
              </p>

              <div className="grid grid-cols-2 gap-8">
                <div className="flex gap-3">
                  <div className="w-2 bg-purple-600 rounded-full"></div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">2500+</div>
                    <div className="text-gray-600">Active users</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 bg-purple-600 rounded-full"></div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">10000+</div>
                    <div className="text-gray-600">Products</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />

      {/* Custom Carousel Styles */}
      <style jsx global>{`
        .slick-dots li button:before {
          font-size: 12px;
          color: #9333ea;
          opacity: 0.5;
        }

        .slick-dots li.slick-active button:before {
          color: #9333ea;
          opacity: 1;
        }

        .slick-prev:before,
        .slick-next:before {
          color: #9333ea;
          font-size: 24px;
        }

        @media (max-width: 768px) {
          .slick-prev:before,
          .slick-next:before {
            font-size: 20px;
          }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }

        @keyframes slide {
          0% { transform: translateX(0); }
          25% { transform: translateX(10px); }
          50% { transform: translateX(0); }
          75% { transform: translateX(-10px); }
          100% { transform: translateX(0); }
        }
        .animate-slide {
          animation: slide 2s infinite linear;
        }
      `}</style>

      <Toaster position="top-center" richColors closeButton />

      {/* Floating Actions */}
      <div className='fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3'>
        <button
          onClick={() => router.push(isAuthenticated ? "/user/profile" : "/login")}
          aria-label='Go to profile'
          className='w-12 h-12 rounded-full shadow-md bg-white hover:cursor-pointer hover:bg-gray-50 flex items-center justify-center border border-gray-200'
        >
          <FaUserCircle className='text-[35px] text-[#822BE2]' />
        </button>
        <button
          onClick={() => router.push('/allProducts')}
          aria-label='Go to shopping'
          className='flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl bg-[#822BE2] hover:bg-purple-700 text-white hover:cursor-pointer'
        >
          <FiShoppingBag className='text-[18px]' />
          <span className='hidden sm:inline'>Go to shopping</span>
        </button>
      </div>
    </div>
  )
}

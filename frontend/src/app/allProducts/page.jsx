"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts } from '../actions/productAction';
import { useSearchParams } from 'next/navigation';
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Heart, Flame, ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AiFillStar, AiOutlineStar, AiTwotoneStar } from 'react-icons/ai';
import { addToCart } from "../slices/cartSlice";
import { addToWishlist } from "../slices/wishlistSlice";
import { toast } from 'sonner';
import Navbar from "../components/navBar/page"
import Footer from "../components/footer/page"

const RATING_LEVELS = [
    { value: 5, label: '5 Stars' },
    { value: 4, label: '4 Stars & up' },
    { value: 3, label: '3 Stars & up' },
    { value: 2, label: '2 Stars & up' },
    { value: 1, label: '1 Star & up' },
];

function AllProducts() {
    const [mounted, setMounted] = useState(false);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    const dispatch = useDispatch();
    const { allProducts = [], loading, error } = useSelector((state) => state.productsState);
    const { isAuthenticated } = useSelector((state) => state.userState);

    const [filters, setFilters] = useState({
        categories: new Set(),
        price: { min: 0, max: 1000 },
        ratings: new Set(),
    });
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        dispatch(getProducts(searchQuery));
    }, [dispatch, searchQuery, mounted]);

    const { categories, maxPrice } = useMemo(() => {
        if (!allProducts || allProducts.length === 0) {
            return { categories: [], maxPrice: 1000 };
        }
        const categorySet = new Set(allProducts.map(p => p.mainCategory));
        const maxProductPrice = Math.max(...allProducts.map(p => p.price || 0), 0);
        return {
            categories: [...categorySet],
            maxPrice: Math.ceil(maxProductPrice / 100) * 100 || 1000,
        };
    }, [allProducts]);
    
    useEffect(() => {
        setFilters(f => ({ ...f, price: { min: 0, max: maxPrice } }));
    }, [maxPrice]);

    const handleCategoryChange = (category, checked) => {
        setFilters(prev => {
            const newCategories = new Set(prev.categories);
            if (checked) newCategories.add(category);
            else newCategories.delete(category);
            return { ...prev, categories: newCategories };
        });
    };

    const handleRatingChange = (rating, checked) => {
        setFilters(prev => {
            const newRatings = new Set(prev.ratings);
            if (checked) newRatings.add(rating);
            else newRatings.delete(rating);
            return { ...prev, ratings: newRatings };
        });
    };
    
    const handlePriceChange = (value) => {
        setFilters(f => ({ ...f, price: { ...f.price, max: value[0] } }));
    };

    const filteredProducts = useMemo(() => {
        return (allProducts || []).filter(product => {
            const { categories, price, ratings } = filters;
            const categoryMatch = categories.size === 0 || categories.has(product.mainCategory);
            const priceMatch = (product.price >= price.min && product.price <= price.max);
            const ratingMatch = ratings.size === 0 || ratings.has(Math.round(product.averageRating || 0));
            return categoryMatch && priceMatch && ratingMatch;
        });
    }, [allProducts, filters]);

    if (!mounted) return null;

    const renderRatingStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        return (
            <div className="flex items-center">
                {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} fill="orange" strokeWidth={0} className="w-4 h-4" />)}
                {halfStar && <Star fill="orange" strokeWidth={0} className="w-4 h-4" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />}
                {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} fill="lightgray" strokeWidth={0} className="w-4 h-4" />)}
            </div>
        );
    };

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

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <aside className="w-full md:w-72 flex-shrink-0">
                        <div className="bg-white p-4 rounded shadow-lg sticky top-24">
                            <h3 className="text-xl font-semibold mb-4">Filters</h3>
                            <Accordion type="multiple" defaultValue={['categories', 'price', 'rating']} className="w-full">
                                <AccordionItem value="categories">
                                    <AccordionTrigger>Categories</AccordionTrigger>
                                    <AccordionContent>
                                        {categories.map(cat => (
                                            <div key={cat} className="flex items-center space-x-2 mb-2">
                                                <Checkbox id={cat} onCheckedChange={(checked) => handleCategoryChange(cat, checked)} />
                                                <label htmlFor={cat} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{cat}</label>
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="price">
                                    <AccordionTrigger>Price</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="p-2">
                                            <div className="flex justify-between items-center mb-4">
                                                <span>$0</span>
                                                <span>${filters.price.max}</span>
                                            </div>
                                            <Slider defaultValue={[maxPrice]} max={maxPrice} step={10} onValueChange={handlePriceChange} />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="rating">
                                    <AccordionTrigger>Rating</AccordionTrigger>
                                    <AccordionContent>
                                        {RATING_LEVELS.map(level => (
                                            <div key={level.value} className="flex items-center space-x-2 mb-2">
                                                <Checkbox id={`rating-${level.value}`} onCheckedChange={(checked) => handleRatingChange(level.value, checked)} />
                                                <label htmlFor={`rating-${level.value}`} className="text-sm font-medium leading-none">{level.label}</label>
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <main className="flex-1">
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold">
                                {searchQuery ? `Results for "${searchQuery}"` : "All Products"}
                            </h2>
                            <p className="text-sm text-gray-500">{filteredProducts.length} results found</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {loading ? (
                                <p>Loading...</p>
                            ) : error ? (
                                <p className="text-red-500 col-span-full">{error}</p>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <Link key={product._id} href={`/productDetail/${product._id}`} className="block group">
                                        <Card className="overflow-hidden h-full flex flex-col">
                                            <CardContent className="p-0 flex-grow flex flex-col">
                                                <div className="relative">
                                                    <Image
                                                        src={getProductImage(product)}
                                                        alt={product.name}
                                                        width={250}
                                                        height={250}
                                                        className="w-full aspect-square object-cover rounded-t-lg transition-transform duration-300 group-hover:scale-105"
                                                        onError={(e) => {
                                                          e.target.src = '/placeholder.svg';
                                                        }}
                                                    />
                                                    <div className="absolute top-2 left-2 bg-red-100 rounded-full p-1">
                                                        <Flame className="text-red-500 w-4 h-4" />
                                                    </div>
                                                    <div className="absolute top-2 right-2 bg-purple-100 rounded-full p-1 cursor-pointer hover:bg-purple-200 transition-colors"
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            if (!isAuthenticated) return alert('Please login to add to wishlist');
                                                            dispatch(addToWishlist(product));
                                                            toast.success('Added to wishlist!');
                                                        }}
                                                    >
                                                        <Heart className="text-purple-500 w-4 h-4" />
                                                    </div>
                                                </div>
                                                <div className="p-3 flex-grow flex flex-col">
                                                    <h3 className="font-medium text-sm sm:text-base truncate mb-2">{product.name}</h3>
                                                    <p className="font-semibold text-purple-600 text-sm sm:text-base mb-2">
                                                        US ${product.price || product.retailPrice}
                                                    </p>
                                                    <div className="flex text-yellow-400 text-xs sm:text-sm mb-3">
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
                                                        className="mt-auto w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                                        </Card>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-gray-500 text-lg">No products found.</p>
                                </div>
                            )}
                        </div>


                    </main>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default AllProducts;

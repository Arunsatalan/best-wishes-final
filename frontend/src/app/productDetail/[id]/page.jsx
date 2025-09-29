'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { LuShoppingCart } from "react-icons/lu";
import { FaRegHeart, FaCcVisa, FaCcPaypal, FaStar } from "react-icons/fa";
import { SiMastercard } from "react-icons/si";
import { CiStar } from "react-icons/ci";
import Navbar from '../../components/navBar/page'
import Link from 'next/link';
import { Heart, Flame } from 'lucide-react';
import Image from 'next/image';
import { getProducts } from '../../actions/productAction'
import { addToCart } from '../../slices/cartSlice';
import { AiFillStar, AiOutlineStar, AiTwotoneStar } from 'react-icons/ai';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import CollaborativePurchaseModal from '../../modal/CollaborativePurchaseModal/CollaborativePurchaseModal';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Footer from "../../components/footer/page"
import ProductDetails from "../../components/ProductDetails"
import ProductReviews from "../../components/ProductReviews/page"
import ImageMagnifier from "../../components/ImageMagnifier"
import { useRouter } from 'next/navigation';

function ProductDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { allProducts } = useSelector((state) => state.productsState);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isCollaborativeModalOpen, setIsCollaborativeModalOpen] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState({});
  const [productImageErrors, setProductImageErrors] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [randomProducts, setRandomProducts] = useState([]);
  const [randomLoading, setRandomLoading] = useState(false);
  const router = useRouter();

  // Currency formatter for UK pounds
  const formatGBP = (value) => {
    const num = typeof value === 'number' ? value : Number(value || 0);
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(num);
    } catch {
      return `£${num.toFixed(2)}`;
    }
  };


  // Fetch specific product by ID
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`);
        if (response.data.success) {
          setProduct(response.data.data);
        } else {
          console.error('Failed to fetch product');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      dispatch(addToCart({ product, quantity }));
      toast.success(`${product.name} added to cart`);
    }
  };

  const increaseQuantity = () => {
    if (quantity < product?.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch])

  // Fetch related products by same main category
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.mainCategory) return;
      try {
        setRelatedLoading(true);
        const url = `${process.env.NEXT_PUBLIC_API_URL}/products?category=${encodeURIComponent(product.mainCategory)}&limit=8&page=1`;
        const res = await axios.get(url);
        if (res.data?.success && Array.isArray(res.data.data)) {
          const items = res.data.data.filter((p) => p._id !== product._id);
          setRelatedProducts(items);
        } else {
          setRelatedProducts([]);
        }
      } catch (e) {
        setRelatedProducts([]);
        console.error('Failed to fetch related products:', e);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelated();
  }, [product?.mainCategory, product?._id]);

  // Fetch a flat random sample from all products (15 items)
  useEffect(() => {
    const fetchRandom = async () => {
      try {
        setRandomLoading(true);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products/random?limit=15`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRandomProducts(res.data.data);
        } else {
          setRandomProducts([]);
        }
      } catch (e) {
        console.error('Failed to fetch random products:', e);
        setRandomProducts([]);
      } finally {
        setRandomLoading(false);
      }
    };
    fetchRandom();
  }, []);

  // Removed category-based sampler. Showing a flat random grid instead.

  // Get the main product image
  const getMainImage = () => {
    if (mainImageError) return '/placeholder.svg';
    if (product?.images && product.images.length > 0) {
      // If images array contains objects with url property
      if (typeof product.images[0] === 'object' && product.images[0].url) {
        return product.images[selectedImageIndex]?.url || product.images[0].url;
      }
      // If images array contains direct URLs
      return product.images[selectedImageIndex] || product.images[0];
    }
    return '/placeholder.svg';
  };

  // Get thumbnail images
  const getThumbnailImages = () => {
    if (product?.images && product.images.length > 0) {
      return product.images.slice(0, 4).map((image, index) => {
        if (typeof image === 'object' && image.url) {
          return image.url;
        }
        return image;
      });
    }
    return [];
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-red-500 text-center">
        Product not found
      </div>
    );
  }

  const thumbnailImages = getThumbnailImages();

  const openCollaborativeModal = () => setIsCollaborativeModalOpen(true);
  const closeCollaborativeModal = () => setIsCollaborativeModalOpen(false);
  const handleCollaborativePurchase = (emails) => {
    setIsCollaborativeModalOpen(false);
    toast.success("Collaborative purchase created! Invitations sent to participants.");
    // Navigate to dashboard after a short delay
    setTimeout(() => {
      router.push("/dashboard/collaborative-purchases");
    }, 1500);
  };

  return (
    <>
      <div className='w-full justify-center flex-co px-4 sm:px-8 md:px-16 lg:px-24'>  <Navbar />
        <div className='w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto mt-[20px]'>
          {/* Left Section - Image & Description */}
          <div className='flex-col justify-center col-span-12 lg:col-span-7'>
            <div className='w-full max-w-[640px] mx-auto bg-gray-100 rounded-[10px] overflow-hidden border-1 border-[#D9D9D9]/50 p-2'>
              <ImageMagnifier
                src={getMainImage()}
                alt={product.name}
                lensSize={100}
                zoomScale={2.0}
                previewWidth={280}
                previewHeight={280}
                showPreview={false}
                className="w-full h-full"
                onError={() => {
                  if (!mainImageError) setMainImageError(true);
                }}
              />
            </div>
            {thumbnailImages.length > 0 && (
              <div className='flex space-x-1 pt-[10px]'>
                {thumbnailImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className={`w-[72px] h-[72px] rounded-[5px] overflow-hidden cursor-pointer border-2 ${selectedImageIndex === index ? 'border-purple-500' : 'border-gray-300'
                      }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={thumbnailErrors[index] ? '/placeholder.svg' : imageUrl}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => {
                        if (!thumbnailErrors[index]) {
                          setThumbnailErrors(prev => ({ ...prev, [index]: true }));
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Section - Info & Actions */}
          <div className='col-span-12 lg:col-span-5 h-auto lg:pl-[20px] mt-8 lg:mt-0'>
            <div className='flex-col justify-center space-y-[15px]'>
              <div className='flex justify-between items-center'>
                <span className='font-extra-large font-bold'>{product.name}</span>
                <span><FaRegHeart /></span>
              </div>
              <div className='flex items-center'>
                <div className='flex items-center pr-[15px]'>
                  <FaStar /><FaStar /><FaStar /><FaStar /><CiStar />
                </div>
                <span>(27 Ratings)</span>
              </div>
              <div className='flex items-center gap-3'>
                <span className='font-extra-large font-bold text-[#822BE2]'>
                  {formatGBP(product.salePrice > 0 ? product.salePrice : product.retailPrice)}
                </span>
                {product.salePrice > 0 && product.retailPrice ? (
                  <span className='font-content line-through text-red-500'>
                    {formatGBP(product.retailPrice)}
                  </span>
                ) : null}
              </div>
              {product.salePrice > 0 && product.retailPrice ? (
                <div className='text-sm text-green-600'>
                  {(() => {
                    const save = Math.max((product.retailPrice || 0) - (product.salePrice || 0), 0);
                    const pct = product.retailPrice ? Math.round((save / product.retailPrice) * 100) : 0;
                    return save > 0 ? `Save ${formatGBP(save)} (${pct}%)` : null;
                  })()}
                </div>
              ) : null}
              <div className='flex items-center space-x-[10px]'>
                <span className='font-medium'>Quantity</span>
                <button onClick={decreaseQuantity} className='border bg-[#D9D9D9] rounded-[5px] w-[25px] h-[25px]'>-</button>
                <span className='w-[48px] h-[40px] border flex justify-center items-center font-large rounded-[5px]'>{quantity}</span>
                <button onClick={increaseQuantity} className='border bg-[#D9D9D9] rounded-[5px] w-[25px] h-[25px]'>+</button>
                <span className='pl-[50px] text-green-500'>{product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}</span>
              </div>
            </div>

            <div className='flex-col justify-center space-y-[15px] pt-[15px]'>
              <button onClick={handleAddToCart} className='flex justify-center items-center border text-[#822BE2] rounded-[8px] w-full h-[50px] gap-2 font-bold'>
                Add to cart <LuShoppingCart />
              </button>
              
              {/* Customize Button for Customizable Products */}
              {product.isCustomizable && (
                <button
                  className="flex justify-center items-center border text-white bg-[#FFA500] rounded-[8px] w-full h-[50px] gap-2 font-bold cursor-pointer hover:bg-[#FF8C00]"
                  onClick={() => router.push(`/customize/${product._id}`)}
                >
                  <span>🎨</span> Customize This {product.customizationType || 'Product'}
                </button>
              )}

              <button
                className="flex justify-center items-center border text-white bg-[#822BE2] rounded-[8px] w-full h-[50px] gap-2 font-bold cursor-pointer hover:opacity-90"
                onClick={() => router.push(`/payment?productId=${product._id}&qty=${quantity}`)}
              >
                {`Get now - ${formatGBP(((product.salePrice > 0 ? product.salePrice : product.retailPrice) || 0) * quantity)}`}
              </button>
              {/* <div className="w-full flex flex-col sm:flex-row gap-[15px]">
                {product.salePrice >= 10 && (
                  <button
                    onClick={openCollaborativeModal}
                    className="border text-[#822BE2] rounded-[8px] w-full sm:w-[50%] h-[50px] font-semibold"
                  >
                    Apply Collaborative
                  </button>
                )}

                <button
                  className={`border text-[#822BE2] rounded-[8px] h-[50px] font-semibold 
      ${product.salePrice >= 10 ? "w-full sm:w-[50%]" : "w-full"}`}
                  onClick={() => router.push(`/surprisegift?productId=${product._id}&qty=${quantity}`)}
                >
                  Apply Surprise Gift
                </button>
              </div> */}

            </div>

            <div className='mt-[15px] p-[15px] border rounded-[8px]'>
              <span className='font-medium'>Shipping Information</span><br />
              <span className='text-[#5C5C5C]'>
                Shipping fee will be added based on your buying product and delivered within 7 days.
              </span><br />
              <span className='text-[#5C5C5C]'>
                Returnable with <span className='underline text-blue-500'>Terms & Conditions</span>
              </span><br /><br />
              <span className='font-medium'>Payment Options</span><br />
              <div className='flex gap-[10px] items-center'>
                <FaCcVisa className='text-[50px] text-[#5C5C5C]' />
                <FaCcPaypal className='text-[50px] text-[#5C5C5C]' />
                <SiMastercard className='text-[50px] text-[#5C5C5C]' />
              </div>
            </div>
          </div>
        </div>
        <div className='flex-col items-start mt-[40px] w-full'>
          <ProductDetails product={product} />
          <ProductReviews productId={product._id} />
        </div>

        {/* all Products */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8 md:mt-[100px]">
        {allProducts && allProducts.length > 0 ? (
          allProducts.slice(0, 9).map((product) => {
            const getProductImage = () => {
              if (productImageErrors[product._id]) return '/placeholder.svg';
              if (product?.images && product.images.length > 0) {
                if (typeof product.images[0] === 'object' && product.images[0].url) {
                  return product.images[0].url;
                }
                return product.images[0];
              }
              return '/placeholder.svg';
            };

            return (
              <Link
                key={product._id}
                href={`/productDetail/${product._id}`}
                className="w-full h-auto rounded-lg block"
              >
                <div className="relative">
                  <Image
                    src={getProductImage()}
                    alt={product.name}
                    width={172}
                    height={172}
                    className="rounded-lg object-cover w-full h-auto"
                    onError={() => {
                      if (!productImageErrors[product._id]) {
                        setProductImageErrors(prev => ({ ...prev, [product._id]: true }));
                      }
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-red-100 rounded-full p-1">
                    <Flame className="text-red-500 w-4 h-4" />
                  </div>
                  <div className="absolute top-2 right-2 bg-purple-100 rounded-full p-1">
                    <Heart className="text-purple-500 w-4 h-4" />
                  </div>
                </div>

                <div className="mt-2 px-1">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <p className="font-medium text-gray-700">
                    UK £{product.price || product.retailPrice}
                  </p>
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
              </Link>
            );
          })
        ) : (
          <p className="text-red-500">Server currently busy!</p>
        )}
      </div> */}

        {/* Related Products */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Related Products</h2>
            {product?.mainCategory && (
              <span className="text-sm text-gray-500">Category: {product.mainCategory}</span>
            )}
          </div>
          {relatedLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-3 text-gray-600">Loading related products...</p>
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {relatedProducts.map((rp) => {
                const imgSrc = rp?.images?.[0]?.url || '/placeholder.svg';
                return (
                  <Link key={rp._id} href={`/productDetail/${rp._id}`} className="block group">
                    <CardContent className="p-0 border-1 border-[#D9D9D9]/50 rounded-[10px] overflow-hidden">
                      <div className="relative bg-gray-50">
                        <Image
                          src={imgSrc}
                          alt={rp.name}
                          width={200}
                          height={200}
                          className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm sm:text-base truncate">{rp.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-purple-600 text-sm sm:text-base">
                            {formatGBP(rp?.salePrice > 0 ? rp.salePrice : rp.retailPrice)}
                          </span>
                          {rp?.salePrice > 0 && rp?.retailPrice ? (
                            <span className="text-xs text-red-500 line-through">
                              {formatGBP(rp.retailPrice)}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex text-yellow-400 text-xs sm:text-sm mt-1">
                          {Array.from({ length: 5 }, (_, i) => {
                            const full = Math.floor(rp.rating || 0);
                            const hasHalf = (rp.rating || 0) - full >= 0.5;
                            if (i < full) return <AiFillStar key={i} />;
                            if (i === full && hasHalf) return <AiTwotoneStar key={i} />;
                            return <AiOutlineStar key={i} />;
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No related products found.</p>
            </div>
          )}
        </div>

        {/* Flat random grid: 15 products, 3 rows x 5 cols on large screens */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Best Picks</h2>
          {randomLoading ? (
            <div className="col-span-full text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-3 text-gray-600">Loading products...</p>
            </div>
          ) : randomProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {randomProducts.slice(0, 15).map((rp) => {
                const imgSrc = rp?.images?.[0]?.url || '/placeholder.svg';
                return (
                  <Link key={rp._id} href={`/productDetail/${rp._id}`} className="block group">
                    <CardContent className="p-0 border-1 border-[#D9D9D9]/50 rounded-[10px] overflow-hidden">
                      <div className="relative bg-gray-50">
                        <Image
                          src={imgSrc}
                          alt={rp.name}
                          width={200}
                          height={200}
                          className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm sm:text-base truncate">{rp.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-purple-600 text-sm sm:text-base">
                            {formatGBP(rp?.salePrice > 0 ? rp.salePrice : rp.retailPrice)}
                          </span>
                          {rp?.salePrice > 0 && rp?.retailPrice ? (
                            <span className="text-xs text-red-500 line-through">
                              {formatGBP(rp.retailPrice)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>



        <CollaborativePurchaseModal
          isOpen={isCollaborativeModalOpen}
          onClose={closeCollaborativeModal}
          onAccept={handleCollaborativePurchase}
          // Single product support
          isMultiProduct={false}
          productName={product?.name}
          productPrice={product?.salePrice > 0 ? product.salePrice : product.retailPrice}
          productID={product._id}
          quantity={quantity}
        />

        <Toaster position="top-center" richColors closeButton />

      </div>
      <Footer />
    </>
  );
}

export default ProductDetailPage;

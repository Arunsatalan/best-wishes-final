"use client";
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/navBar/page';
import Footer from '../../components/footer/page';
import FeedbackModal from '../../components/FeedbackModal/page';
import { MdHistory } from "react-icons/md";
import Image from 'next/image';
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegEye } from "react-icons/fa";
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { toast, Toaster } from 'sonner';

function Page() {
    const { user } = useSelector(state => state.userState);
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [viewOrder, setViewOrder] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [feedbackModal, setFeedbackModal] = useState({ 
        isOpen: false, 
        product: null, 
        order: null 
    });
    const [feedbackStatuses, setFeedbackStatuses] = useState({});

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        fetchOrders();
    }, [user]);

    useEffect(() => {
        if (orders.length > 0) {
            checkFeedbackStatuses();
        }
    }, [orders]);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/orders/history`, { withCredentials: true });
            setOrders(res.data.orders || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch order history');
        } finally {
            setLoading(false);
        }
    };

    const checkFeedbackStatuses = async () => {
        try {
            const statusPromises = [];
            const statusKeys = [];

            orders.forEach(order => {
                order.items.forEach(item => {
                    if (item.product && item.product._id) {
                        const key = `${item.product._id}-${order._id}`;
                        statusKeys.push(key);
                        statusPromises.push(
                            axios.get(
                                `${process.env.NEXT_PUBLIC_API_URL}/feedback/eligibility/${item.product._id}/${order._id}`,
                                { withCredentials: true }
                            ).catch(() => ({ data: { canGiveFeedback: false, reason: 'Error checking status' } }))
                        );
                    }
                });
            });

            const responses = await Promise.all(statusPromises);
            const statuses = {};
            
            statusKeys.forEach((key, index) => {
                statuses[key] = responses[index].data;
            });

            setFeedbackStatuses(statuses);
        } catch (error) {
            console.error('Error checking feedback statuses:', error);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        setDeleteLoading(orderId);
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`, {
                withCredentials: true
            });
            toast.success('Order deleted successfully');
            setOrders(orders.filter(order => order._id !== orderId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete order');
        } finally {
            setDeleteLoading(null);
            setShowDeleteModal(null);
        }
    };

    const handleViewOrder = (order) => {
        setViewOrder(order);
    };

    const handleFeedbackClick = (product, order) => {
        const key = `${product._id}-${order._id}`;
        const status = feedbackStatuses[key];

        if (!status) {
            toast.error('Please wait while we check feedback eligibility...');
            return;
        }

        if (!status.canGiveFeedback) {
            if (status.existingFeedback) {
                toast.info('You have already provided feedback for this product');
            } else {
                toast.error(status.reason || 'Cannot provide feedback for this product');
            }
            return;
        }

        setFeedbackModal({
            isOpen: true,
            product,
            order
        });
    };

    const handleFeedbackSubmitted = (newFeedback) => {
        // Update feedback status after successful submission
        const key = `${newFeedback.product}-${newFeedback.order}`;
        setFeedbackStatuses(prev => ({
            ...prev,
            [key]: {
                canGiveFeedback: false,
                reason: 'Feedback already provided',
                existingFeedback: newFeedback
            }
        }));
    };

    const closeFeedbackModal = () => {
        setFeedbackModal({
            isOpen: false,
            product: null,
            order: null
        });
    };

    // Get feedback button properties for a product
    const getFeedbackButtonProps = (product, order) => {
        const key = `${product._id}-${order._id}`;
        const status = feedbackStatuses[key];

        if (!status) {
            return {
                text: 'Loading...',
                className: 'border-2 border-gray-300 text-sm md:text-[16px] rounded bg-gray-300 text-gray-500 py-1 px-4 cursor-not-allowed',
                disabled: true
            };
        }

        if (status.canGiveFeedback) {
            return {
                text: 'Give Feedback',
                className: 'border-2 border-[#822BE2] text-sm md:text-[16px] rounded bg-[#822BE2] hover:bg-purple-200 hover:border-[#822BE2] hover:text-[#822BE2] hover:cursor-pointer text-white py-1 px-4 transition-colors',
                disabled: false
            };
        } else if (status.existingFeedback) {
            return {
                text: 'Feedback Given',
                className: 'border-2 border-green-500 text-sm md:text-[16px] rounded bg-green-500 text-white py-1 px-4 cursor-default',
                disabled: true
            };
        } else {
            return {
                text: 'Not Eligible',
                className: 'border-2 border-gray-400 text-sm md:text-[16px] rounded bg-gray-400 text-white py-1 px-4 cursor-not-allowed',
                disabled: true
            };
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
                <Navbar />
                <div className="flex flex-col items-center justify-center flex-1">
                    <MdHistory className="text-5xl text-[#822BE2] mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Login Required</h2>
                    <p className="mb-4 text-gray-600">You must be logged in to view your order history.</p>
                    <Link href="/login" className="px-6 py-2 bg-[#822BE2] text-white rounded hover:bg-purple-700 transition">Login to Access</Link>
                </div>
                <Footer />
            </div>
        );
    }

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
        <div>
            <div className='px-4 md:px-20 lg:px-[80px] min-h-screen'>
                <Navbar />
                <div className='flex w-full items-center justify-center p-2 md:p-[5px] text-[#822BE2] font-semibold border border-[#822BE2] rounded mb-5 md:mb-[20px] text-base md:text-lg'><MdHistory className='text-2xl md:text-[30px] pr-2 md:pr-[10px]' /> History</div>
                {loading ? (
                    <div className="flex justify-center items-center min-h-[200px]">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#822BE2] rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-8">{error}</div>
                ) : orders.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 flex flex-col items-center gap-4">
                        <span>No order history found.</span>
                        <Link href="/allProducts" className="px-6 py-2 bg-[#822BE2] text-white rounded hover:bg-purple-700 transition">Go Shopping</Link>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order._id} className='flex flex-col w-full items-center justify-center mb-6'>
                            <div className='flex flex-col md:flex-row w-full gap-2 md:gap-0'>
                                <div className='flex items-center w-full md:w-[40%] mb-2 md:mb-0'>
                                    <div className="relative w-[40%] md:w-[25%] min-w-[80px] max-w-[130px]">
                                        <Image
                                            src={getProductImage(order.items[0]?.product)}
                                            alt={order.items[0]?.product?.name || "Product image"}
                                            width={130}
                                            height={120}
                                            className="rounded-lg object-cover w-full h-auto"
                                            onError={(e) => {
                                                e.target.src = '/placeholder.svg';
                                            }}
                                        />
                                    </div>
                                    <div className='ml-2'>
                                        <span className='text-base md:text-[18px] font-semibold block'>
                                            {order.items.length === 1 
                                                ? (order.items[0].product?.name || 'Product name')
                                                : `${order.items.length} Items`
                                            }
                                        </span>
                                        {order.items.length > 1 && (
                                            <span className='text-sm text-gray-600'>
                                                {order.items[0].product?.name} + {order.items.length - 1} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className='flex flex-wrap md:flex-nowrap justify-between md:justify-evenly items-center w-full md:w-[60%] gap-2'>
                                    <p className='font-semibold text-sm md:text-[16px]'>UK £{order.total?.toFixed(2) || '0.00'}</p>
                                    <p className='text-sm md:text-[16px]'>{new Date(order.orderedAt).toLocaleDateString()}</p>
                                    <p className='text-sm md:text-[16px]'>{order.status}</p>
                                    <button
                                        onClick={() => handleViewOrder(order)}
                                        className='text-xl md:text-[23px] p-0 bg-transparent border-none hover:bg-transparent focus:outline-none hover:text-[#822BE2] transition-colors'
                                    >
                                        <FaRegEye />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(order._id)}
                                        disabled={deleteLoading === order._id || order.status === 'Shipped' || order.status === 'Delivered'}
                                        className='text-xl md:text-[23px] text-red-500 p-0 bg-transparent border-none hover:bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:text-red-700 transition-colors'
                                    >
                                        <RiDeleteBin6Line />
                                    </button>
                                    {/* Feedback button - only show for single item orders for simplicity */}
                                    {order.items.length === 1 && order.items[0].product ? (() => {
                                        const buttonProps = getFeedbackButtonProps(order.items[0].product, order);
                                        return (
                                            <button 
                                                onClick={() => !buttonProps.disabled && handleFeedbackClick(order.items[0].product, order)}
                                                disabled={buttonProps.disabled}
                                                className={buttonProps.className}
                                            >
                                                {buttonProps.text}
                                            </button>
                                        );
                                    })() : (
                                        <span className='text-sm text-gray-500'>Multiple Items</span>
                                    )}
                                </div>
                            </div>
                            <hr className='mt-4 w-full md:w-[50%] mx-auto text-[#D9D9D9] pb-5 md:ml-[25%]' />
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this order? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteOrder(showDeleteModal)}
                                disabled={deleteLoading === showDeleteModal}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {deleteLoading === showDeleteModal ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Order Details Modal */}
            {viewOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Order Details</h3>
                            <button
                                onClick={() => setViewOrder(null)}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold">Order ID:</span>
                                    <p className="text-gray-600">#{viewOrder._id.slice(-8)}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">Status:</span>
                                    <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${viewOrder.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                            viewOrder.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                                viewOrder.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {viewOrder.status}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-semibold">Order Date:</span>
                                    <p className="text-gray-600">{new Date(viewOrder.orderedAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">Total Paid:</span>
                                    <p className="text-gray-600 font-semibold">UK £{viewOrder.total?.toFixed(2) || '0.00'}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">Items:</h4>
                                <div className="space-y-3">
                                    {viewOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                                            <Image
                                                src={getProductImage(item.product)}
                                                alt={item.product?.name || "Product"}
                                                width={60}
                                                height={60}
                                                className="rounded-lg object-cover"
                                            />
                                            <div className="flex-1">
                                                <h5 className="font-medium">{item.product?.name || item.name}</h5>
                                                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                                <p className="text-sm font-semibold">UK £{(item.price * item.quantity)?.toFixed(2) || '0.00'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Price Breakdown */}
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <h5 className="font-semibold mb-2">Payment Breakdown:</h5>
                                    <div className="space-y-1 text-sm">
                                        {viewOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between">
                                                <span>{item.product?.name || item.name} × {item.quantity}</span>
                                                <span>UK £{(item.price * item.quantity)?.toFixed(2) || '0.00'}</span>
                                            </div>
                                        ))}
                                        {(viewOrder.shippingCost && viewOrder.shippingCost > 0) ? (
                                            <div className="flex justify-between text-gray-600">
                                                <span>Shipping</span>
                                                <span>UK £{viewOrder.shippingCost?.toFixed(2) || '0.00'}</span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-gray-600">
                                                <span>Shipping</span>
                                                <span>UK £10.00</span>
                                            </div>
                                        )}
                                        <hr className="my-2" />
                                        <div className="flex justify-between font-semibold">
                                            <span>Total Paid</span>
                                            <span>UK £{viewOrder.total?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            <FeedbackModal
                isOpen={feedbackModal.isOpen}
                onClose={closeFeedbackModal}
                product={feedbackModal.product}
                order={feedbackModal.order}
                onFeedbackSubmitted={handleFeedbackSubmitted}
            />

            <Footer />
            <Toaster position="top-center" richColors closeButton />
        </div>
    );
}

export default Page;

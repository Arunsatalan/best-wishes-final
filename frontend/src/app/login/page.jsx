"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { userLogin } from '../../app/slices/userSlice';
import logo from '../../assets/logo.png';
import { useRouter } from 'next/navigation';
import Loader from '../components/loader/page';
import Link from 'next/link';
import {toast, Toaster } from 'sonner';
import AuthNavbar from '../components/authNavbar/page';

function Page() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/login`,
        { email, password },
        { withCredentials: true }
      );

      const userData = res.data.user;
      const token = res.data.token; // Get the token from response

      // Store token in localStorage for cross-domain authentication
      if (token) {
        localStorage.setItem('auth_token', token);
      }

      dispatch(userLogin({
        user: userData,
        role: userData.role,
      }));

      console.log('User role:', userData.role);
      console.log('User twoFactorEnabled?:', userData.twoFactorEnabled);
      if(userData.twoFactorEnabled === false){
        setErrorMsg('Your Two factor Registation is not complete your access denied!');
        toast.error('Your Two factor Registation is not complete your access denied!');
        setLoading(false);
      }
      else if (userData.role === 'admin') {
        router.push('/admin');
      } else if (userData.role === 'inventoryManager') {
        router.push('/inventorymanager');
      } else if (userData.role === 'deliveryStaff') {
        router.push('/deliverystaff');
      } else {
        router.push('/');
      }

    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg(error.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      <AuthNavbar />
      <form onSubmit={submitHandler}> 
        <div className='background min-h-screen flex justify-center items-center drop-shadow-lg'>
          <div className='bg-white w-[581px] rounded-[12px] pt-[50px] pb-[50px] flex flex-col items-center space-y-[15px]'>
            <div className='w-[200px] relative'>
              <Image src={logo} alt='Logo' />
            </div>

            <span className='font-extra-large mb-4 font-semibold'>Login Account</span>

            <div className='w-full flex flex-col gap-4 pl-[45px] pr-[45px]'>
              <div className='flex flex-col'>
                <label className='font-content mb-1'>Email</label>
                <input
                  className='pl-[20px] w-full border border-[#818181] focus:outline-none focus:border-[#822BE2] p-2 rounded-[5px]'
                  type='email'
                  placeholder='Enter your email'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className='flex flex-col'>
                <label className='font-content mb-1'>Password</label>
                <input
                  className='pl-[20px] w-full border border-[#818181] focus:outline-none focus:border-[#822BE2] p-2 rounded-[5px]'
                  type='password'
                  placeholder='Enter your password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {errorMsg && (
                <div className="text-red-500 text-sm mb-2">
                  {errorMsg}
                </div>
              )}

              <Link href='/forgot-password' className='text-[14px] w-full flex justify-end cursor-pointer text-blue-600 hover:underline'>
                Forgot Password?
              </Link>

              <button
                type="submit"
                disabled={loading}
                className='w-full h-[50px] rounded-[8px] btn-color text-white font-medium disabled:opacity-50'
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className='w-full flex justify-center items-center font-content'>
                <span>Don't have an account? <Link href='/signup' className='underline text-blue-500 cursor-pointer'>Sign up</Link></span>
              </div>
            </div>
          </div>
        </div>
      </form>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}

export default Page;

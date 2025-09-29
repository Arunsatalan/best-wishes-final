import axios from 'axios';
import { setAllProducts } from '../slices/productSlice';
import { userLogin } from '../slices/userSlice';
  

export const getProducts = () => async (dispatch) => {
   try {
     const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
     const response = await axios.get(`${API_URL}/getAllProducts`);
           console.log('Product get success:', response.data);
           dispatch(setAllProducts(response.data));  // save user to redux
   } catch (error) {
     console.log(error.response?.data.message || error.message);
   }
 };

export const fetchUserProfile = () => async (dispatch) => {
  try {
    console.log('Fetching user profile...');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    const config = {
      withCredentials: true,
      ...(token && { headers: { Authorization: `Bearer ${token}` } })
    };
    
    const response = await axios.get(`${API_URL}/myprofile`, config);
    
    if (response.data && response.data.user) {

      // console.log('User profile fetched successfully:', response.data.user);

      console.log('User profile fetched successfully:', response.data.user);

      dispatch(userLogin({ user: response.data.user, role: response.data.user.role }));
    } else {
      console.log('No user data in response:', response.data);
    }
  } catch (error) {
    // Don't log authentication errors as errors since many pages don't require login
    if (error.response?.status === 401) {
      console.log('User not authenticated - this is expected for public pages');
    } else {
      console.error('Error fetching user profile:', error.response?.data?.message || error.message);
    }
  }
};

 



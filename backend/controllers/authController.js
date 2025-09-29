const jwt = require("jsonwebtoken");
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendEmail } = require('../config/emailConfig');


// Token generator--summa
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};


// Register - {base_url} /api/register
exports.registerUser = async (req, res) => {
  const { firstName, lastName, email, password, phone, address, zipCode } = req.body;

  try {
    const olduser = await User.findOne({ email });

    if (olduser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email!'
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      zipCode,
      role: 'user'
    });

    // update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save({ validateModifiedOnly: true });

    const token = generateToken(user);

    // Set token in cookie with cross-domain settings
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Allow cross-domain in production
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      token: token, // Also return token in response for frontend storage
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        zipCode: user.zipCode
      }
    });

  } catch (err) {
    res.status(500).json({
      message: 'Registration Failed!',
      error: err.message
    });
  }
};


// otp - {base_url} /api/otp
exports.otp = async (req, res) => {
  const { email, otp } = req.body;
  await Otp.create({
      email,
      otp
    });
    res.status(201).json({
      success: true
    });
};


// otp - {base_url} /api/twoFactor
exports.twoFactor = async (req, res) => {
  try {
    const { email, twoFactorEnabled } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email }, // Find by email
      { twoFactorEnabled }, // Update the field
      { new: true } // Return the updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating twoFactorEnabled:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};





//  Login - {base_url} /api/login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password",
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // update lastLogin timestamp on successful login
    user.lastLogin = new Date();
    await user.save({ validateModifiedOnly: true });

    const token = generateToken(user);

    //  Set cookie with cross-domain settings
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Allow cross-domain in production
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      token: token, // Also return token in response for frontend storage
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        zipCode: user.zipCode,
        profileImage: user.profileImage,

        twoFactorEnabled:user.twoFactorEnabled

      }
    });

  } catch (err) {
    res.status(500).json({
      message: "Login failed",
      error: err.message
    });
  }
};



// Logout - {base_url} /api/logout
exports.logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Match login cookie settings
    expires: new Date(0)
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};


// Get-User-Profile  -- {base_url}/api/myprofile
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // remove password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};



// Change-Password  -- {base_url}/api/changePassword
exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(req.body.oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    // Assign new password and save
    user.password = req.body.password;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message
    });
  }
};


// Update-User-Profile  -- {base_url}/api/updateprofile
exports.updateUserProfile = async (req, res) => {
  try {
    const { phone, address, profileImage } = req.body;

    console.log("Received profile update request:", { 
      userId: req.user.id, 
      phone, 
      address, 
      profileImage: profileImage ? 'Image provided' : 'No image' 
    });

    const user = await User.findById(req.user.id);

    if (user) {
      // Update fields only if they are provided
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
      if (profileImage !== undefined) {
        user.profileImage = profileImage;
        console.log("Updated profile image to:", profileImage);
      }

      const updatedUser = await user.save();
      console.log("Profile updated successfully for user:", updatedUser._id);

      res.status(200).json({
        success: true,
        user: {
          id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          address: updatedUser.address,
          profileImage: updatedUser.profileImage, 
        },
      });
    } else {
      console.log("User not found:", req.user.id);
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

// Verify OTP - {base_url}/api/verify-otp
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }
  try {
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    // OTP is valid, delete it so it can't be reused
    await Otp.deleteOne({ _id: otpRecord._id });
    return res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Forgot Password - Send Verification Code - {base_url}/api/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email });

    // Save verification code to OTP collection
    await Otp.create({
      email,
      otp: verificationCode
    });

    // Email message with verification code
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #822BE2; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .code-box { 
            background-color: #f0f0f0;
            border: 2px dashed #822BE2;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border-radius: 10px;
          }
          .verification-code {
            font-size: 32px;
            font-weight: bold;
            color: #822BE2;
            letter-spacing: 5px;
            font-family: monospace;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName},</h2>
            <p>You have requested to reset your password for your Best Wishes account.</p>
            <p>Please use the verification code below to proceed with password reset:</p>
            <div class="code-box">
              <div class="verification-code">${verificationCode}</div>
            </div>
            <p><strong>This code will expire in 5 minutes.</strong></p>
            <p>Enter this code on the password reset page to continue.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Best Wishes. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Verification Code - Best Wishes',
        html: message
      });

      res.status(200).json({
        success: true,
        message: 'Verification code sent to your email successfully'
      });
    } catch (error) {
      console.error('Email send error:', error);
      
      // Delete the OTP if email fails
      await Otp.deleteMany({ email });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      error: error.message
    });
  }
};

// Verify Reset Code - {base_url}/api/verify-reset-code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

    // Verify the OTP
    const otpRecord = await Otp.findOne({ email, otp: code });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Don't delete the OTP yet - keep it for password reset
    res.status(200).json({
      success: true,
      message: 'Verification code is valid. You can now reset your password.'
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      error: error.message
    });
  }
};

// Reset Password with Verification Code - {base_url}/api/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, password, confirmPassword } = req.body;

    if (!email || !code || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, verification code, password and confirm password are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

    // Verify the OTP one more time
    const otpRecord = await Otp.findOne({ email, otp: code });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Set new password
    user.password = password;
    await user.save();

    // Delete the used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      error: error.message
    });
  }
};

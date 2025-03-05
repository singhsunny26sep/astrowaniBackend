// userController.js
const User = require("../models/userModel");

const { sendEmail } = require("../helpers/emailHelper");
const { generateOTP } = require("../helpers/otpHelper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Astrologer = require("../models/astrologerModel");

exports.requestOTP = async (req, res) => {
  try {
    const { email, fcm } = req.body;

    // Find user by email without password, firstName, and lastName
    let user = await User.findOne({ email });

    // If user doesn't exist, create a new one
    if (!user) {
      user = new User({ email }); // Only set email when creating a new user
      await user.save();
    }

    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
    };
    // Save or update FCM token
    if (fcm) {
      user.fcm = fcm;
    }
    await user.save();

    // Define the HTML email content
    const otpHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #dddddd; border-radius: 10px;">
        <h2 style="color: #333;">OTP Verification</h2>
        <p style="color: #555;">
          Your OTP is
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 18px; font-weight: bold; color: #007BFF;">${otp}</p>
        </div>
        <p style="color: #999; font-size: 12px;">
          Best regards,<br>
          Your Service Team
        </p>
      </div>
    `;
    await sendEmail(email, "Verify Your Account", otpHtml);

    res.status(201).json({
      success: true,
      message: "OTP has been sent to your email. Please check your inbox.",
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phoneNumber } =
      req.body;

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: "admin",
      phoneNumber,
    });

    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
    };
    await user.save();

    // Define the HTML email content
    const otpHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #dddddd; border-radius: 10px;">
          <h2 style="color: #333;">OTP Verification</h2>
          <p style="color: #555;">
            You OTP is
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 18px; font-weight: bold; color: #007BFF;">${otp}</p>
          </div>
          <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            Your Service Team
          </p>
        </div>
      `;
    await sendEmail(email, "Verify Your Account", otpHtml);
    res.status(201).json({
      success: true,
      message: "User registered. Please check your email for OTP.",
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: "Please verify your account first" });
    }

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = user.getSignedJwtToken({
      expiresIn: "30d",
      secret: process.env.JWT_SECRET,
    });
    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.otp.code !== otp || user.otp.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }
    // Generate a token for the user
    // const token = jwt.sign({ id: user._id }, process.env.RESET_SECRET, {
    //   expiresIn: "10m",
    // });

    const token = user.getSignedJwtToken({
      expiresIn: "30d",
      secret: process.env.JWT_SECRET,
    });
    user.isVerified = true;
    user.otp = undefined;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Account verified successfully", token });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    await user.save();
    await sendEmail(
      email,
      "New OTP for Account Verification",
      `Your new OTP is: ${otp}`
    );
    res
      .status(200)
      .json({ success: true, message: "New OTP sent to your email" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers and calculate the skip value
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch users with pagination
    const users = await User.find({ role: "customer" })
      .skip(skip)
      .limit(limitNumber);

    // Get the total count of users for pagination metadata
    const totalUsers = await User.countDocuments({ role: "customer" });

    // Respond with data and pagination info
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        totalUsers,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalUsers / limitNumber),
        limit: limitNumber,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    console.log(req.user.id);

    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    console.log(oldPassword, newPassword);

    const user = await User.findById(req.user.id).select("+password");
    console.log(user);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect old password" });
    }
    console.log(newPassword);

    user.password = newPassword;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // const resetToken = jwt.sign({ id: user._id }, process.env.RESET_SECRET, {
    //   expiresIn: "1h",
    // });

    const resetToken = user.getSignedJwtToken({
      expiresIn: "1h",
      secret: process.env.RESET_SECRET,
    });
    const resetLink = `http://localhost:5173/auth/reset-password?token=${resetToken}`; // Replace with your frontend URL

    // Define the HTML email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #dddddd; border-radius: 10px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="color: #555;">
          You requested to reset your password. Please use the following link to reset it:
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetLink}" style="font-size: 18px; font-weight: bold; color: #007BFF;">Reset Password</a>
        </div>
        <p style="color: #555;">
          If you did not request this password reset, please ignore this email.
        </p>
        <p style="color: #999; font-size: 12px;">
          Best regards,<br>
          Your Service Team
        </p>
      </div>
    `;

    console.log("Sending email with HTML content..."); // Debugging line

    // Send the email with HTML content
    await sendEmail(email, "Password Reset Request", html);

    res
      .status(200)
      .json({ success: true, message: "Password reset link sent to email" });
  } catch (error) {
    console.error("Error in forgotPassword function:", error); // Debugging line
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.RESET_SECRET);
    const user = await User.findById(decoded.id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.requestAstroOTP = async (req, res) => {
  try {
    const { email, fcm } = req.body;

    // Find user by email without password, firstName, and lastName
    let user = await User.findOne({ email, role: "astrologer" });

    // If user doesn't exist, create a new one
    if (!user) {
      return res.status(401).json({ success: false, message: "No User Found" });
    }

    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
    };
    // Save or update FCM token
    if (fcm) {
      user.fcm = fcm;
    }
    await user.save();

    // Define the HTML email content
    const otpHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #dddddd; border-radius: 10px;">
        <h2 style="color: #333;">OTP Verification</h2>
        <p style="color: #555;">
          Your OTP is
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 18px; font-weight: bold; color: #007BFF;">${otp}</p>
        </div>
        <p style="color: #999; font-size: 12px;">
          Best regards,<br>
          Your Service Team
        </p>
      </div>
    `;
    await sendEmail(email, "Verify Your Account", otpHtml);

    res.status(201).json({
      success: true,
      message: "OTP has been sent to your email. Please check your inbox.",
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Register Astrologer and User
exports.registerAstrologer = async (req, res, next) => {
  const {
    email,
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
    gender,
    experience,
    language,
    specialties,
    profileImage,
  } = req.body;

  try {
    let user = new User({
      email,
      role: "astrologer",
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      gender,
      profilePic: profileImage,
    });

    user = await user.save();

    const astrologer = new Astrologer({
      name: `${firstName} ${lastName}`,
      email,
      phoneNumber,
      experience,
      language,
      specialties,
      profileImage,
      userId: user._id,
    });

    await astrologer.save();

    res.status(201).json({
      success: true,
      message: "Astrologer registered successfully",
      data: {
        user,
        astrologer,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Astrologer Profile
exports.updateAstrologerProfile = async (req, res, next) => {
  const userId = req.user.id;
  const {
    name,
    phoneNumber,
    bio,
    experience,
    experienceAndQualification,
    pricing,
    language,
    specialties,
    profileImage,
  } = req.body;

  try {
    // Find astrologer by userId
    let astrologer = await Astrologer.findOne({ userId });

    if (!astrologer) {
      return res.status(404).json({
        success: false,
        message: "Astrologer profile not found",
      });
    }

    // Update astrologer profile fields
    astrologer.name = name || astrologer.name;
    astrologer.phoneNumber = phoneNumber || astrologer.phoneNumber;
    astrologer.bio = bio || astrologer.bio;
    astrologer.experience = experience || astrologer.experience;
    astrologer.experienceAndQualification =
      experienceAndQualification || astrologer.experienceAndQualification;
    astrologer.pricing = pricing || astrologer.pricing;
    astrologer.language = language || astrologer.language;
    astrologer.specialties = specialties || astrologer.specialties;
    astrologer.profileImage = profileImage || astrologer.profileImage;

    // Save updated profile
    await astrologer.save();

    res.status(200).json({
      success: true,
      message: "Astrologer profile updated successfully",
      data: astrologer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

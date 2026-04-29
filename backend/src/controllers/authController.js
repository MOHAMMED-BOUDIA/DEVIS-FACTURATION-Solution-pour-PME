import User from '../models/User.js';
import Company from '../models/Company.js';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';

const serializeUser = (user) => {
  const companyId = user?.company?._id || user?.company || null;
  const company = user?.company && typeof user.company === 'object' ? user.company : null;

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId,
    company,
  };
};

const buildAuthPayload = (user, token) => {
  const serializedUser = serializeUser(user);

  return {
    success: true,
    token,
    user: {
      id: serializedUser.id,
      name: serializedUser.name,
      email: serializedUser.email,
      role: serializedUser.role,
      companyId: serializedUser.companyId,
    },
    company: serializedUser.company,
    // Backward compatibility for existing frontend consumers
    data: serializedUser,
  };
};

// @desc    Register user 
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, companyName, companyTaxId } = req.body;

  // Validation
  if (!name || !email || !password || !companyName || !companyTaxId) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  if (password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already registered', 409));
  }

  const company = await Company.create({
    name: companyName,
    taxId: companyTaxId,
    email,
  });

  // Create user - FORCE role to 'user' for security
  // Never trust 'role' from req.body
  const user = await User.create({
    name,
    email,
    password,
    company: company._id,
    role: 'user', 
  });

  await sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password, remember } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      error_code: 'USER_NOT_FOUND',
      message: 'This email is not registered.'
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error_code: 'INVALID_PASSWORD',
      message: 'Incorrect password.'
    });
  }

  await sendTokenResponse(user, 200, res, remember);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('company');

  res.status(200).json(buildAuthPayload(user, req.token));
});

// @desc    Create and link a company to the current user
// @route   POST /api/me/company
// @access  Private
export const createMeCompany = asyncHandler(async (req, res, next) => {
  const currentUser = await User.findById(req.user.id).populate('company');

  if (currentUser?.company) {
    return res.status(409).json({
      success: false,
      code: 'COMPANY_ALREADY_LINKED',
      message: 'This account is already linked to a company.',
    });
  }

  if (!req.body.name) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Company name is required.',
    });
  }

  const company = await Company.create({
    name: req.body.name,
    taxId: req.body.taxId,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    logoUrl: req.body.logoUrl,
    settings: req.body.settings,
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { company: company._id },
    { new: true }
  ).populate('company');

  res.status(201).json({
    success: true,
    data: company,
    user: serializeUser(user),
  });
});

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: 'lax',
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Update user profile (Self)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  if (req.body.password) {
     // bcrypt is handled in user model pre-save
     fieldsToUpdate.password = req.body.password;
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  }).populate('company');

  res.status(200).json(buildAuthPayload(user, req.token));
});

// Get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res, remember = false) => {
  // Create token
  const token = user.getSignedJwtToken();
  const populatedUser = await User.findById(user._id).populate('company');

  // Set cookie expiration: 30 days if remember, else 1 day
  const maxAge = remember 
    ? 30 * 24 * 60 * 60 * 1000 
    : 24 * 60 * 60 * 1000;

  const options = {
    expires: new Date(Date.now() + maxAge),
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // Set to true in production with HTTPS
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json(buildAuthPayload(populatedUser, token));
};

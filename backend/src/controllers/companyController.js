import Company from '../models/Company.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get company profile
// @route   GET /api/company
// @access  Private
export const getCompany = asyncHandler(async (req, res, next) => {
  // If user has no company associated, returning empty success or 404
  if (!req.user.company) {
    return res.status(200).json({
      success: true,
      data: null
    });
  }

  const company = await Company.findById(req.user.company);

  if (!company) {
    return next(new ErrorResponse('Company not found', 404));
  }

  res.status(200).json({
    success: true,
    data: company
  });
});

// @desc    Update company profile
// @route   PUT /api/company
// @access  Private
export const updateCompany = asyncHandler(async (req, res, next) => {
  let company;

  if (!req.user.company) {
    // Create new company if none exists for user
    company = await Company.create(req.body);
    // Update user's company field
    await User.findByIdAndUpdate(req.user.id, { company: company._id });
  } else {
    company = await Company.findByIdAndUpdate(req.user.company, req.body, {
      new: true,
      runValidators: true
    });
  }

  // Ensure the user's local company property is updated if it was just created
  const user = await User.findById(req.user.id).populate('company');
  
  res.status(200).json({
    success: true,
    data: company,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company
    }
  });
});


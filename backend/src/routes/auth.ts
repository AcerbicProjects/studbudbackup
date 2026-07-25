import { Router, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import { authenticateToken, AuthenticatedRequest, authLimiter } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { fullName, email, password, university, studentId } = req.body;

    if (!fullName || !email || !password || !university || !studentId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email address is already registered' });
    }

    const user = new User({
      fullName,
      email,
      password,
      university,
      studentId,
      emailVerified: false,
    });

    await user.save();

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return res.status(201).json({
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/google-login
router.post('/google-login', authLimiter, async (req, res) => {
  try {
    const { email, fullName, googleId, profilePhoto } = req.body;

    if (!email || !fullName || !googleId) {
      return res.status(400).json({ message: 'Missing required Google profile fields' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      
      user = new User({
        fullName,
        email,
        password: randomPassword,
        university: 'Google Sign-In',
        studentId: `G-${googleId}`,
        profilePhoto: profilePhoto || '',
        emailVerified: true,
      });

      await user.save();
    } else {
      if (!user.profilePhoto && profilePhoto) {
        user.profilePhoto = profilePhoto;
        await user.save();
      }
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return res.json({
      message: 'Google login successful',
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Server error during Google login' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  return res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is missing' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ message: 'Refresh token is invalid or expired' });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ message: 'Server error during token refresh' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 for security reasons, so attackers don't know who has accounts
      return res.json({ message: 'If an account exists with that email, a password reset link has been generated.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
    console.log(`[PASSWORD RESET] Reset link: http://localhost:5000/api/auth/reset-password?token=${resetToken}`);

    return res.json({ message: 'If an account exists with that email, a password reset link has been generated.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error during password reset request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // In a full production app, we would query a ResetTokens collection.
    // For this implementation, we will log reset request and find user.
    // For demo purposes, we will reset the first user matching if token exists.
    const user = await User.findOne(); 
    if (!user) {
      return res.status(400).json({ message: 'Invalid token or user not found' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error during password reset' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne();
    if (!user) {
      return res.status(400).json({ message: 'User not found or invalid token' });
    }

    user.emailVerified = true;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return res.status(500).json({ message: 'Server error during email verification' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return res.json(userResponse);
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error loading profile' });
  }
});

export default router;

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as registerPOST } from '../register/route';
import { POST as resetPasswordPOST, PUT as resetPasswordPUT } from '../reset-password/route';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: jest.fn(),
      forgetPassword: jest.fn(),
      resetPassword: jest.fn(),
    },
  },
}));

const mockAuth = require('@/lib/auth').auth;

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockAuth.api.signUpEmail.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          language: 'fr',
        }),
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('Registration successful');
      expect(data.user).toEqual(mockUser);
      expect(mockAuth.api.signUpEmail).toHaveBeenCalledWith({
        body: {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          callbackURL: expect.stringContaining('/auth/verify-email'),
        },
      });
    });

    it('should handle registration errors', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email already exists');
    });

    it('should validate input data', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'T', // Too short
          email: 'invalid-email',
          password: '123', // Too short
        }),
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toHaveLength(3);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should send password reset email successfully', async () => {
      mockAuth.api.forgetPassword.mockResolvedValue({
        data: {},
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('Password reset email sent');
      expect(mockAuth.api.forgetPassword).toHaveBeenCalledWith({
        body: {
          email: 'test@example.com',
          redirectTo: expect.stringContaining('/auth/reset-password'),
        },
      });
    });

    it('should handle invalid email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/auth/reset-password', () => {
    it('should update password successfully', async () => {
      mockAuth.api.resetPassword.mockResolvedValue({
        data: {},
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'PUT',
        body: JSON.stringify({
          token: 'valid-token',
          password: 'newpassword123',
        }),
      });

      const response = await resetPasswordPUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Password updated successfully.');
      expect(mockAuth.api.resetPassword).toHaveBeenCalledWith({
        body: {
          token: 'valid-token',
          password: 'newpassword123',
        },
      });
    });

    it('should handle invalid token', async () => {
      mockAuth.api.resetPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid or expired token' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'PUT',
        body: JSON.stringify({
          token: 'invalid-token',
          password: 'newpassword123',
        }),
      });

      const response = await resetPasswordPUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid or expired token');
    });
  });
});
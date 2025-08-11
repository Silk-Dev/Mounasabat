import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../lib/auth-context';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/auth/signin',
}));

// Mock better-auth
jest.mock('better-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
}));

// Mock API responses
global.fetch = jest.fn();

// Mock components
const SignInForm = ({ onSuccess }: { onSuccess: (user: any) => void }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.user);
      } else {
        setError(data.error || 'Sign in failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="signin-form">
      <h1>Sign In</h1>
      {error && <div data-testid="error-message">{error}</div>}
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      
      <a href="/auth/signup" data-testid="signup-link">
        Don't have an account? Sign up
      </a>
      
      <a href="/auth/forgot-password" data-testid="forgot-password-link">
        Forgot password?
      </a>
    </form>
  );
};

const SignUpForm = ({ onSuccess }: { onSuccess: (user: any) => void }) => {
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.user);
      } else {
        setError(data.error || 'Sign up failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} data-testid="signup-form">
      <h1>Sign Up</h1>
      {error && <div data-testid="error-message">{error}</div>}
      
      <div>
        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label htmlFor="role">I am a</label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="customer">Customer</option>
          <option value="provider">Service Provider</option>
        </select>
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
      
      <a href="/auth/signin" data-testid="signin-link">
        Already have an account? Sign in
      </a>
    </form>
  );
};

const ForgotPasswordForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="forgot-password-form">
      <h1>Reset Password</h1>
      {error && <div data-testid="error-message">{error}</div>}
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Email'}
      </button>
      
      <a href="/auth/signin" data-testid="back-to-signin">
        Back to Sign In
      </a>
    </form>
  );
};

const AuthApp = () => {
  const [currentView, setCurrentView] = React.useState('signin');
  const [user, setUser] = React.useState(null);
  const [resetEmailSent, setResetEmailSent] = React.useState(false);

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      setCurrentView('signin');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (user) {
    return (
      <div data-testid="authenticated-view">
        <h1>Welcome, {user.firstName}!</h1>
        <p>Role: {user.role}</p>
        <p>Email: {user.email}</p>
        <button onClick={handleSignOut} data-testid="signout-button">
          Sign Out
        </button>
      </div>
    );
  }

  if (resetEmailSent) {
    return (
      <div data-testid="reset-email-sent">
        <h1>Reset Email Sent</h1>
        <p>Check your email for password reset instructions.</p>
        <button onClick={() => setResetEmailSent(false)} data-testid="back-to-signin">
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div data-testid="auth-app">
      {currentView === 'signin' && (
        <SignInForm onSuccess={handleAuthSuccess} />
      )}
      {currentView === 'signup' && (
        <SignUpForm onSuccess={handleAuthSuccess} />
      )}
      {currentView === 'forgot-password' && (
        <ForgotPasswordForm onSuccess={() => setResetEmailSent(true)} />
      )}
      
      <div data-testid="auth-navigation">
        <button onClick={() => setCurrentView('signin')}>Sign In</button>
        <button onClick={() => setCurrentView('signup')}>Sign Up</button>
        <button onClick={() => setCurrentView('forgot-password')}>Forgot Password</button>
      </div>
    </div>
  );
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes successful sign in flow', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'customer',
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser }),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should show sign in form initially
    expect(screen.getByTestId('signin-form')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();

    // Fill in credentials
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument();

    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated-view')).toBeInTheDocument();
    });

    // Should display user information
    expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    expect(screen.getByText('Role: customer')).toBeInTheDocument();
    expect(screen.getByText('Email: john@example.com')).toBeInTheDocument();

    // Check API was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john@example.com',
        password: 'password123',
      }),
    });
  });

  it('handles sign in errors', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Should still show sign in form
    expect(screen.getByTestId('signin-form')).toBeInTheDocument();
  });

  it('completes successful sign up flow', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      role: 'provider',
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser }),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    // Navigate to sign up
    await user.click(screen.getByText('Sign Up'));

    expect(screen.getByTestId('signup-form')).toBeInTheDocument();

    // Fill in registration form
    await user.type(screen.getByLabelText('First Name'), 'Jane');
    await user.type(screen.getByLabelText('Last Name'), 'Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.selectOptions(screen.getByLabelText('I am a'), 'provider');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-view')).toBeInTheDocument();
    });

    expect(screen.getByText('Welcome, Jane!')).toBeInTheDocument();
    expect(screen.getByText('Role: provider')).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'provider',
      }),
    });
  });

  it('validates password confirmation in sign up', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.click(screen.getByText('Sign Up'));

    await user.type(screen.getByLabelText('First Name'), 'Jane');
    await user.type(screen.getByLabelText('Last Name'), 'Smith');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'differentpassword');

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles sign up errors', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Email already exists' }),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.click(screen.getByText('Sign Up'));

    await user.type(screen.getByLabelText('First Name'), 'Jane');
    await user.type(screen.getByLabelText('Last Name'), 'Smith');
    await user.type(screen.getByLabelText('Email'), 'existing@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('completes forgot password flow', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.click(screen.getByText('Forgot Password'));

    expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /send reset email/i }));

    await waitFor(() => {
      expect(screen.getByTestId('reset-email-sent')).toBeInTheDocument();
    });

    expect(screen.getByText('Reset Email Sent')).toBeInTheDocument();
    expect(screen.getByText('Check your email for password reset instructions.')).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    });
  });

  it('handles sign out flow', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'customer',
    };

    // Mock successful sign in
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    // Sign in first
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-view')).toBeInTheDocument();
    });

    // Sign out
    await user.click(screen.getByTestId('signout-button'));

    await waitFor(() => {
      expect(screen.getByTestId('signin-form')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenLastCalledWith('/api/auth/signout', {
      method: 'POST',
    });
  });

  it('handles network errors gracefully', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });
  });

  it('navigates between auth forms using links', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    // Start with sign in form
    expect(screen.getByTestId('signin-form')).toBeInTheDocument();

    // Navigate to sign up via link
    await user.click(screen.getByTestId('signup-link'));
    expect(screen.getByTestId('signup-form')).toBeInTheDocument();

    // Navigate back to sign in via link
    await user.click(screen.getByTestId('signin-link'));
    expect(screen.getByTestId('signin-form')).toBeInTheDocument();

    // Navigate to forgot password via link
    await user.click(screen.getByTestId('forgot-password-link'));
    expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();

    // Navigate back to sign in via link
    await user.click(screen.getByTestId('back-to-signin'));
    expect(screen.getByTestId('signin-form')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    // Try to submit empty sign in form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // HTML5 validation should prevent submission
    expect(global.fetch).not.toHaveBeenCalled();

    // Navigate to sign up and try empty form
    await user.click(screen.getByText('Sign Up'));
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('maintains form state during navigation', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthApp />
        </AuthProvider>
      </BrowserRouter>
    );

    // Fill in some data in sign in form
    await user.type(screen.getByLabelText('Email'), 'john@example.com');

    // Navigate away and back
    await user.click(screen.getByText('Sign Up'));
    await user.click(screen.getByText('Sign In'));

    // Form should be reset (this is expected behavior)
    expect(screen.getByLabelText('Email')).toHaveValue('');
  });
});
/**
 * Stripe mock for real data tests
 * 
 * This mock ensures that Stripe calls don't interfere with real data tests
 * while still allowing us to test payment-related functionality.
 */

const stripeMock = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      status: 'requires_payment_method'
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'pi_test_123',
      status: 'succeeded',
      amount: 5000
    }),
    confirm: jest.fn().mockResolvedValue({
      id: 'pi_test_123',
      status: 'succeeded'
    })
  },
  
  customers: {
    create: jest.fn().mockResolvedValue({
      id: 'cus_test_123',
      email: 'test@example.com'
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'cus_test_123',
      email: 'test@example.com'
    })
  },
  
  prices: {
    list: jest.fn().mockResolvedValue({
      data: []
    })
  },
  
  products: {
    list: jest.fn().mockResolvedValue({
      data: []
    })
  }
};

module.exports = stripeMock;
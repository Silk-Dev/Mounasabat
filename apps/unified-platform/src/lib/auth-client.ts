// Re-export from the database auth client for consistency
export { authClient } from '@/lib/database/auth-client';

// Export the hooks for easier usage  
import { authClient } from '@/lib/database/auth-client';
export const { useSession, $Infer } = authClient;
'use server';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Vérification basique des champs
    if (!email || !password) {
      return { error: 'Email et mot de passe requis' };
    }
    
    // La validation réelle sera gérée par NextAuth
    return { success: true };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Une erreur est survenue lors de la connexion' };
  }
}

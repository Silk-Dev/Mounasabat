export type Language = 'fr' | 'ar';

export interface AuthMessages {
  registration: {
    success: string;
    emailVerificationSent: string;
    errors: {
      emailExists: string;
      invalidEmail: string;
      passwordTooShort: string;
      nameRequired: string;
    };
  };
  passwordReset: {
    emailSent: string;
    success: string;
    errors: {
      userNotFound: string;
      invalidToken: string;
      tokenExpired: string;
    };
  };
  validation: {
    required: string;
    invalidEmail: string;
    passwordMinLength: string;
    nameMinLength: string;
  };
}

export interface UserProfileMessages {
  profile: {
    updateSuccess: string;
    updateError: string;
    notFound: string;
    dashboard: {
      welcome: string;
      recentOrders: string;
      upcomingBookings: string;
      viewAll: string;
      noOrders: string;
      noBookings: string;
      noFavorites: string;
    };
  };
  preferences: {
    updateSuccess: string;
    languageChanged: string;
    title: string;
    language: string;
    notifications: string;
    emailNotifications: string;
    smsNotifications: string;
    pushNotifications: string;
    darkMode: string;
    currency: string;
  };
  favorites: {
    added: string;
    removed: string;
    alreadyExists: string;
    notFound: string;
    providers: string;
    products: string;
    empty: string;
    filter: string;
  };
  validation: {
    invalidLanguage: string;
    invalidPhoneNumber: string;
    invalidPreference: string;
  };
  dashboard: {
    orders: string;
    bookings: string;
    favorites: string;
    profile: string;
    settings: string;
  };
}

const authMessages: Record<Language, AuthMessages> = {
  fr: {
    registration: {
      success: 'Inscription réussie. Veuillez vérifier votre email.',
      emailVerificationSent: 'Email de vérification envoyé.',
      errors: {
        emailExists: 'Cette adresse email est déjà utilisée.',
        invalidEmail: 'Adresse email invalide.',
        passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères.',
        nameRequired: 'Le nom est requis.',
      },
    },
    passwordReset: {
      emailSent: 'Email de réinitialisation envoyé. Vérifiez votre boîte de réception.',
      success: 'Mot de passe mis à jour avec succès.',
      errors: {
        userNotFound: 'Aucun utilisateur trouvé avec cette adresse email.',
        invalidToken: 'Token invalide ou expiré.',
        tokenExpired: 'Le token a expiré.',
      },
    },
    validation: {
      required: 'Ce champ est requis.',
      invalidEmail: 'Adresse email invalide.',
      passwordMinLength: 'Le mot de passe doit contenir au moins 8 caractères.',
      nameMinLength: 'Le nom doit contenir au moins 2 caractères.',
    },
  },
  ar: {
    registration: {
      success: 'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني.',
      emailVerificationSent: 'تم إرسال بريد التحقق الإلكتروني.',
      errors: {
        emailExists: 'هذا البريد الإلكتروني مستخدم بالفعل.',
        invalidEmail: 'عنوان بريد إلكتروني غير صالح.',
        passwordTooShort: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.',
        nameRequired: 'الاسم مطلوب.',
      },
    },
    passwordReset: {
      emailSent: 'تم إرسال بريد إعادة تعيين كلمة المرور. تحقق من صندوق الوارد.',
      success: 'تم تحديث كلمة المرور بنجاح.',
      errors: {
        userNotFound: 'لم يتم العثور على مستخدم بهذا البريد الإلكتروني.',
        invalidToken: 'رمز غير صالح أو منتهي الصلاحية.',
        tokenExpired: 'انتهت صلاحية الرمز.',
      },
    },
    validation: {
      required: 'هذا الحقل مطلوب.',
      invalidEmail: 'عنوان بريد إلكتروني غير صالح.',
      passwordMinLength: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.',
      nameMinLength: 'يجب أن يحتوي الاسم على حرفين على الأقل.',
    },
  },
};

const userProfileMessages: Record<Language, UserProfileMessages> = {
  fr: {
    profile: {
      updateSuccess: 'Profil mis à jour avec succès.',
      updateError: 'Erreur lors de la mise à jour du profil.',
      notFound: 'Profil utilisateur non trouvé.',
      dashboard: {
        welcome: 'Bienvenue, {name}!',
        recentOrders: 'Commandes récentes',
        upcomingBookings: 'Réservations à venir',
        viewAll: 'Voir tout',
        noOrders: 'Vous n\'avez pas encore de commandes.',
        noBookings: 'Vous n\'avez pas encore de réservations.',
        noFavorites: 'Vous n\'avez pas encore de favoris.',
      },
    },
    preferences: {
      updateSuccess: 'Préférences mises à jour avec succès.',
      languageChanged: 'Langue changée avec succès.',
      title: 'Préférences',
      language: 'Langue',
      notifications: 'Notifications',
      emailNotifications: 'Notifications par email',
      smsNotifications: 'Notifications par SMS',
      pushNotifications: 'Notifications push',
      darkMode: 'Mode sombre',
      currency: 'Devise',
    },
    favorites: {
      added: 'Ajouté aux favoris avec succès.',
      removed: 'Retiré des favoris avec succès.',
      alreadyExists: 'Cet élément est déjà dans vos favoris.',
      notFound: 'Favori non trouvé.',
      providers: 'Prestataires',
      products: 'Produits',
      empty: 'Vous n\'avez pas encore de favoris.',
      filter: 'Filtrer par type',
    },
    validation: {
      invalidLanguage: 'Langue non prise en charge.',
      invalidPhoneNumber: 'Numéro de téléphone invalide.',
      invalidPreference: 'Préférence invalide.',
    },
    dashboard: {
      orders: 'Commandes',
      bookings: 'Réservations',
      favorites: 'Favoris',
      profile: 'Profil',
      settings: 'Paramètres',
    },
  },
  ar: {
    profile: {
      updateSuccess: 'تم تحديث الملف الشخصي بنجاح.',
      updateError: 'خطأ في تحديث الملف الشخصي.',
      notFound: 'لم يتم العثور على الملف الشخصي للمستخدم.',
      dashboard: {
        welcome: 'مرحبًا، {name}!',
        recentOrders: 'الطلبات الأخيرة',
        upcomingBookings: 'الحجوزات القادمة',
        viewAll: 'عرض الكل',
        noOrders: 'ليس لديك أي طلبات حتى الآن.',
        noBookings: 'ليس لديك أي حجوزات حتى الآن.',
        noFavorites: 'ليس لديك أي مفضلات حتى الآن.',
      },
    },
    preferences: {
      updateSuccess: 'تم تحديث التفضيلات بنجاح.',
      languageChanged: 'تم تغيير اللغة بنجاح.',
      title: 'التفضيلات',
      language: 'اللغة',
      notifications: 'الإشعارات',
      emailNotifications: 'إشعارات البريد الإلكتروني',
      smsNotifications: 'إشعارات الرسائل القصيرة',
      pushNotifications: 'الإشعارات الفورية',
      darkMode: 'الوضع الداكن',
      currency: 'العملة',
    },
    favorites: {
      added: 'تمت الإضافة إلى المفضلة بنجاح.',
      removed: 'تمت الإزالة من المفضلة بنجاح.',
      alreadyExists: 'هذا العنصر موجود بالفعل في المفضلة لديك.',
      notFound: 'لم يتم العثور على المفضلة.',
      providers: 'مقدمي الخدمات',
      products: 'المنتجات',
      empty: 'ليس لديك أي مفضلات حتى الآن.',
      filter: 'تصفية حسب النوع',
    },
    validation: {
      invalidLanguage: 'اللغة غير مدعومة.',
      invalidPhoneNumber: 'رقم الهاتف غير صالح.',
      invalidPreference: 'تفضيل غير صالح.',
    },
    dashboard: {
      orders: 'الطلبات',
      bookings: 'الحجوزات',
      favorites: 'المفضلة',
      profile: 'الملف الشخصي',
      settings: 'الإعدادات',
    },
  },
};

export function getAuthMessages(language: Language = 'fr'): AuthMessages {
  return authMessages[language];
}

export function getUserProfileMessages(language: Language = 'fr'): UserProfileMessages {
  return userProfileMessages[language];
}

export function detectLanguage(acceptLanguage?: string): Language {
  if (!acceptLanguage) return 'fr';
  
  const languages = acceptLanguage
    .split(',')
    .map(lang => lang.split(';')[0].trim().toLowerCase());
  
  if (languages.some(lang => lang.startsWith('ar'))) {
    return 'ar';
  }
  
  return 'fr';
}
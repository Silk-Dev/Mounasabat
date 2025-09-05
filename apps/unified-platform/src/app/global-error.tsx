'use client';

import Error from 'next/error';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-center text-gray-900">
              Une erreur est survenue
            </h1>
            <p className="text-gray-600 text-center">
              Nous sommes désolés, une erreur inattendue s'est produite.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => reset()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

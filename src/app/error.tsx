"use client"; // Error boundary wajib Client Component

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Waduh! Ada yang gosong 👨‍🍳
        </h2>
        <p className="text-gray-600 mb-6">
          Koki gagal memasak halaman dashboard ini. Mungkin database lagi penuh
          atau ada masalah koneksi.
        </p>
        <button
          onClick={() => reset()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Coba Masak Ulang
        </button>
      </div>
    </div>
  );
}

// src/app/components/LoadingIndicator.tsx
export const LoadingIndicator = ({
  message = "Chargement...",
}: {
  message?: string;
}) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center min-w-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)] mx-auto mb-4"></div>
        <p className="text-lg font-medium text-[color:var(--foreground)]">
          {message}
        </p>
      </div>
    </div>
  );
};

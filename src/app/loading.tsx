export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-6xl animate-pulse space-y-8">
        <div className="h-10 w-1/4 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

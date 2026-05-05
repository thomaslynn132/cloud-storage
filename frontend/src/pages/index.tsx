import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>FileHost - Cloud File Hosting</title>
        <meta name="description" content="Upload, store, and share files with our content distribution platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">FileHost</h1>
            <div className="space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-indigo-600">
                Sign In
              </Link>
              <Link href="/register" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Cloud File Hosting
              <br />
              <span className="text-indigo-600">Made Simple</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Upload, store, and share files with our content distribution platform. 
              Free tier with ads, or upgrade for permanent storage.
            </p>
            <div className="space-x-4">
              <Link href="/register" className="px-8 py-3 bg-indigo-600 text-white rounded-lg text-lg hover:bg-indigo-700 inline-block">
                Start for Free
              </Link>
              <Link href="/pricing" className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg text-lg hover:bg-indigo-50 inline-block">
                View Pricing
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Fast Uploads</h3>
              <p className="text-gray-600">
                Direct-to-cloud uploads with chunked uploading support. No bandwidth limits.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Global CDN</h3>
              <p className="text-gray-600">
                Content distributed via Cloudflare for lightning-fast downloads worldwide.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-3">Secure Sharing</h3>
              <p className="text-gray-600">
                Share files with public links. Ad-supported free downloads.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
      <p className="text-8xl font-bold tracking-tight text-violet-500">404</p>
      <h1 className="mt-6 text-2xl font-semibold">
        This page could not be found.
      </h1>
      <Link
        href="/"
        className="mt-8 rounded-full bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500"
      >
        Back to home
      </Link>
    </main>
  );
}

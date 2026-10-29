import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-jd py-24 text-center">
      <h1 className="t-h1">We couldn&apos;t find that page</h1>
      <p className="t-body mx-auto mt-3 max-w-md text-muted">The product may have sold out or moved. Try searching, or start with what&apos;s new.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/collections/new-arrivals" className="btn btn-primary">Shop New Arrivals</Link>
        <Link href="/" className="btn btn-outline">Go home</Link>
      </div>
    </div>
  );
}

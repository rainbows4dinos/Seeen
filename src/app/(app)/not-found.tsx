import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-4xl font-bold sm:text-[52px]">Nothing here.</h1>
      <p className="text-muted">
        This page could not be found. It may have been removed, archived out of view, or the link is off by a
        character.
      </p>
      <Link href="/" className="button-secondary">
        Back to the directory
      </Link>
    </div>
  );
}

"use server";

import Link from "next/link";

export default async function Footer() {
  return (
    <footer className="ml-4 border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-muted-foreground text-center text-sm leading-loose md:text-left">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary font-medium underline underline-offset-4"
          >
            ALERT
          </Link>
          - Automated Leak Examination and Reporting Tool. Built by{" "}
          <Link
            href=""
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary font-medium underline underline-offset-4"
          >
            Melvin2306
          </Link>
          . The source code is available on{" "}
          <Link
            href=""
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary font-medium underline underline-offset-4"
          >
            GitHub
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}

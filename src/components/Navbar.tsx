"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/performances", label: "Performances" },
    { href: "/events", label: "Events" },
    { href: "/ticket", label: "My Ticket" },
  ];

  if (session?.user?.isAdmin) {
    navLinks.push({ href: "/admin", label: "Admin Panel" });
  }

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-christmas-dark/80 border-b border-christmas-gold/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎄</span>
            <span className="font-bold text-xl text-christmas-gold">
              KIKI Christmas Event
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link ${
                      pathname === link.href ? "active" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="h-6 w-px bg-christmas-gold/30 mx-2" />
                <span className="text-sm text-christmas-cream/70">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="nav-link text-red-400 hover:text-red-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`nav-link ${
                    pathname === "/login" ? "active" : ""
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={`nav-link ${
                    pathname === "/register" ? "active" : ""
                  }`}
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <MobileMenu
              session={session}
              pathname={pathname}
              navLinks={navLinks}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function MobileMenu({
  session,
  pathname,
  navLinks,
}: {
  session: any;
  pathname: string;
  navLinks: { href: string; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-christmas-cream p-2"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 christmas-card p-2">
          {session ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block nav-link ${
                    pathname === link.href ? "active" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                className="block w-full text-left nav-link text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block nav-link"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="block nav-link"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";

/**
 * Barreira 1: nenhuma página ou API do admin é servida sem sessão válida.
 * (Barreira 2: cada route handler valida de novo com requireAdmin.)
 */
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/auth"]);

function harden(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ADMIN_PATHS.has(pathname)) return harden(NextResponse.next());

  if (await requireAdmin(req)) return harden(NextResponse.next());

  if (pathname.startsWith("/api/")) {
    return harden(NextResponse.json({ error: "Não autorizado" }, { status: 401 }));
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return harden(NextResponse.redirect(url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

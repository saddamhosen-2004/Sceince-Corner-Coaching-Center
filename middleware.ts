import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  const supabase = createServerClient(
    supabaseUrl,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  
  // Redirect /admin or /admin/ to dashboard or login
  const cleanPath = url.pathname.replace(/\/$/, "");
  if (cleanPath === "/admin") {
    url.pathname = user ? "/admin/dashboard" : "/admin/login";
    return NextResponse.redirect(url);
  }

  // Define route classifications
  const isAdminPath =
    url.pathname.startsWith("/admin") &&
    !url.pathname.startsWith("/admin/login");

  // Redirect to login if unauthenticated admin path access is requested
  if (isAdminPath && !user) {
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if logged in admin tries to access login page
  if (url.pathname === "/admin/login" && user) {
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes that do not need protection (e.g. public result search, imagekit auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

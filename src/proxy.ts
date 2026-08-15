import withAuth from "next-auth/middleware";

export default withAuth;

export const config = {
  matcher: ["/admin/:path*", "/freelancer/:path*", "/qualify/:path*", "/sales/:path*"],
};

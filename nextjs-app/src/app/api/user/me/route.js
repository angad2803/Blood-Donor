import {
  authenticateUser,
  createAuthResponse,
} from "../../../../lib/middleware.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authResult = await authenticateUser(request);

  if (authResult.error) {
    return createAuthResponse(authResult.error, authResult.status);
  }

  return new Response(
    JSON.stringify({
      message: "User profile retrieved successfully",
      user: authResult.user,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

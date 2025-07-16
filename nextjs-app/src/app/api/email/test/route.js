import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Simulate email sending (replace with actual email service)
    console.log(`📧 Sending test email to: ${email}`);

    // In a real implementation, you would use your email service here
    // Example: await sendEmail(email, "Test Email", "This is a test email");

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      to: email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send test email" },
      { status: 500 }
    );
  }
}

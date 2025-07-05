import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Mock email configuration status
    const emailConfig = {
      sendgridConfigured: !!process.env.SENDGRID_API_KEY,
      gmailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      fromEmail: process.env.FROM_EMAIL || "noreply@blooddonor.com",
      supportEmail: process.env.SUPPORT_EMAIL || "support@blooddonor.com",
    };

    return NextResponse.json({
      success: true,
      configuration: emailConfig,
    });
  } catch (error) {
    console.error("Email config error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get email configuration" },
      { status: 500 }
    );
  }
}

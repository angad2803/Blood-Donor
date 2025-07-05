import connectDB from "../../../../lib/mongodb.js";
import User from "../../../../models/User.js";
import { hashPassword, generateToken } from "../../../../lib/auth.js";

export async function POST(request) {
  try {
    await connectDB();

    const {
      name,
      email,
      password,
      bloodGroup,
      location,
      isDonor,
      isHospital,
      hospitalName,
      hospitalAddress,
      hospitalLicense,
      coordinates,
    } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "User already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    if (!name || !email || !password || !location) {
      return new Response(
        JSON.stringify({
          message: "Name, email, password, and location are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate hospital fields if registering as hospital
    if (isHospital && (!hospitalName || !hospitalAddress || !hospitalLicense)) {
      return new Response(
        JSON.stringify({
          message:
            "Hospital name, address, and license are required for hospital registration",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate blood group for non-hospital users
    if (!isHospital && !bloodGroup) {
      return new Response(
        JSON.stringify({ message: "Blood group is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Prepare user data
    const userData = {
      name,
      email,
      bloodGroup: isHospital ? undefined : bloodGroup,
      location,
      isDonor: isHospital ? false : isDonor,
      isHospital: isHospital || false,
      hospitalName: isHospital ? hospitalName : undefined,
      hospitalAddress: isHospital ? hospitalAddress : undefined,
      hospitalLicense: isHospital ? hospitalLicense : undefined,
      password: hashedPassword,
    };

    // Add GPS coordinates if provided
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      userData.coordinates = {
        type: "Point",
        coordinates: [
          parseFloat(coordinates.longitude),
          parseFloat(coordinates.latitude),
        ],
      };
    }

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    console.log(
      `✅ New user registered: ${newUser.email} (${
        isHospital ? "Hospital" : isDonor ? "Donor" : "Recipient"
      })`
    );

    // Generate JWT token
    const token = generateToken(newUser._id);

    // Remove password from user object
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return new Response(
      JSON.stringify({
        message: "Registration successful",
        token,
        user: userResponse,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

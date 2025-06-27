#!/usr/bin/env node

/**
 * 🚀 Blood Donation App - Setup Script
 *
 * This script helps you set up the development environment
 * Run: npm run setup
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🩸 Blood Donation App - Development Setup\n");

const checkFile = (filePath, description) => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} exists`);
    return true;
  } else {
    console.log(`❌ ${description} missing`);
    return false;
  }
};

const runCommand = (command, description) => {
  console.log(`🔄 ${description}...`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
};

console.log("📋 Checking prerequisites...\n");

// Check if required files exist
const checks = [
  { path: "Server/.env", desc: "Server environment file" },
  { path: "Server/package.json", desc: "Server package.json" },
  { path: "Client/package.json", desc: "Client package.json" },
];

let allGood = true;
checks.forEach((check) => {
  if (!checkFile(check.path, check.desc)) {
    allGood = false;
  }
});

if (!allGood) {
  console.log("\n❌ Setup incomplete. Please check missing files.");
  if (!fs.existsSync("Server/.env")) {
    console.log(
      "📝 Create Server/.env file using Server/.env.example as template"
    );
  }
  process.exit(1);
}

console.log("\n🔧 Installing dependencies...\n");

// Install server dependencies
runCommand("cd Server && npm install", "Installing server dependencies");

// Install client dependencies
runCommand("cd Client && npm install", "Installing client dependencies");

console.log("🎉 Setup completed successfully!\n");
console.log("📚 Next steps:");
console.log("1. Ensure MongoDB is running");
console.log("2. Start the server: cd Server && npm start");
console.log("3. Start the client: cd Client && npm run dev");
console.log("4. Open http://localhost:5173 in your browser\n");
console.log("🔐 Admin setup:");
console.log("- Register a user account first");
console.log("- Run: cd Server && node scripts/make-admin.js <your-email>");
console.log("- Access admin panel at /admin-cleanup\n");
console.log("Happy coding! 🚀");

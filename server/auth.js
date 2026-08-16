import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const sessionDurationMs = 8 * 60 * 60 * 1000;

export class AuthError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function readUsers(usersPath) {
  try {
    return JSON.parse(await readFile(usersPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsers(usersPath, users) {
  const temporaryPath = `${usersPath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(users, null, 2));
  await rename(temporaryPath, usersPath);
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(hash).toString("hex")}`;
}

async function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(":");
  if (!salt || !storedHash) return false;
  const hash = Buffer.from(await scrypt(password, salt, 64));
  const expectedHash = Buffer.from(storedHash, "hex");
  return hash.length === expectedHash.length && timingSafeEqual(hash, expectedHash);
}

function parseAddress(value, label) {
  let input;
  try {
    input = JSON.parse(value ?? "");
  } catch {
    throw new AuthError(`Enter your complete ${label.toLowerCase()}.`);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AuthError(`Enter your complete ${label.toLowerCase()}.`);
  }

  const address = {
    building: typeof input.building === "string" ? input.building.trim() : "",
    street: typeof input.street === "string" ? input.street.trim() : "",
    city: typeof input.city === "string" ? input.city.trim() : "",
    state: typeof input.state === "string" ? input.state.trim() : "",
    pinCode: typeof input.pinCode === "string" ? input.pinCode.trim() : "",
  };
  if (!address.building || address.street.length < 3 || address.city.length < 2 || address.state.length < 2 || !/^[1-9][0-9]{5}$/.test(address.pinCode)) {
    throw new AuthError(`Enter your complete ${label.toLowerCase()} with a valid six-digit PIN code.`);
  }
  return address;
}

function publicAddress(address) {
  if (address && typeof address === "object" && !Array.isArray(address)) return address;
  return { building: typeof address === "string" ? address : "", street: "", city: "", state: "", pinCode: "" };
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    personalEmail: user.personalEmail,
    mobile: user.mobile,
    graduationYear: user.graduationYear,
    onboardingComplete: Boolean(user.onboardingCompletedAt),
    profile: user.profile
      ? {
          dateOfBirth: user.profile.dateOfBirth,
          gender: user.profile.gender,
          permanentAddress: publicAddress(user.profile.permanentAddress),
          currentAddress: publicAddress(user.profile.currentAddress),
          photoDeclaration: Boolean(user.profile.photoDeclaration),
          profilePhoto: user.profile.profilePhoto
            ? {
                name: user.profile.profilePhoto.name,
                mimeType: user.profile.profilePhoto.mimeType,
              }
            : null,
        }
      : null,
    createdAt: user.createdAt,
  };
}

export async function createAuthService({ storageDirectory, enrollmentKeys, emailDomain }) {
  await mkdir(storageDirectory, { recursive: true });
  const usersPath = join(storageDirectory, "users.json");
  const sessions = new Map();
  let userWriteQueue = Promise.resolve();

  function issueSession(userId) {
    const token = randomBytes(32).toString("hex");
    sessions.set(token, { userId, expiresAt: Date.now() + sessionDurationMs });
    return token;
  }

  async function register(input) {
    const email = input.email?.trim().toLowerCase();
    const personalEmail = input.personalEmail?.trim().toLowerCase();
    const fullName = input.fullName?.trim();
    const mobile = input.mobile?.replace(/\s+/g, "");
    const enrollmentKey = input.enrollmentKey?.trim().toUpperCase();
    const password = input.password ?? "";
    const graduationYear = enrollmentKeys[enrollmentKey];

    if (!email || !email.endsWith(`@${emailDomain}`)) {
      throw new AuthError(`Use your @${emailDomain} college email address.`);
    }
    if (!graduationYear) throw new AuthError("The enrollment key is invalid or inactive.");
    if (!fullName || fullName.length < 3) throw new AuthError("Enter your full name.");
    if (!personalEmail || !personalEmail.includes("@")) throw new AuthError("Enter a valid personal email address.");
    if (!/^\+?[0-9]{10,15}$/.test(mobile ?? "")) throw new AuthError("Enter a valid mobile number.");
    if (password.length < 8) throw new AuthError("Password must contain at least 8 characters.");

    const passwordHash = await hashPassword(password);
    let createdUser;
    userWriteQueue = userWriteQueue.catch(() => undefined).then(async () => {
      const users = await readUsers(usersPath);
      if (users.some((user) => user.email === email)) {
        throw new AuthError("An account already exists for this college email.", 409);
      }
      createdUser = {
        id: randomUUID(),
        fullName,
        email,
        personalEmail,
        mobile,
        graduationYear,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      users.push(createdUser);
      await writeUsers(usersPath, users);
    });
    await userWriteQueue;
    return { user: publicUser(createdUser), token: issueSession(createdUser.id) };
  }

  async function login(input) {
    const email = input.email?.trim().toLowerCase();
    const users = await readUsers(usersPath);
    const user = users.find((item) => item.email === email);
    if (!user || !(await verifyPassword(input.password ?? "", user.passwordHash))) {
      throw new AuthError("Incorrect college email or password.", 401);
    }
    return { user: publicUser(user), token: issueSession(user.id) };
  }

  async function completeOnboarding(userId, input, profilePhoto) {
    const dateOfBirth = input.dateOfBirth?.trim();
    const gender = input.gender?.trim();
    const permanentAddress = parseAddress(input.permanentAddress, "Permanent address");
    const currentAddress = parseAddress(input.currentAddress, "Current address");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth ?? "") || Number.isNaN(Date.parse(dateOfBirth))) {
      throw new AuthError("Enter a valid date of birth.");
    }
    if (!new Set(["Male", "Female", "Non-binary", "Prefer not to say"]).has(gender)) {
      throw new AuthError("Select a valid gender option.");
    }
    if (!profilePhoto) {
      throw new AuthError("Upload a valid profile photo to continue.");
    }
    if (input.photoDeclaration !== "true") {
      throw new AuthError("Confirm that your face is visible in the profile photo.");
    }
    if (input.placementConsent !== "true") {
      throw new AuthError("Confirm the placement enrollment declaration.");
    }

    let updatedUser;
    userWriteQueue = userWriteQueue.catch(() => undefined).then(async () => {
      const users = await readUsers(usersPath);
      const userIndex = users.findIndex((user) => user.id === userId);
      if (userIndex === -1) throw new AuthError("Student account not found.", 404);
      const currentUser = users[userIndex];
      updatedUser = {
        ...currentUser,
        profile: {
          dateOfBirth,
          gender,
          permanentAddress,
          currentAddress,
          photoDeclaration: true,
          profilePhoto,
        },
        onboardingCompletedAt: new Date().toISOString(),
      };
      users[userIndex] = updatedUser;
      await writeUsers(usersPath, users);
    });
    await userWriteQueue;
    return publicUser(updatedUser);
  }

  async function authenticate(token) {
    const session = sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      if (token) sessions.delete(token);
      return null;
    }
    const users = await readUsers(usersPath);
    const user = users.find((item) => item.id === session.userId);
    return user ? publicUser(user) : null;
  }

  async function getProfilePhoto(userId) {
    const users = await readUsers(usersPath);
    return users.find((user) => user.id === userId)?.profile?.profilePhoto ?? null;
  }

  function logout(token) {
    if (token) sessions.delete(token);
  }

  return { authenticate, completeOnboarding, getProfilePhoto, login, logout, register, usersPath };
}

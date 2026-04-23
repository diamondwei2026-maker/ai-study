import path from "node:path";

export const uploadsRoot = path.resolve(process.cwd(), "uploads");
export const avatarUploadDir = path.join(uploadsRoot, "avatars");

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary, getCloudinaryConfig } from "@/lib/cloudinary";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ errorCode: "unauthorized" }, { status: 401 });
  }
  if (!getCloudinaryConfig()) {
    return NextResponse.json({ errorCode: "cloudinary_not_configured" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ errorCode: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ errorCode: "missing_file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ errorCode: "unsupported_type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ errorCode: "file_too_large" }, { status: 413 });
  }

  try {
    const { secureUrl, publicId } = await uploadToCloudinary(file, "rapidgo");
    return NextResponse.json({ url: secureUrl, publicId });
  } catch (err) {
    const code = err instanceof Error ? err.message : "upload_failed";
    return NextResponse.json({ errorCode: code }, { status: 500 });
  }
}

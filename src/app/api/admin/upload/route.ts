import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { saveUpload } from "@/lib/uploads/save-upload";

/**
 * Authenticated image upload. Accepts multipart/form-data with `file` and
 * `storeSlug`, stores the image under public/uploads/<storeSlug>/ and returns
 * its public URL. Used by the admin product image manager.
 */
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const storeSlug = String(formData.get("storeSlug") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!storeSlug) {
    return NextResponse.json({ error: "Missing store." }, { status: 400 });
  }

  const result = await saveUpload(file, storeSlug);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ url: result.url });
}

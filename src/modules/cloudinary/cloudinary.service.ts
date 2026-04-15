import axios from "axios";
import crypto from "crypto";
import FormData from "form-data";

export class CloudinaryService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    this.apiKey = process.env.CLOUDINARY_API_KEY!;
    this.apiSecret = process.env.CLOUDINARY_API_SECRET!;
  }

  private generateSignature(params: Record<string, string | number>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    return crypto
      .createHash("sha1")
      .update(sortedParams + this.apiSecret)
      .digest("hex");
  }

  // Upload gambar ke Cloudinary
  async upload(file: Express.Multer.File) {
    const timestamp = Math.floor(Date.now() / 1000);

    const params: Record<string, string | number> = {
      timestamp,
    };

    const signature = this.generateSignature(params);

    // Bikin form data untuk dikirim ke Cloudinary
    const formData = new FormData();
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    // Kirim ke Cloudinary via axios
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      formData,
      { headers: formData.getHeaders() }
    );

    // Response berisi secure_url (URL gambar yang bisa diakses publik)
    return response.data;
  }

  // Hapus gambar dari Cloudinary berdasarkan URL
  async removeByUrl(secureUrl: string) {
    const publicId = this.extractPublicIdFromUrl(secureUrl);
    return this.removeByPublicId(publicId);
  }

  async removeByPublicId(publicId: string) {
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = this.generateSignature({
      public_id: publicId,
      timestamp,
    });

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
      formData,
      { headers: formData.getHeaders() }
    );

    return response.data;
  }

  // Ambil public_id dari URL Cloudinary
  // contoh URL: https://res.cloudinary.com/.../image/upload/v1234/events/abc.jpg
  // public_id-nya: events/abc
  private extractPublicIdFromUrl(url: string): string {
    const withoutQuery = url.split("?")[0];
    const parts = withoutQuery.split("/");
    const uploadIndex = parts.findIndex((p) => p === "upload");
    const publicIdParts = parts.slice(uploadIndex + 2);
    const filename = publicIdParts.join("/");
    return filename.replace(/\.[^/.]+$/, "");
  }
}
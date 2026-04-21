import { PrismaClient } from "../../../generated/prisma/client.js";
import { ForgotPasswordDTO } from "../dto/forgot-password.dto.js";
import jwt from "jsonwebtoken";
import { MailService } from "../../mail/mail.service.js";
import { EXPIRED_RESET_TOKEN_JWT } from "../constants.js";

export class ForgotPasswordService{
    constructor(private prisma: PrismaClient, private mailService: MailService,){}

    forgotPassword = async (body: ForgotPasswordDTO) => {
    //1. cek dulu emailnya, terdaftar atau tidak
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    //2. kalau tidak return success
    if (!user) {
      return { message: "send email success" };
    }

    //3. generate token kalau emailnya ada
    const payload = { id: user.id, role: user.role };

    const token = jwt.sign(payload, process.env.JWT_SECRET_RESET!, {
      expiresIn: EXPIRED_RESET_TOKEN_JWT,
    });

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiredAt: new Date(Date.now() + 15 * 60 * 1000), // 15 menit
      },
    });

    //4. kirim email reset password + token
    await this.mailService.sendMail({
      to: body.email,
      subject: "Reset Password",
      templateName: "forgot-password",
      context: {
        link: `${process.env.BASE_URL_FE}/reset-password/${token}`,
      },
    });

    //5. return success
    return { message: "send email success" };
  };

}
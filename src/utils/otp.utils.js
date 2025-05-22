import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
import { readFile } from 'fs/promises';

export const sendOtpEmail = async (to, otp, name) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const template = await readFile('./src/Template/Otp.html', 'utf-8');
        const html = template
            .replace('{{USERNAME}}', name)
            .replace('{{OTP_CODE}}', otp)

        await transporter.sendMail({
            from: `"Task Manager" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`,
            html,
        });
    } catch (error) {
        console.log(error, 'mailerrorrrrrrrrr');
    }
};

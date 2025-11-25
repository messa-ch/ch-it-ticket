export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { z, ZodError } from 'zod';

const ticketSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required'),
    description: z.string().min(1, 'Description is required'),
    website: z.string().min(1, 'Website is required'),
    screenshots: z.array(z.string()).optional(), // Array of base64 strings
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = ticketSchema.parse(body);

        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const smtpFrom = process.env.SMTP_FROM || '"IT Support" <support@chmoney.co.uk>';

        if (!smtpHost || !smtpUser || !smtpPass) {
            return NextResponse.json(
                { error: 'Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.' },
                { status: 500 }
            );
        }

        // Create ticket in database
        const ticket = await prisma.ticket.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                subject: validatedData.subject,
                description: validatedData.description,
                website: validatedData.website,
            },
        });

        // Send email
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const attachments = validatedData.screenshots?.map((dataUrl, index) => {
            // Extract base64 data
            const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                return {
                    filename: `screenshot-${index + 1}.${matches[1].split('/')[1]}`,
                    content: Buffer.from(matches[2], 'base64'),
                };
            }
            return null;
        }).filter(Boolean) as any[];

        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error('SMTP verification failed', verifyError);
            return NextResponse.json(
                { error: 'Email delivery failed (SMTP verify). Check SMTP credentials.' },
                { status: 500 }
            );
        }

        try {
            await transporter.sendMail({
                from: smtpFrom,
                to: 'messa@chmoney.co.uk',
                subject: `[${validatedData.website}] New Ticket: ${validatedData.subject}`,
                text: `
        New Ticket Submitted
        
        Name: ${validatedData.name}
        Email: ${validatedData.email}
        Website: ${validatedData.website}
        Subject: ${validatedData.subject}
        
        Description:
        ${validatedData.description}
      `,
                html: `
        <h1>New Ticket Submitted</h1>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Website:</strong> ${validatedData.website}</p>
        <p><strong>Subject:</strong> ${validatedData.subject}</p>
        <br/>
        <p><strong>Description:</strong></p>
        <p>${validatedData.description.replace(/\n/g, '<br>')}</p>
      `,
                attachments: attachments,
            });
        } catch (mailError) {
            console.error('Failed to send ticket email', mailError);
            return NextResponse.json(
                { error: 'Email delivery failed (sendMail). Check SMTP credentials and from address.', ticket },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

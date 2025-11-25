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
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || 'user',
                pass: process.env.SMTP_PASS || 'pass',
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

        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"IT Support" <support@chmoney.co.uk>',
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

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

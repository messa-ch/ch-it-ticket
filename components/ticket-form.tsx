'use client';

import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Send, CheckCircle, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const websites = [
    'WFS Brokers',
    'WednesdayFS',
    'MoneyPlusAdvisor',
    'CHFinance',
    'SecureALoan',
    'ProtectionPlusAdvisor',
    'CH Content Creator',
];

const ticketSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required'),
    description: z.string().min(1, 'Description is required'),
    website: z.string().min(1, 'Please select a website'),
    urgency: z.number().min(1).max(5),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export function TicketForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [screenshots, setScreenshots] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TicketFormData>({
        resolver: zodResolver(ticketSchema),
        defaultValues: { urgency: 3 },
    });

    const processFiles = (files: File[]) => {
        const remainingSlots = Math.max(0, 3 - screenshots.length);
        const selectedFiles = files.slice(0, remainingSlots);

        selectedFiles.forEach((file) => {
            if (!file.type.startsWith('image/')) {
                return; // ignore non-images
            }
            // Skip very large files to prevent huge payloads
            if (file.size > 5 * 1024 * 1024) {
                setError('Please upload images under 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setScreenshots((prev) => [...prev, reader.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };

    const onSubmit = async (data: TicketFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, screenshots }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit ticket');
            }

            setIsSuccess(true);
            reset();
            setScreenshots([]);
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 glass rounded-3xl text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6"
                >
                    <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-4">Ticket Submitted!</h2>
                <p className="text-gray-300 mb-8 text-lg">
                    We've received your request and will get back to you shortly.
                </p>
                <button
                    onClick={() => setIsSuccess(false)}
                    className="px-8 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all transform hover:scale-105"
                >
                    Submit Another Ticket
                </button>
            </motion.div>
        );
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8 glass p-8 md:p-12 rounded-3xl"
        >
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">Submit a Ticket</h2>
                <p className="text-gray-200">Tell us about the issue you're experiencing.</p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3"
                >
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-white ml-1">Name</label>
                    <input
                        {...register('name')}
                        className={clsx(
                            "w-full px-5 py-3 rounded-xl outline-none transition-all glass-input",
                            errors.name && "border-red-500/50 focus:border-red-500"
                        )}
                        placeholder="John Doe"
                    />
                    {errors.name && <p className="text-xs text-red-400 ml-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-white ml-1">Email</label>
                    <input
                        {...register('email')}
                        className={clsx(
                            "w-full px-5 py-3 rounded-xl outline-none transition-all glass-input",
                            errors.email && "border-red-500/50 focus:border-red-500"
                        )}
                        placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-white ml-1">Website</label>
                <div className="relative">
                    <select
                        {...register('website')}
                        className={clsx(
                            "w-full px-5 py-3 rounded-xl outline-none transition-all appearance-none glass-input text-gray-300",
                            errors.website && "border-red-500/50 focus:border-red-500"
                        )}
                        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} // Fix for select dropdown background
                    >
                        <option value="" className="bg-gray-900 text-gray-300">Select a website...</option>
                        {websites.map((site) => (
                            <option key={site} value={site} className="bg-gray-900 text-white">
                                {site}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                </div>
                {errors.website && <p className="text-xs text-red-400 ml-1">{errors.website.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-white ml-1">Subject</label>
                <input
                    {...register('subject')}
                    className={clsx(
                        "w-full px-5 py-3 rounded-xl outline-none transition-all glass-input",
                        errors.subject && "border-red-500/50 focus:border-red-500"
                    )}
                    placeholder="Brief summary of the issue"
                />
                {errors.subject && <p className="text-xs text-red-400 ml-1">{errors.subject.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-white ml-1">Description</label>
                <textarea
                    {...register('description')}
                    rows={5}
                    className={clsx(
                        "w-full px-5 py-3 rounded-xl outline-none transition-all resize-none glass-input",
                        errors.description && "border-red-500/50 focus:border-red-500"
                    )}
                    placeholder="Please describe the issue in detail..."
                />
                {errors.description && <p className="text-xs text-red-400 ml-1">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-white ml-1 flex items-center gap-2">
                    Urgency <span className="text-gray-300 text-xs">(1 = low, 5 = critical)</span>
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        {...register('urgency', { valueAsNumber: true })}
                        className="w-full accent-white"
                    />
                    <span className="w-8 text-center text-white font-semibold">{watch('urgency') ?? 3}</span>
                </div>
                {errors.urgency && <p className="text-xs text-red-400 ml-1">{errors.urgency.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-white ml-1">Screenshots (Optional)</label>
                <div className="w-full">
                    <label
                        className={clsx(
                            "flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer transition-colors group",
                            isDragging ? "bg-white/10 border-white/30" : "hover:bg-white/5"
                        )}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-gray-400 group-hover:text-white transition-colors" />
                            <p className="text-sm text-gray-400 group-hover:text-gray-300">
                                <span className="font-semibold text-white">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG (MAX. 5MB)</p>
                        </div>
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>

                <AnimatePresence>
                    {screenshots.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide"
                        >
                            {screenshots.map((src, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    className="relative group flex-shrink-0"
                                >
                                    <img src={src} alt={`Screenshot ${idx + 1}`} className="h-20 w-20 object-cover rounded-lg border border-white/10" />
                                    <button
                                        type="button"
                                        onClick={() => setScreenshots(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 transform hover:scale-110"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-4 px-6 rounded-xl hover:bg-gray-200 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
                {isSubmitting ? (
                    <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        Submit
                    </>
                )}
            </button>
        </motion.form>
    );
}

import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Star, Send, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function Testimonials({ testimonial, auth }) {
    const [rating, setRating] = useState(testimonial?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [message, setMessage] = useState(testimonial?.message || '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return alert('Pilih rating terlebih dahulu.');
        setSubmitting(true);
        try {
            if (testimonial) {
                await axios.put(`/testimonials/${testimonial.id}`, { rating, message });
            } else {
                await axios.post('/testimonials', { rating, message });
            }
            router.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Terjadi kesalahan.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Testimoni Saya" />
            <div className="max-w-lg mx-auto pt-12">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider">
                        <ArrowLeft className="h-3.5 w-3.5" /> Beranda
                    </Link>
                    <span className="text-bronze-muted/40">|</span>
                    <Link href="/my-tickets" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold-light transition-all font-semibold uppercase tracking-wider">
                        Tiket Saya
                    </Link>
                </div>

                <div className="premium-card p-8 border border-bronze-muted/20">
                    <h1 className="text-2xl font-extrabold text-white mb-2">Testimoni</h1>
                    <p className="text-xs text-text-muted mb-8">
                        {testimonial ? 'Edit testimoni Anda di bawah ini.' : 'Bagikan pengalaman Anda menonton LOMBA BARIS GARDA 55.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 transition-all"
                                    >
                                        <Star
                                            className={`h-8 w-8 ${
                                                (hoverRating || rating) >= star
                                                    ? 'fill-gold-primary text-gold-primary'
                                                    : 'text-bronze-muted/40'
                                            } transition-all`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Pesan</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                required
                                className="block w-full px-4 py-3 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-sm resize-none"
                                placeholder="Tulis pengalaman Anda..."
                            />
                            <p className="text-[9px] text-text-muted mt-1 text-right">{message.length}/2000</p>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black font-bold rounded text-xs uppercase tracking-wider transition-all hover:brightness-110 flex items-center justify-center gap-2"
                        >
                            <Send className="h-4 w-4" />
                            <span>{submitting ? 'Mengirim...' : testimonial ? 'Perbarui Testimoni' : 'Kirim Testimoni'}</span>
                        </button>
                    </form>

                    {testimonial && (
                        <p className="text-[10px] text-text-muted mt-6 text-center border-t border-bronze-muted/10 pt-4">
                            Status: <span className={`font-semibold ${testimonial.status === 'enabled' ? 'text-emerald-400' : testimonial.status === 'disabled' ? 'text-red-400' : 'text-amber-400'}`}>
                                {testimonial.status === 'enabled' ? 'Ditampilkan' : testimonial.status === 'disabled' ? 'Ditolak' : 'Menunggu Persetujuan'}
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
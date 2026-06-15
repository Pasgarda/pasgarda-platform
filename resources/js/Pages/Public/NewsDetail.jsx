import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react';
import Footer from '../../Components/Footer';

export default function NewsDetail({ article, activeEvent, auth }) {
    const catColor = article.category === 'Announcement' ? 'bg-accent-mahogany/20 text-accent-mahogany border-accent-mahogany/30' :
        article.category === 'Competition' ? 'bg-gold-primary/20 text-gold-light border-gold-primary/30' :
        'bg-accent-maroon/20 text-white/90 border-accent-maroon/30';

    return (
        <>
            <Head title={article.title} />

            <div className="min-h-screen bg-deep-black">
                {/* Nav */}
                <nav className="sticky top-0 z-50 backdrop-blur-xl bg-deep-black/80 border-b border-bronze-muted/10">
                    <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm font-medium">Kembali</span>
                        </Link>
                        <Link href="/" className="flex items-center gap-2">
                            <Newspaper className="h-4 w-4 text-gold-primary" />
                            <span className="text-xs font-semibold text-white/60">PASGARDA</span>
                        </Link>
                    </div>
                </nav>

                {/* Article */}
                <article className="max-w-3xl mx-auto px-4 py-12">
                    {/* Header */}
                    <div className="mb-8">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 ${catColor}`}>
                            {article.category}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                            {article.title}
                        </h1>
                        <div className="flex items-center gap-2 text-text-muted text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>{article.date}</span>
                        </div>
                    </div>

                    {/* Cover Image */}
                    {article.image_url && (
                        <div className="mb-10 rounded-xl overflow-hidden border border-bronze-muted/10">
                            <img src={article.image_url} alt={article.title} className="w-full" />
                        </div>
                    )}

                    {/* Summary */}
                    {article.summary && (
                        <p className="text-lg text-text-primary/80 leading-relaxed mb-8 italic border-l-4 border-gold-primary/40 pl-4">
                            {article.summary}
                        </p>
                    )}

                    {/* Content */}
                    <div className="prose prose-invert prose-gold max-w-none text-text-primary/80 leading-relaxed whitespace-pre-wrap">
                        {article.content}
                    </div>
                </article>

                <Footer activeEvent={activeEvent} />
            </div>
        </>
    );
}

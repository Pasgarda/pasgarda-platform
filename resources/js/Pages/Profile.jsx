import React, { useState, useRef, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { User, Upload, ArrowLeft, Save, Lock, X, Check, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export default function Profile({ user }) {
    const [name, setName] = useState(user.name);
    const [updating, setUpdating] = useState(false);

    // Password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Avatar crop
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [showCrop, setShowCrop] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const imageRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageDimensions, setImageDimensions] = useState({
        naturalWidth: 0,
        naturalHeight: 0,
        width: 0,
        height: 0,
        baseX: 0,
        baseY: 0,
        baseScale: 1
    });

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await axios.put('/profile/update', { name });
            router.reload();
        } catch (err) {
            alert(err.response?.data?.errors?.name?.[0] || 'Gagal menyimpan.');
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== newPasswordConfirmation) {
            return alert('Konfirmasi password baru tidak cocok.');
        }
        setChangingPassword(true);
        try {
            await axios.post('/profile/password', {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: newPasswordConfirmation,
            }, {
                headers: { 'Accept': 'application/json' },
            });
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordConfirmation('');
            alert('Password berhasil diubah!');
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.errors?.current_password?.[0] || err.response?.data?.message || err.message || 'Gagal mengubah password.';
            alert(`[${status || '?'}] ${msg}`);
        } finally {
            setChangingPassword(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setAvatarPreview(reader.result);
            setShowCrop(true);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        };
        reader.readAsDataURL(file);
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setOffset({ x: dx, y: dy });
    }, [isDragging, dragStart]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleImageLoad = (e) => {
        const img = e.target;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const baseScale = Math.max(220 / w, 220 / h);
        const baseWidth = w * baseScale;
        const baseHeight = h * baseScale;
        const baseX = (300 - baseWidth) / 2;
        const baseY = (300 - baseHeight) / 2;
        setImageDimensions({
            naturalWidth: w,
            naturalHeight: h,
            width: baseWidth,
            height: baseHeight,
            baseX,
            baseY,
            baseScale
        });
    };

    const confirmCrop = async () => {
        if (!imageRef.current || !avatarFile || !imageDimensions.width) return;

        const canvas = document.createElement('canvas');
        const img = imageRef.current;

        const zoomScale = zoom;
        const dispWidth = imageDimensions.width;
        const dispHeight = imageDimensions.height;
        const baseX = imageDimensions.baseX;
        const baseY = imageDimensions.baseY;

        // Image coordinates with offset and zoom
        const imgLeft = baseX + offset.x - (dispWidth * (zoomScale - 1)) / 2;
        const imgTop = baseY + offset.y - (dispHeight * (zoomScale - 1)) / 2;
        const imgWidthZoom = dispWidth * zoomScale;
        const imgHeightZoom = dispHeight * zoomScale;

        // Crop box top-left relative to image (centered 220px box in a 300px container: top/left are 40px)
        const dx = 40 - imgLeft;
        const dy = 40 - imgTop;

        // Map display coordinates back to natural image scale
        const currentScaleX = imgWidthZoom / imageDimensions.naturalWidth;
        const currentScaleY = imgHeightZoom / imageDimensions.naturalHeight;

        const sx = dx / currentScaleX;
        const sy = dy / currentScaleY;
        const sw = 220 / currentScaleX;
        const sh = 220 / currentScaleY;

        canvas.width = 220;
        canvas.height = 220;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 220, 220);

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append('avatar', blob, avatarFile.name);
            setUploading(true);
            try {
                await axios.post('/profile/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setShowCrop(false);
                setAvatarPreview(null);
                setAvatarFile(null);
                router.reload();
            } catch (err) {
                alert('Gagal mengunggah foto.');
            } finally {
                setUploading(false);
            }
        }, 'image/jpeg', 0.9);
    };

    React.useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove]);

    return (
        <div className="min-h-screen bg-[#0D0C0A] text-[#F2EDD6] p-6 font-sans">
            <Head title="Profil Saya" />
            <div className="max-w-lg mx-auto pt-12 space-y-6">
                <a href="/" className="inline-flex items-center gap-1.5 text-xs text-bronze-muted hover:text-gold-light transition-all">
                    <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Beranda
                </a>

                {/* Avatar */}
                <div className="premium-card p-8 border border-bronze-muted/20 text-center">
                    <div className="relative inline-block mb-4">
                        {user.avatar ? (
                            <img
                                src={`/storage/${user.avatar}`}
                                alt={user.name}
                                className="h-24 w-24 rounded-full object-cover border-2 border-gold-primary/30"
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-accent-maroon/30 border-2 border-bronze-muted/30 flex items-center justify-center mx-auto">
                                <User className="h-10 w-10 text-bronze-muted" />
                            </div>
                        )}
                        <label className="absolute bottom-0 right-0 p-1.5 bg-gold-primary rounded-full cursor-pointer hover:brightness-110 transition-all border-2 border-deep-black">
                            <Upload className="h-3.5 w-3.5 text-deep-black" />
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                        </label>
                    </div>
                    <h1 className="text-xl font-extrabold text-white">{user.name}</h1>
                    <p className="text-xs text-text-muted">{user.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-maroon/20 text-gold-light border border-gold-primary/20">
                        {user.role.replace('_', ' ')}
                    </span>
                </div>

                {/* Edit Data Diri */}
                <div className="premium-card p-6 border border-bronze-muted/20">
                    <h2 className="text-sm font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3 flex items-center gap-1.5">
                        <Save className="h-4 w-4 text-gold-primary" /> Edit Data Diri
                    </h2>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Nama Lengkap</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="block w-full px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Email</label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="block w-full px-3 py-2 bg-deep-black/30 border border-bronze-muted/20 rounded text-text-muted text-sm cursor-not-allowed"
                            />
                            <p className="text-[9px] text-text-muted mt-1">Email tidak dapat diubah.</p>
                        </div>
                        <button
                            type="submit"
                            disabled={updating}
                            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded text-xs border border-white/10 uppercase tracking-wider transition-all"
                        >
                            {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </div>

                {/* Ubah Password */}
                <div className="premium-card p-6 border border-bronze-muted/20">
                    <h2 className="text-sm font-bold text-white mb-4 border-b border-bronze-muted/10 pb-3 flex items-center gap-1.5">
                        <Lock className="h-4 w-4 text-gold-primary" /> Ubah Password
                    </h2>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Password Saat Ini</label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="block w-full pr-10 px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-sm"
                                />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-white transition-colors">
                                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Password Baru</label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="block w-full pr-10 px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-sm"
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-white transition-colors">
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Konfirmasi Password Baru</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={newPasswordConfirmation}
                                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                    required
                                    minLength={8}
                                    className="block w-full pr-10 px-3 py-2 bg-deep-black/60 border border-bronze-muted/40 rounded text-text-primary focus:outline-none focus:border-gold-primary text-sm"
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-white transition-colors">
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded text-xs border border-white/10 uppercase tracking-wider transition-all"
                        >
                            {changingPassword ? 'Mengubah...' : 'Ubah Password'}
                        </button>
                    </form>
                </div>

                {uploading && (
                    <p className="text-xs text-gold-light text-center">Mengunggah foto...</p>
                )}
            </div>

            {/* Crop Modal */}
            {showCrop && avatarPreview && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="premium-card p-6 border border-bronze-muted/20 max-w-md w-full">
                        <h3 className="text-sm font-bold text-white mb-4">Sesuaikan Foto</h3>
                        <div
                            className="relative mx-auto w-[300px] h-[300px] overflow-hidden rounded-lg border-2 border-gold-primary/30 bg-deep-black"
                            onMouseDown={handleMouseDown}
                        >
                            <img
                                ref={imageRef}
                                src={avatarPreview}
                                alt="Crop preview"
                                onLoad={handleImageLoad}
                                className="absolute cursor-move select-none"
                                draggable={false}
                                style={{
                                    left: imageDimensions.baseX + offset.x,
                                    top: imageDimensions.baseY + offset.y,
                                    width: imageDimensions.width,
                                    height: imageDimensions.height,
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'center',
                                }}
                            />
                            {/* Circular Mask Overlay */}
                            <div className="absolute top-10 left-10 w-[220px] h-[220px] rounded-full border-2 border-gold-primary pointer-events-none shadow-[0_0_0_999px_rgba(13,12,10,0.65)]"></div>
                        </div>
                        <p className="text-[10px] text-text-muted text-center mt-2">Seret untuk menggeser posisi foto</p>
                        
                        {/* Zoom Slider */}
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-[10px] text-text-muted font-bold uppercase tracking-wider">
                                <span>Perbesar / Perkecil</span>
                                <span>{Math.round(zoom * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.05"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full h-1 bg-bronze-muted/30 rounded-lg appearance-none cursor-pointer accent-gold-primary"
                            />
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => { setShowCrop(false); setAvatarPreview(null); setAvatarFile(null); }}
                                className="flex-1 py-2 border border-bronze-muted/30 text-bronze-muted rounded text-xs font-bold hover:text-white transition-all flex items-center justify-center gap-1.5"
                            >
                                <X className="h-3.5 w-3.5" /> Batal
                            </button>
                            <button
                                onClick={confirmCrop}
                                className="flex-1 py-2 bg-gradient-to-r from-gold-primary to-gold-bright text-deep-black rounded text-xs font-bold transition-all hover:brightness-110 flex items-center justify-center gap-1.5"
                            >
                                <Check className="h-3.5 w-3.5" /> Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
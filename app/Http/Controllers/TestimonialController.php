<?php

namespace App\Http\Controllers;

use App\Models\Testimonial;
use App\Models\IssuedTicket;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function myTestimonial(Request $request)
    {
        return redirect('/my-tickets');
    }

    public function store(Request $request)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'message' => 'required|string|max:2000',
        ]);

        $user = $request->user();

        if (Testimonial::where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Anda sudah mengirim testimoni. Anda bisa mengeditnya.'], 422);
        }

        $hasTicket = IssuedTicket::whereHas('order', function ($q) use ($user) {
            $q->where('user_id', $user->id)->where('payment_status', 'paid');
        })->exists();

        if (!$hasTicket) {
            return response()->json(['message' => 'Hanya pengguna yang sudah membeli tiket yang dapat memberikan testimoni.'], 422);
        }

        Testimonial::create([
            'user_id' => $user->id,
            'rating' => $request->rating,
            'message' => $request->message,
            'status' => 'pending',
        ]);

        return response()->json(['success' => true, 'message' => 'Testimoni berhasil dikirim! Menunggu persetujuan admin.']);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'message' => 'required|string|max:2000',
        ]);

        $testimonial = Testimonial::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        $testimonial->update([
            'rating' => $request->rating,
            'message' => $request->message,
            'status' => 'pending',
        ]);

        return response()->json(['success' => true, 'message' => 'Testimoni berhasil diperbarui! Menunggu persetujuan ulang admin.']);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\RolePermission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleConfigController extends Controller
{
    public function index($slug)
    {
        $event = Event::where("slug", $slug)->firstOrFail();
        RolePermission::ensureModulesExist($event->id);

        $modules = [
            "scoring_input" => "Input Penilaian Juri",
            "tickets" => "Kelola Tiket",
            "all_tickets" => "Data Semua Tiket",
            "merchandise" => "Logger Penjualan Merch",
            "social_media" => "Kelola Likes Sosmed",
            "broadcast" => "Kirim Broadcast Email",
            "export" => "Platform Control Room (Export)",
            "users" => "Manajemen User & Role",
            "content" => "Kelola Konten Acara",
            "contingents" => "Kelola Daftar Sekolah",
            "event_settings" => "Konfigurasi Acara",
            "dashboard_stats" => "Ringkasan Statistik",
            "recap" => "Rekapan Data Acara",
            "control_room" => "Platform Control Room",
        ];

        $roles = ["super_admin", "admin", "operator_gate", "operator_nilai", "operator_produk", "coach", "spectator"];

        $roleLabels = [
            "super_admin" => "Super Admin",
            "admin" => "Admin",
            "operator_gate" => "Operator Gate",
            "operator_nilai" => "Operator Nilai",
            "operator_produk" => "Operator Produk",
            "coach" => "Pelatih",
            "spectator" => "Pengunjung",
        ];

        $permissions = RolePermission::getModulePermissions($event->id);

        return Inertia::render("Admin/RoleConfig", [
            "event" => $event,
            "modules" => $modules,
            "roles" => $roles,
            "roleLabels" => $roleLabels,
            "permissions" => $permissions,
        ]);
    }

    public function update(Request $request, $slug)
    {
        $event = Event::where("slug", $slug)->firstOrFail();

        $data = $request->validate([
            "permissions" => "required|array",
            "permissions.*.*" => "boolean",
        ]);

        foreach ($data["permissions"] as $module => $roles) {
            foreach ($roles as $role => $canAccess) {
                RolePermission::updateOrCreate(
                    ["event_id" => $event->id, "role" => $role, "module" => $module],
                    ["can_access" => $canAccess]
                );
            }
        }

        return redirect()->back()->with("status", "Konfigurasi role berhasil diperbarui!");
    }
}


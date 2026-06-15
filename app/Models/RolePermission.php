<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    protected $fillable = ["event_id", "role", "module", "can_access"];

    protected function casts(): array
    {
        return [
            "can_access" => "boolean",
        ];
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public static function getModulePermissions(int $eventId): array
    {
        $perms = static::where("event_id", $eventId)->get();
        $result = [];
        foreach ($perms as $p) {
            $result[$p->module][$p->role] = $p->can_access;
        }
        return $result;
    }

    public static function getRolePermissions(int $eventId): array
    {
        $perms = static::where("event_id", $eventId)->get();
        $result = [];
        foreach ($perms as $p) {
            $result[$p->role][$p->module] = $p->can_access;
        }
        return $result;
    }

    public static function seedDefaults(int $eventId): void
    {
        $modules = [
            "scoring_input" => ["super_admin", "admin", "operator_nilai"],
            "tickets" => ["super_admin", "admin", "operator_gate"],
            "all_tickets" => ["super_admin", "admin", "operator_gate"],
            "merchandise" => ["super_admin", "admin", "operator_produk"],
            "social_media" => ["super_admin", "admin"],
            "broadcast" => ["super_admin", "admin"],
            "export" => ["super_admin", "admin"],
            "users" => ["super_admin"],
            "content" => ["super_admin", "admin"],
            "contingents" => ["super_admin"],
            "event_settings" => ["super_admin", "admin"],
            "dashboard_stats" => ["super_admin", "admin", "operator_gate", "operator_nilai"],
            "recap" => ["super_admin"],
            "score_tokens" => ["super_admin", "admin", "operator_nilai"],
            "control_room" => ["super_admin"],
        ];

        $roles = ["super_admin", "admin", "operator_gate", "operator_nilai", "operator_produk", "coach", "spectator"];

        foreach ($modules as $module => $allowedRoles) {
            foreach ($roles as $role) {
                static::create([
                    "event_id" => $eventId,
                    "role" => $role,
                    "module" => $module,
                    "can_access" => in_array($role, $allowedRoles),
                ]);
            }
        }
    }

    public static function canAccess(int $eventId, string $role, string $module): bool
    {
        return static::where("event_id", $eventId)
            ->where("role", $role)
            ->where("module", $module)
            ->value("can_access") ?? false;
    }

    public static function ensureModulesExist(int $eventId): void
    {
        // Clean up obsolete modules if present in database
        static::whereIn('module', ['news', 'hall_of_fame', 'schedule', 'testimonials'])->delete();

        $modules = [
            "scoring_input" => ["super_admin", "admin", "operator_nilai"],
            "tickets" => ["super_admin", "admin", "operator_gate"],
            "all_tickets" => ["super_admin", "admin", "operator_gate"],
            "merchandise" => ["super_admin", "admin", "operator_produk"],
            "social_media" => ["super_admin", "admin"],
            "broadcast" => ["super_admin", "admin"],
            "export" => ["super_admin", "admin"],
            "users" => ["super_admin"],
            "content" => ["super_admin", "admin"],
            "contingents" => ["super_admin"],
            "event_settings" => ["super_admin", "admin"],
            "dashboard_stats" => ["super_admin", "admin", "operator_gate", "operator_nilai"],
            "recap" => ["super_admin"],
            "score_tokens" => ["super_admin", "admin", "operator_nilai"],
            "control_room" => ["super_admin"],
        ];

        $roles = ["super_admin", "admin", "operator_gate", "operator_nilai", "operator_produk", "coach", "spectator"];

        foreach ($modules as $module => $allowedRoles) {
            foreach ($roles as $role) {
                static::firstOrCreate(
                    ["event_id" => $eventId, "role" => $role, "module" => $module],
                    ["can_access" => in_array($role, $allowedRoles)]
                );
            }
        }
    }
}


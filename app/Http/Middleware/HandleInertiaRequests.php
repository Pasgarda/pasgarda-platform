<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
                'last_issued_ticket' => fn () => $request->session()->get('last_issued_ticket'),
                'last_issued_tickets' => fn () => $request->session()->get('last_issued_tickets'),
            ],
            'visitorCount' => fn () => \Illuminate\Support\Facades\Cache::remember('global_visitor_count', 60, fn () => \App\Models\VisitorCount::sum('count') ?: 0),
            'activeEvent' => function () {
                $event = \App\Models\Event::where('status', 'active')->first();
                if (!$event) {
                    return null;
                }
                return [
                    'slug' => $event->slug,
                    'name' => $event->name,
                    'date_start' => $event->date_start->format('d M Y'),
                    'date_end' => $event->date_end?->format('d M Y'),
                    'date_range' => $event->date_start->day . '-' . $event->date_end->day . ' ' . $event->date_start->locale('id')->isoFormat('MMMM Y'),
                    'venue' => $event->venue,
                ];
            },
            'sponsors' => function () {
                return \Illuminate\Support\Facades\Cache::remember('global_sponsors', 3600, function () {
                    $event = \App\Models\Event::where('slug', 'lpbb-vol20')->first();
                    if (!$event) {
                        $event = \App\Models\Event::first();
                    }
                    if ($event) {
                        $content = \App\Models\EventContent::where('event_id', $event->id)
                            ->where('key', 'sponsors')
                            ->first();
                        return $content ? ($content->value ?? []) : [];
                    }
                    return [];
                });
            },
        ];
    }
}

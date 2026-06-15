<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        // Create an active event so that the PublicController does not fail on null
        \App\Models\Event::create([
            'slug' => 'lpbb-vol20',
            'name' => 'GARDA 55 VOL 20',
            'date_start' => '2026-06-20',
            'date_end' => '2026-06-21',
            'venue' => 'Gelora',
            'status' => 'active',
        ]);

        $response = $this->get('/');

        $response->assertStatus(200);
    }
}

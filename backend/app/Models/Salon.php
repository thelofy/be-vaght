<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Salon extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'phone',
        'address',
        'opening_time',
        'closing_time',
        'slot_interval_minutes',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'slot_interval_minutes' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Staff/owners belonging to this salon.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Services offered by this salon.
     */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    /**
     * Registered customer database for this salon.
     */
    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    /**
     * All appointments booked for this salon.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'salon_id',
        'title',
        'duration_minutes',
        'price',
        'show_price',
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
            'duration_minutes' => 'integer',
            'price' => 'integer',
            'show_price' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Salon offering this service.
     */
    public function salon(): BelongsTo
    {
        return $this->belongsTo(Salon::class);
    }

    /**
     * Appointments booked for this service.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}

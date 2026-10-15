<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Salon;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $slug = $this->route('slug');
        $salon = Salon::where('slug', $slug)->first();
        $salonId = $salon?->id;

        return [
            'service_id' => [
                'required',
                'integer',
                Rule::exists('services', 'id')->where(function ($query) use ($salonId) {
                    $query->where('salon_id', $salonId)->where('is_active', true);
                }),
            ],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'customer_name' => ['required', 'string', 'min:2', 'max:100'],
            'customer_phone' => ['required', 'string', 'regex:/^(09|\+989|9)\d{9}$/'],
            'customer_birth_date' => ['nullable', 'date_format:Y-m-d', 'before:today'],
            'notes' => ['nullable', 'string', 'max:500'],
            'user_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(function ($query) use ($salonId) {
                    $query->where('salon_id', $salonId);
                }),
            ],
        ];
    }

    /**
     * Handle a failed validation attempt with project standard JSON envelope.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'data' => $validator->errors(),
                'message' => 'The given data was invalid.',
            ], 422)
        );
    }
}

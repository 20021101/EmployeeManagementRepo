<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email,' . $this->route('id'),
            'phone' => 'required|string|max:20',
            'designation_id' => 'nullable|exists:designations,id',
            'joining_date' => 'nullable|date',
            'relieving_date' => 'nullable|date|after_or_equal:joining_date',
            'role' => 'required|in:admin,hr,employee',
        ];
    }

    public function messages()
    {
        return [
            'email.unique' => 'This email is already in use.',
            'designation_id.exists' => 'The selected designation is invalid.',
            'relieving_date.after_or_equal' => 'Relieving date must be after or equal to joining date.',
        ];
    }
}

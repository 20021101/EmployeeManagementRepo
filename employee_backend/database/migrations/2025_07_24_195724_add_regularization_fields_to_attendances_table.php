<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->boolean('is_regularized')->default(false);
            $table->string('regularize_status')->default('pending');
            $table->text('regularize_reason')->nullable();
            $table->time('requested_check_in')->nullable();
            $table->time('requested_check_out')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            // Optional: foreign key if approved_by is a user_id
            // $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn([
                'is_regularized',
                'regularize_status',
                'regularize_reason',
                'requested_check_in',
                'requested_check_out',
                'approved_by',
                'approved_at'
            ]);
        });
    }
};

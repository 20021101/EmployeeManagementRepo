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
        Schema::create('salaries', function (Blueprint $table) {
        $table->id();
        $table->foreignId('employee_id')->constrained()->onDelete('cascade');
        $table->integer('month'); // e.g. 1-12
        $table->integer('year'); // e.g. 2025
        $table->decimal('base_salary', 10, 2);
        $table->integer('total_leaves')->default(0);
        $table->integer('paid_leaves')->default(0);
        $table->decimal('deduction', 10, 2)->default(0);
        $table->decimal('net_salary', 10, 2);
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('salaries');
    }
};

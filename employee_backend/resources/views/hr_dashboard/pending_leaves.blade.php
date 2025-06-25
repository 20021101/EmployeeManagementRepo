@extends('layouts.app')

@section('content')
<div class="container">
    <h2>Hello {{ $manager->name ?? 'Manager' }}</h2>
    <p>Below are all pending leave requests:</p>

    @if ($pendingLeaves->isEmpty())
        <p>No pending leave requests.</p>
    @else
        @foreach ($pendingLeaves as $leave)
            <div class="card p-3 my-2">
                <p><strong>Employee:</strong> {{ $leave->employee->name }}</p>
                <p><strong>From:</strong> {{ $leave->start_date }} to {{ $leave->end_date }}</p>
                <p><strong>Reason:</strong> {{ $leave->reason }}</p>

                <form method="POST" action="{{ url('/leave/' . $leave->id . '/approve') }}" style="display:inline-block;">
                    @csrf
                    <button class="btn btn-success btn-sm">Approve</button>
                </form>

                <form method="POST" action="{{ url('/leave/' . $leave->id . '/reject') }}" style="display:inline-block;">
                    @csrf
                    <button class="btn btn-danger btn-sm">Reject</button>
                </form>
            </div>
        @endforeach
    @endif
</div>
@endsection

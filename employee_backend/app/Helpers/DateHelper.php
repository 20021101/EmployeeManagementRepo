<?php

namespace App\Helpers;

class DateHelper
{
    public static function isWorkingDay($dateStr)
    {
        $date = new \DateTime($dateStr);
        $dayOfWeek = $date->format('w'); // 0 = Sunday, 6 = Saturday

        if ($dayOfWeek == 0) return false; // Sunday = Holiday
        if ($dayOfWeek >= 1 && $dayOfWeek <= 5) return true; // Mon-Fri = Working

        // Check Saturday
        $dayOfMonth = $date->format('j');
        $month = $date->format('n');
        $year = $date->format('Y');

        $saturdays = [];
        for ($i = 1; $i <= 31; $i++) {
            $d = \DateTime::createFromFormat('Y-n-j', "$year-$month-$i");
            if ($d && $d->format('w') == 6) {
                $saturdays[] = $i;
            }
        }

        // 1st and 3rd Saturday are working
        return in_array((int)$dayOfMonth, [$saturdays[0] ?? -1, $saturdays[2] ?? -1]);
    }
}

# Assignment feature verification script
$Base = "http://127.0.0.1:8000"
$Results = @()

function Test-Step($Name, $ScriptBlock) {
    try {
        $out = & $ScriptBlock
        $script:Results += [pscustomobject]@{ Feature = $Name; Status = "PASS"; Detail = ($out | Out-String).Trim() }
        Write-Host "[PASS] $Name" -ForegroundColor Green
    } catch {
        $script:Results += [pscustomobject]@{ Feature = $Name; Status = "FAIL"; Detail = $_.Exception.Message }
        Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Zoom Clone Assignment Verification ===`n"

Test-Step "Backend health" {
    $h = Invoke-RestMethod "$Base/health"
    if ($h.status -ne "healthy") { throw "Unhealthy" }
    "database=$($h.database)"
}

Test-Step "1. Dashboard - upcoming meetings API" {
    $u = Invoke-RestMethod "$Base/api/meetings/upcoming"
    if ($u -isnot [array]) { throw "Expected array" }
    "count=$($u.Count)"
}

Test-Step "1. Dashboard - recent meetings API" {
    $r = Invoke-RestMethod "$Base/api/meetings/recent"
    if ($r -isnot [array]) { throw "Expected array" }
    "count=$($r.Count)"
}

Test-Step "2. Instant meeting - create with ID and invite link" {
    $m = Invoke-RestMethod "$Base/api/meetings/instant" -Method POST -ContentType "application/json" -Body '{"host_name":"Test User","host_video":true,"participant_video":true}'
    if (-not $m.meeting_id -or $m.meeting_id.Length -lt 10) { throw "No meeting_id" }
    if (-not $m.meeting_uuid) { throw "No meeting_uuid" }
    if (-not $m.invite_link) { throw "No invite_link" }
    $script:InstantUuid = $m.meeting_uuid
    $script:InstantId = $m.meeting_id
    "uuid=$($m.meeting_uuid) id=$($m.meeting_id) link=$($m.invite_link)"
}

Test-Step "3. Join - validate existing meeting ID" {
    $v = Invoke-RestMethod "$Base/api/meetings/$($script:InstantId)/validate"
    if (-not $v.valid) { throw "Should be valid" }
    "valid=$($v.valid)"
}

Test-Step "3. Join - reject invalid meeting ID" {
    $v = Invoke-RestMethod "$Base/api/meetings/0000000000/validate"
    if ($v.valid) { throw "Should be invalid" }
    "valid=$($v.valid)"
}

Test-Step "4. Schedule meeting - create and store" {
    $start = (Get-Date).AddDays(2).ToString("yyyy-MM-ddTHH:mm:ss")
    $body = @{
        title = "Assignment Test Meeting"
        description = "Scheduled via test script"
        host_name = "John Doe"
        start_time = $start
        duration_minutes = 45
        passcode = "TEST123"
        waiting_room_enabled = $true
        host_video = $true
        participant_video = $false
        meeting_type = "scheduled"
        is_recurring = $false
    } | ConvertTo-Json
    $m = Invoke-RestMethod "$Base/api/meetings/schedule" -Method POST -ContentType "application/json" -Body $body
    if ($m.status -notin @("upcoming","scheduled")) { throw "Bad status $($m.status)" }
    $script:ScheduledUuid = $m.meeting_uuid
    "uuid=$($m.meeting_uuid) title=$($m.title)"
}

Test-Step "4. Schedule - appears in upcoming list" {
    $u = Invoke-RestMethod "$Base/api/meetings/upcoming"
    $found = $u | Where-Object { $_.meeting_uuid -eq $script:ScheduledUuid }
    if (-not $found) { throw "Scheduled meeting not in upcoming" }
    "found in upcoming"
}

Test-Step "4. Schedule - update meeting" {
    $patch = @{ title = "Updated Assignment Meeting" } | ConvertTo-Json
    $m = Invoke-RestMethod "$Base/api/meetings/$($script:ScheduledUuid)" -Method PATCH -ContentType "application/json" -Body $patch
    if ($m.title -ne "Updated Assignment Meeting") { throw "Title not updated" }
    "title=$($m.title)"
}

Test-Step "Meeting room - add participant" {
    $p = Invoke-RestMethod "$Base/api/meetings/$($script:InstantUuid)/participants" -Method POST -ContentType "application/json" -Body '{"name":"Guest One","role":"participant","video_on":true}'
    $script:GuestId = $p.id
    "participant_id=$($p.id)"
}

Test-Step "Meeting room - list participants" {
    $list = Invoke-RestMethod "$Base/api/meetings/$($script:InstantUuid)/participants"
    if ($list.Count -lt 1) { throw "No participants" }
    "count=$($list.Count)"
}

Test-Step "Bonus - host mute participant" {
    $p = Invoke-RestMethod "$Base/api/meetings/$($script:InstantUuid)/participants/$($script:GuestId)/mute" -Method PATCH -ContentType "application/json" -Body '{"is_muted":true}'
    if (-not $p.is_muted) { throw "Not muted" }
    "muted=$($p.is_muted)"
}

Test-Step "Bonus - mute all participants" {
    $r = Invoke-RestMethod "$Base/api/meetings/$($script:InstantUuid)/participants/mute-all" -Method PATCH
    "muted_count=$($r.count)"
}

Test-Step "Bonus - remove participant" {
    Invoke-RestMethod "$Base/api/meetings/$($script:InstantUuid)/participants/$($script:GuestId)" -Method DELETE | Out-Null
    "removed"
}

Test-Step "Meeting room - chat messages persist" {
    $msg = Invoke-RestMethod "$Base/api/meetings/$($script:InstantUuid)/messages" -Method POST -ContentType "application/json" -Body '{"sender":"Test User","text":"Hello from QA"}'
    $list = Invoke-RestMethod "$Base/api/meetings/$($script:InstantUuid)/messages"
    if ($list.Count -lt 1) { throw "No messages stored" }
    "messages=$($list.Count)"
}

Test-Step "End meeting" {
    $m = Invoke-RestMethod "$Base/api/meetings/$($script:InstantUuid)/end" -Method POST
    if ($m.status -ne "ended") { throw "Status not ended" }
    "status=$($m.status)"
}

Test-Step "Join - ended meeting invalid" {
    $v = Invoke-RestMethod "$Base/api/meetings/$($script:InstantId)/validate"
    if ($v.valid) { throw "Ended meeting should be invalid" }
    "valid=$($v.valid)"
}

Test-Step "Delete scheduled meeting" {
    Invoke-RestMethod "$Base/api/meetings/$($script:ScheduledUuid)" -Method DELETE | Out-Null
    try {
        Invoke-RestMethod "$Base/api/meetings/$($script:ScheduledUuid)" -ErrorAction Stop | Out-Null
        throw "Meeting still exists"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 404) { throw $_ }
    }
    "deleted"
}

Write-Host "`n=== Summary ===`n"
$Results | Format-Table -AutoSize
$fail = ($Results | Where-Object Status -eq "FAIL").Count
Write-Host "Passed: $($Results.Count - $fail) / $($Results.Count)  Failed: $fail"

param()

$options = @(
    @{ Name = "Production"; Service = "web"; Command = "docker compose up web" },
    @{ Name = "Development"; Service = "dev"; Command = "docker compose up dev" }
)

$selectedIndex = 0
$confirmed = $false

function Show-Menu {
    param(
        [int]$CurrentIndex
    )

    Clear-Host
    Write-Host "Choose which Docker service to start (use Up/Down arrows, Enter to confirm):"
    Write-Host ""

    for ($i = 0; $i -lt $options.Count; $i++) {
        $prefix = if ($i -eq $CurrentIndex) { ">" } else { " " }
        Write-Host ("{0} {1}: {2}" -f $prefix, $options[$i].Name, $options[$i].Command)
    }
}

while (-not $confirmed) {
    Show-Menu -CurrentIndex $selectedIndex
    $key = [System.Console]::ReadKey($true)

    switch ($key.Key) {
        "UpArrow" {
            $selectedIndex = ($selectedIndex - 1 + $options.Count) % $options.Count
        }
        "DownArrow" {
            $selectedIndex = ($selectedIndex + 1) % $options.Count
        }
        "Enter" {
            $confirmed = $true
        }
    }
}

$selected = $options[$selectedIndex]
Write-Host ""
Write-Host ("Starting {0} ({1})..." -f $selected.Name, $selected.Command)

# Run from the script directory to ensure docker-compose.yml is found.
Set-Location -Path $PSScriptRoot
docker compose up $selected.Service

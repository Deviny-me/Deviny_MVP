Write-Host "=== Fix IgniteDB ===" -ForegroundColor Yellow

# 1. Stop SQL Server Express so files are unlocked
Write-Host "Stopping SQL Server Express..." -ForegroundColor Cyan
Stop-Service -Name "MSSQL`$SQLEXPRESS" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "Stopped." -ForegroundColor Green

# 2. Delete ALL old IgniteDB MDF/LDF files
Write-Host "Deleting old database files..." -ForegroundColor Cyan
$dataPath = "C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA"
Get-ChildItem "$dataPath\IgniteDB*" -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "Files deleted." -ForegroundColor Green

# 3. Start SQL Server Express
Write-Host "Starting SQL Server Express..." -ForegroundColor Cyan
Start-Service -Name "MSSQL`$SQLEXPRESS"
Start-Sleep -Seconds 5
Write-Host "Started." -ForegroundColor Green

# 4. Verify SQL Server is up
sqlcmd -S "lpc:localhost\SQLEXPRESS" -d master -Q "SELECT 'SQL Server OK' AS Status" -E -t 10 -W

# 5. Drop IgniteDB metadata if exists
Write-Host "Cleaning up IgniteDB metadata..." -ForegroundColor Cyan
sqlcmd -S "lpc:localhost\SQLEXPRESS" -d master -Q "IF EXISTS (SELECT 1 FROM sys.databases WHERE name='IgniteDB') BEGIN ALTER DATABASE [IgniteDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [IgniteDB]; PRINT 'Dropped old IgniteDB'; END ELSE PRINT 'No IgniteDB to drop';" -E -t 30

Write-Host ""
Write-Host "=== Done! Now run 'dotnet run' in backend\src\Ignite.API ===" -ForegroundColor Green
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

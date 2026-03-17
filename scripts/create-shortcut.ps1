param(
  [Parameter(Mandatory = $true)]
  [string]$Url,

  [string]$ShortcutName = "Cuaderno de Oracion",

  [string]$DesktopPath = [Environment]::GetFolderPath("Desktop"),

  [string]$IconPath = ""
)

$shortcutFile = Join-Path $DesktopPath "$ShortcutName.lnk"
$legacyShortcutFile = Join-Path $DesktopPath "$ShortcutName.url"
$targetPath = Join-Path $env:WINDIR "explorer.exe"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutFile)
$shortcut.TargetPath = $targetPath
$shortcut.Arguments = $Url
$shortcut.WorkingDirectory = $DesktopPath
$shortcut.Description = "Abrir $ShortcutName"

if ($IconPath -and (Test-Path $IconPath)) {
  $shortcut.IconLocation = "$IconPath,0"
}

$shortcut.Save()

if (Test-Path $legacyShortcutFile) {
  Remove-Item $legacyShortcutFile -Force
}

Write-Host "Acceso directo creado en $shortcutFile"

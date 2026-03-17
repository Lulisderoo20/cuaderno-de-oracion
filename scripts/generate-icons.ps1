Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-AppBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $backgroundRect = New-Object System.Drawing.Rectangle 0, 0, $Size, $Size
  $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $backgroundRect,
    [System.Drawing.ColorTranslator]::FromHtml("#f3ddc6"),
    [System.Drawing.ColorTranslator]::FromHtml("#9f6f4c"),
    45
  )
  $graphics.FillEllipse($backgroundBrush, 0, 0, $Size, $Size)

  $glowRect = New-Object System.Drawing.RectangleF ($Size * 0.55), ($Size * 0.08), ($Size * 0.28), ($Size * 0.28)
  $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $glowPath.AddEllipse($glowRect)
  $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
  $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(120, 255, 247, 236)
  $glowBrush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(0, 255, 247, 236))
  $graphics.FillPath($glowBrush, $glowPath)

  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 80, 49, 27))
  $graphics.FillEllipse($shadowBrush, $Size * 0.24, $Size * 0.77, $Size * 0.52, $Size * 0.1)

  $bookX = $Size * 0.26
  $bookY = $Size * 0.18
  $bookWidth = $Size * 0.48
  $bookHeight = $Size * 0.62
  $bookPath = New-RoundedRectPath -X $bookX -Y $bookY -Width $bookWidth -Height $bookHeight -Radius ($Size * 0.05)
  $bookBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#fff6e9"))
  $graphics.FillPath($bookBrush, $bookPath)

  $bookBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(30, 111, 84, 58), [Math]::Max(2, $Size * 0.004))
  $graphics.DrawPath($bookBorder, $bookPath)

  $spineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#e5d1b4"))
  $graphics.FillRectangle($spineBrush, $bookX, $bookY, $Size * 0.09, $bookHeight)

  $bookmarkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#af6d45"))
  $bookmarkPath = New-RoundedRectPath -X ($bookX + $bookWidth - ($Size * 0.09)) -Y ($bookY + $Size * 0.05) -Width ($Size * 0.05) -Height ($Size * 0.18) -Radius ($Size * 0.015)
  $graphics.FillPath($bookmarkBrush, $bookmarkPath)

  $heartBodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#9d633e"))
  $heartPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $heartPath.AddBezier(
    $Size * 0.5, $Size * 0.63,
    $Size * 0.71, $Size * 0.47,
    $Size * 0.64, $Size * 0.32,
    $Size * 0.5, $Size * 0.39
  )
  $heartPath.AddBezier(
    $Size * 0.5, $Size * 0.39,
    $Size * 0.36, $Size * 0.32,
    $Size * 0.29, $Size * 0.47,
    $Size * 0.5, $Size * 0.63
  )
  $graphics.FillPath($heartBodyBrush, $heartPath)

  $innerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#fff6e9"))
  $graphics.FillRectangle($innerBrush, $Size * 0.48, $Size * 0.44, $Size * 0.04, $Size * 0.14)
  $graphics.FillRectangle($innerBrush, $Size * 0.445, $Size * 0.495, $Size * 0.11, $Size * 0.04)

  $lineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#ead8c1"))
  $graphics.FillRectangle($lineBrush, $Size * 0.38, $Size * 0.69, $Size * 0.25, $Size * 0.02)
  $graphics.FillRectangle($lineBrush, $Size * 0.38, $Size * 0.75, $Size * 0.19, $Size * 0.02)

  $backgroundBrush.Dispose()
  $glowBrush.Dispose()
  $glowPath.Dispose()
  $shadowBrush.Dispose()
  $bookBrush.Dispose()
  $bookBorder.Dispose()
  $spineBrush.Dispose()
  $bookmarkBrush.Dispose()
  $bookmarkPath.Dispose()
  $heartBodyBrush.Dispose()
  $heartPath.Dispose()
  $innerBrush.Dispose()
  $lineBrush.Dispose()
  $bookPath.Dispose()
  $graphics.Dispose()

  return $bitmap
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Write-IcoFromPng {
  param(
    [string]$PngPath,
    [string]$IcoPath
  )

  $pngBytes = [System.IO.File]::ReadAllBytes($PngPath)
  $stream = New-Object System.IO.MemoryStream
  $writer = New-Object System.IO.BinaryWriter($stream)

  $writer.Write([UInt16]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]1)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $writer.Write([UInt32]$pngBytes.Length)
  $writer.Write([UInt32]22)
  $writer.Write($pngBytes)
  [System.IO.File]::WriteAllBytes($IcoPath, $stream.ToArray())

  $writer.Dispose()
  $stream.Dispose()
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$iconsDir = Join-Path $repoRoot "assets\icons"
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

$bitmap192 = New-AppBitmap -Size 192
$bitmap256 = New-AppBitmap -Size 256
$bitmap512 = New-AppBitmap -Size 512

Save-Png -Bitmap $bitmap192 -Path (Join-Path $iconsDir "icon-192.png")
Save-Png -Bitmap $bitmap256 -Path (Join-Path $iconsDir "icon-256.png")
Save-Png -Bitmap $bitmap512 -Path (Join-Path $iconsDir "icon-512.png")
Write-IcoFromPng -PngPath (Join-Path $iconsDir "icon-256.png") -IcoPath (Join-Path $iconsDir "desktop.ico")

$bitmap192.Dispose()
$bitmap256.Dispose()
$bitmap512.Dispose()

Write-Host "Iconos generados en $iconsDir"

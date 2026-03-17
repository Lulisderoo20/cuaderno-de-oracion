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

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$assetsDir = Join-Path $repoRoot "assets"
$outputPath = Join-Path $assetsDir "og-image.png"
$logoPath = Join-Path $assetsDir "branding\jesus-oracion-app.png"

$width = 1200
$height = 630
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$backgroundRect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
$backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $backgroundRect,
  [System.Drawing.ColorTranslator]::FromHtml("#f8eee0"),
  [System.Drawing.ColorTranslator]::FromHtml("#d6aa84"),
  25
)
$graphics.FillRectangle($backgroundBrush, $backgroundRect)

$glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 255, 248, 238))
$graphics.FillEllipse($glowBrush, -80, -50, 420, 320)
$graphics.FillEllipse($glowBrush, 860, 60, 280, 220)

$cardPath = New-RoundedRectPath -X 70 -Y 60 -Width 1060 -Height 510 -Radius 42
$cardBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle 70, 60, 1060, 510),
  [System.Drawing.Color]::FromArgb(245, 255, 250, 243),
  [System.Drawing.Color]::FromArgb(233, 248, 240, 230),
  90
)
$graphics.FillPath($cardBrush, $cardPath)

$cardBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 174, 131, 94), 2)
$graphics.DrawPath($cardBorder, $cardPath)

$logo = [System.Drawing.Image]::FromFile($logoPath)
$logoFramePath = New-RoundedRectPath -X 102 -Y 105 -Width 170 -Height 240 -Radius 34
$graphics.SetClip($logoFramePath)
$sourceRect = New-Object System.Drawing.RectangleF 120, 120, 780, 930
$destRect = New-Object System.Drawing.RectangleF 102, 105, 170, 240
$graphics.DrawImage($logo, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
$graphics.ResetClip()
$logoFrameBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(85, 164, 123, 82), 2)
$graphics.DrawPath($logoFrameBorder, $logoFramePath)

$eyebrowFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold)
$titleFont = New-Object System.Drawing.Font("Georgia", 36, [System.Drawing.FontStyle]::Bold)
$bodyFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Regular)
$pillFont = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$smallPillFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)

$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#9b6440"))
$inkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#2e241c"))
$mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#6f6257"))
$pillTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#fffaf4"))
$pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#af6d45"))
$panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(165, 255, 252, 247))

$graphics.DrawString("CUADERNO DE ORACION", $eyebrowFont, $accentBrush, 320, 105)

$titleRect = New-Object System.Drawing.RectangleF 320, 150, 610, 170
$titleFormat = New-Object System.Drawing.StringFormat
$titleFormat.Trimming = [System.Drawing.StringTrimming]::Word
$graphics.DrawString(
  "Escribe, comparte y acompana cada oracion.",
  $titleFont,
  $inkBrush,
  $titleRect,
  $titleFormat
)

$bodyRect = New-Object System.Drawing.RectangleF 320, 340, 600, 110
$bodyFormat = New-Object System.Drawing.StringFormat
$bodyFormat.Trimming = [System.Drawing.StringTrimming]::Word
$graphics.DrawString(
  "Una libreta calida para guardar tus oraciones y un centro comunitario para que todos puedan acompanarte.",
  $bodyFont,
  $mutedBrush,
  $bodyRect,
  $bodyFormat
)

$pillPath = New-RoundedRectPath -X 320 -Y 470 -Width 295 -Height 60 -Radius 28
$graphics.FillPath($pillBrush, $pillPath)
$graphics.DrawString("Centro de Oraciones", $pillFont, $pillTextBrush, 353, 485)

$sidePath = New-RoundedRectPath -X 880 -Y 120 -Width 210 -Height 360 -Radius 30
$graphics.FillPath($panelBrush, $sidePath)

$linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 157, 117, 78), 2)
$graphics.DrawPath($linePen, $sidePath)
$graphics.DrawString("Oraciones", $eyebrowFont, $accentBrush, 915, 155)
$graphics.DrawString("Con nombre", $pillFont, $inkBrush, 915, 225)
$graphics.DrawString("Anonimo", $pillFont, $inkBrush, 915, 272)
$graphics.DrawString("Compartidas", $pillFont, $inkBrush, 915, 319)
$graphics.DrawString("Desde cualquier", $smallPillFont, $inkBrush, 915, 367)
$graphics.DrawString("lugar", $smallPillFont, $inkBrush, 915, 398)

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$logo.Dispose()
$eyebrowFont.Dispose()
$titleFont.Dispose()
$bodyFont.Dispose()
$pillFont.Dispose()
$smallPillFont.Dispose()
$accentBrush.Dispose()
$inkBrush.Dispose()
$mutedBrush.Dispose()
$pillTextBrush.Dispose()
$pillBrush.Dispose()
$panelBrush.Dispose()
$linePen.Dispose()
$logoFrameBorder.Dispose()
$cardBorder.Dispose()
$cardBrush.Dispose()
$cardPath.Dispose()
$logoFramePath.Dispose()
$pillPath.Dispose()
$sidePath.Dispose()
$glowBrush.Dispose()
$backgroundBrush.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "OG image generated at $outputPath"

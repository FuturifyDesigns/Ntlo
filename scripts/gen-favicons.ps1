Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "public\logo-icon.png"
$img = [System.Drawing.Image]::FromFile($src)

function New-ResizedBitmap($image, $size) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($image, 0, 0, $size, $size)
    $g.Dispose()
    return $bmp
}

function Save-Png($image, $size, $outName) {
    $bmp = New-ResizedBitmap $image $size
    $bmp.Save((Join-Path $root "public\$outName"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Save-Png $img 48  "favicon-48.png"
Save-Png $img 96  "favicon-96.png"
Save-Png $img 192 "favicon-192.png"
Save-Png $img 512 "favicon-512.png"
Save-Png $img 180 "apple-touch-icon.png"

$sizes = 16, 32, 48
$pngBytes = @()
foreach ($s in $sizes) {
    $bmp = New-ResizedBitmap $img $s
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes += , ($ms.ToArray())
    $ms.Dispose(); $bmp.Dispose()
}
$img.Dispose()

$out = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $out
$bw.Write([uint16]0)
$bw.Write([uint16]1)
$bw.Write([uint16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]; $data = $pngBytes[$i]
    $bw.Write([byte]$s)
    $bw.Write([byte]$s)
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]32)
    $bw.Write([uint32]$data.Length)
    $bw.Write([uint32]$offset)
    $offset += $data.Length
}
foreach ($data in $pngBytes) { $bw.Write($data) }
$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $root "public\favicon.ico"), $out.ToArray())
$out.Dispose()
Write-Host "Done: favicon.ico + sized PNGs created in public/"

$ErrorActionPreference = 'Stop'
$extract = Join-Path $PSScriptRoot '_source_extract'
$archive = Join-Path $extract 'slides.zip'
New-Item -ItemType Directory -Force -Path $extract | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'LSTM_ARO_Complete_Research_Presentation.pptx') -Destination $archive -Force
Expand-Archive -LiteralPath $archive -DestinationPath $extract -Force
Remove-Item -LiteralPath $archive
$source = Join-Path $extract 'ppt'
$out = Join-Path $PSScriptRoot 'docs'
$assets = Join-Path $out 'assets'
New-Item -ItemType Directory -Force -Path $assets | Out-Null
Copy-Item -Path (Join-Path $source 'media\*.png') -Destination $assets -Force

function Attr($node, $name, $default = '') {
  if ($null -eq $node -or $null -eq $node.Attributes[$name]) { return $default }
  return $node.Attributes[$name].Value
}
function Child($node, $xpath) { if ($null -eq $node) { return $null }; return $node.SelectSingleNode($xpath, $script:ns) }
function Children($node, $xpath) { if ($null -eq $node) { return @() }; return @($node.SelectNodes($xpath, $script:ns)) }
function Color($node) {
  if ($null -eq $node) { return '' }
  $rgb = Child $node './a:srgbClr'
  if ($rgb) { return "#$($rgb.Attributes['val'].Value)" }
  return ''
}

$slides = @()
for ($i = 1; $i -le 39; $i++) {
  $file = Join-Path $source "slides\slide$i.xml"
  $xml = [xml](Get-Content -LiteralPath $file -Raw -Encoding UTF8)
  $script:ns = [System.Xml.XmlNamespaceManager]::new($xml.NameTable)
  $script:ns.AddNamespace('p', 'http://schemas.openxmlformats.org/presentationml/2006/main')
  $script:ns.AddNamespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main')
  $script:ns.AddNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
  $rels = @{}
  $relFile = Join-Path $source "slides\_rels\slide$i.xml.rels"
  if (Test-Path $relFile) {
    $rx = [xml](Get-Content -LiteralPath $relFile -Raw -Encoding UTF8)
    foreach ($rel in $rx.DocumentElement.ChildNodes) { $rels[(Attr $rel 'Id')] = (Attr $rel 'Target') }
  }
  $bg = Color (Child $xml '//p:cSld/p:bg/p:bgPr/a:solidFill')
  if (-not $bg) { $bg = '#F8FAFD' }
  $items = @()
  foreach ($shape in (Children $xml '//p:spTree/*')) {
    if ($shape.LocalName -notin @('sp', 'pic', 'cxnSp')) { continue }
    $xfrm = Child $shape './p:spPr/a:xfrm'
    if (-not $xfrm) { $xfrm = Child $shape './p:spPr/a:xfrm' }
    if (-not $xfrm) { continue }
    $off = Child $xfrm './a:off'; $ext = Child $xfrm './a:ext'
    if (-not $off -or -not $ext) { continue }
    $box = @([double](Attr $off 'x' 0), [double](Attr $off 'y' 0), [double](Attr $ext 'cx' 0), [double](Attr $ext 'cy' 0))
    $geom = Child $shape './p:spPr/a:prstGeom'
    $fill = Color (Child $shape './p:spPr/a:solidFill')
    $line = Color (Child $shape './p:spPr/a:ln/a:solidFill')
    $ln = Child $shape './p:spPr/a:ln'
    $textParts = @()
    foreach ($para in (Children $shape './p:txBody/a:p')) {
      $runs = @()
      foreach ($run in (Children $para './a:r|./a:fld')) {
        $t = Child $run './a:t'
        if (-not $t) { continue }
        $rp = Child $run './a:rPr'
        $runs += @{ text = $t.InnerText; size = [double](Attr $rp 'sz' 1600) / 100; bold = ((Attr $rp 'b') -eq '1'); color = (Color (Child $rp './a:solidFill')) }
      }
      if ($runs.Count) { $textParts += @{ runs = $runs; align = (Attr (Child $para './a:pPr') 'algn' 'l') } }
    }
    $body = Child $shape './p:txBody/a:bodyPr'
    $embed = Child $shape './p:blipFill/a:blip'
    $image = ''
    if ($embed) {
      $id = $embed.GetAttribute('embed', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
      if ($rels.ContainsKey($id)) { $image = 'assets/' + [IO.Path]::GetFileName($rels[$id]) }
    }
    $items += @{ type = $shape.LocalName; box = $box; geom = (Attr $geom 'prst' 'rect'); fill = $fill; line = $line; lineWidth = [double](Attr $ln 'w' 0); headEnd = (Attr (Child $ln './a:headEnd') 'type'); tailEnd = (Attr (Child $ln './a:tailEnd') 'type'); rotation = [double](Attr $xfrm 'rot' 0); flipH = (Attr $xfrm 'flipH'); flipV = (Attr $xfrm 'flipV'); paragraphs = $textParts; anchor = (Attr $body 'anchor' 't'); image = $image }
  }
  $slides += @{ number = $i; background = $bg; items = $items }
}
$json = ConvertTo-Json -InputObject $slides -Depth 20 -Compress
[IO.File]::WriteAllText((Join-Path $out 'slides.json'), $json, [Text.UTF8Encoding]::new($false))
"Exported $($slides.Count) slides to docs/slides.json"

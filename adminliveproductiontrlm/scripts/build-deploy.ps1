$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'
$deploy = Join-Path $root 'deploy'

Write-Host 'Building production assets...'
Push-Location $root
try {
  npm.cmd run build
}
finally {
  Pop-Location
}

if (!(Test-Path $dist)) {
  throw "Build output folder not found: $dist"
}

Write-Host 'Refreshing deploy folder...'
if (Test-Path $deploy) {
  Remove-Item $deploy -Recurse -Force
}

New-Item -ItemType Directory -Path $deploy | Out-Null
Copy-Item -Path (Join-Path $dist '*') -Destination $deploy -Recurse -Force

$webConfig = @'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Router SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
'@

Set-Content -Path (Join-Path $deploy 'web.config') -Value $webConfig -Encoding utf8

Write-Host "Deploy folder ready: $deploy"

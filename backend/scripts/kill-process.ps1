$target_pid=$args[0]
Get-WmiObject -Class Win32_Process -Filter "ParentProcessID=$target_pid" | Select-Object ProcessId | ? { Stop-Process -Id $_.ProcessId }
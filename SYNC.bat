@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

set "INK_REMOTE=https://github.com/index7777/Inkblade.git"
set "INK_BRANCH=main"

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not installed or is not available in PATH.
  pause
  exit /b 1
)

call :ensure_repo
if errorlevel 1 (
  pause
  exit /b 1
)

:menu
cls
echo ============================================================
echo   Inkblade Sync
echo   Remote: %INK_REMOTE%
echo   Folder: %CD%
echo ============================================================
echo.
echo   [1] Pull latest         (do this BEFORE starting work)
echo   [2] Commit and Push     (do this AFTER finishing work)
echo   [3] Show status
echo   [0] Quit
echo.
set "MENU_CHOICE="
set /p MENU_CHOICE=Enter your choice: 
if "%MENU_CHOICE%"=="1" goto :download
if "%MENU_CHOICE%"=="2" goto :push
if "%MENU_CHOICE%"=="3" goto :status
if "%MENU_CHOICE%"=="0" goto :done
goto :menu

:download
echo.
echo [DOWNLOAD] Checking local changes...
call :require_clean
if errorlevel 1 goto :pause_menu

echo [DOWNLOAD] Fetching origin...
git fetch origin
if errorlevel 1 goto :git_error

git show-ref --verify --quiet "refs/remotes/origin/%INK_BRANCH%"
if errorlevel 1 (
  echo [INFO] The remote repository has no %INK_BRANCH% branch yet.
  echo        Use Push at the first workplace to publish this project.
  goto :pause_menu
)

echo [DOWNLOAD] Fast-forwarding to origin/%INK_BRANCH%...
git pull --ff-only origin "%INK_BRANCH%"
if errorlevel 1 goto :git_error
echo [OK] Local project is up to date.
goto :pause_menu

:push
echo.
echo [PUSH] Staging all project changes...
git add -A
if errorlevel 1 goto :git_error

git diff --cached --quiet
if errorlevel 1 goto :commit_changes
echo [INFO] No new local changes to commit.
goto :after_commit

:commit_changes
set "SYNC_MSG="
set /p SYNC_MSG=Short description of this change (Enter for default): 
if not defined SYNC_MSG set "SYNC_MSG=Sync from %COMPUTERNAME% on %date% %time%"
git commit -m "%SYNC_MSG%"
if errorlevel 1 goto :git_error

:after_commit

echo [PUSH] Checking remote progress before upload...
git fetch origin
if errorlevel 1 goto :git_error

git show-ref --verify --quiet "refs/remotes/origin/%INK_BRANCH%"
if not errorlevel 1 (
  git pull --rebase origin "%INK_BRANCH%"
  if errorlevel 1 (
    echo.
    echo [STOPPED] Rebase needs attention. Your work was not discarded.
    echo Resolve the files shown by Git, then run SYNC.bat and Push again.
    goto :pause_menu
  )
)

echo [PUSH] Uploading to GitHub...
git push -u origin "%INK_BRANCH%"
if errorlevel 1 goto :git_error
echo [OK] Local progress has been uploaded.
goto :pause_menu

:status
echo.
echo [STATUS]
git status --short --branch
echo.
git remote -v
goto :pause_menu

:require_clean
git status --porcelain | findstr /R "." >nul
if not errorlevel 1 (
  echo [STOPPED] Local files have uncommitted changes.
  echo Use Push first, or commit/stash them manually before Download.
  exit /b 1
)
exit /b 0

:ensure_repo
git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo [SETUP] Initializing Inkblade in this folder...
  git init -b "%INK_BRANCH%"
  if errorlevel 1 exit /b 1
)

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin "%INK_REMOTE%"
  if errorlevel 1 exit /b 1
) else (
  for /f "delims=" %%R in ('git remote get-url origin') do set "CURRENT_REMOTE=%%R"
  if /I not "!CURRENT_REMOTE!"=="%INK_REMOTE%" (
    echo [ERROR] This folder points to a different origin:
    echo         !CURRENT_REMOTE!
    echo Expected: %INK_REMOTE%
    echo Change it manually before using SYNC.bat.
    exit /b 1
  )
)

git branch --show-current | findstr /X "%INK_BRANCH%" >nul
if errorlevel 1 (
  git show-ref --verify --quiet "refs/heads/%INK_BRANCH%"
  if errorlevel 1 git checkout -b "%INK_BRANCH%" >nul 2>nul
)
exit /b 0

:git_error
echo.
echo [ERROR] Git stopped the operation. No destructive reset was used.

:pause_menu
echo.
pause
goto :menu

:done
endlocal
exit /b 0

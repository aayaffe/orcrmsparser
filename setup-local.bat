@echo off
REM ORCMS Parser - Local Deployment Script for Windows
REM This script helps set up the application locally using Docker

setlocal enabledelayedexpansion

echo ================================
echo ORCMS Parser - Local Docker Setup
echo ================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] docker-compose not found, trying: docker compose
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker Compose is not available
        echo Please install Docker Desktop with Compose
        pause
        exit /b 1
    )
    set "DOCKER_COMPOSE=docker compose"
) else (
    set "DOCKER_COMPOSE=docker-compose"
)

echo [OK] Docker is installed
echo.

echo ================================
echo Building Docker images...
echo ================================
%DOCKER_COMPOSE% build
if errorlevel 1 (
    echo [ERROR] Failed to build images
    pause
    exit /b 1
)

echo.
echo ================================
echo Starting services...
echo ================================
%DOCKER_COMPOSE% up -d
if errorlevel 1 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo.
echo Waiting for services to start (10 seconds)...
timeout /t 10

echo.
echo ================================
echo Checking service status...
echo ================================
%DOCKER_COMPOSE% ps

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Access the application:
echo   Frontend:     http://localhost:3000
echo   Backend API:  http://localhost:8000
echo   API Docs:     http://localhost:8000/docs
echo.
echo Useful commands:
echo   View logs:     %DOCKER_COMPOSE% logs -f
echo   Restart:       %DOCKER_COMPOSE% restart
echo   Stop:          %DOCKER_COMPOSE% down
echo   Rebuild:       %DOCKER_COMPOSE% build --no-cache
echo.
pause

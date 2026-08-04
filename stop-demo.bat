@echo off
title Longevity Platform — Parar Demo
color 0C

echo ========================================
echo  A parar ambiente de demonstracao...
echo ========================================
echo.

docker compose -f docker\docker-compose.demo.yml down --remove-orphans

echo.
echo ========================================
echo  Ambiente parado.
echo ========================================
echo.
echo  Para apagar todos os dados (volumes):
echo    docker compose -f docker\docker-compose.demo.yml down -v
echo.
pause

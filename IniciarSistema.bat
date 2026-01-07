@echo off
echo Iniciando Sistema de Transito...
echo Por favor espere...

cd backend
if not exist node_modules (
    echo Instalando dependencias...
    call npm install
)

if not exist ..\transit_system.sqlite (
    echo Inicializando base de datos...
    node scripts/initDB_sqlite.js
)

echo Abriendo navegador...
start http://localhost:3000

echo Iniciando Servidor...
node app.js
pause

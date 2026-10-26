@echo off
cd /d %~dp0
mongodb\bin\mongod.exe --dbpath mongodb\data --logpath mongodb\log\mongod.log --logappend --bind_ip 127.0.0.1 --port 27017

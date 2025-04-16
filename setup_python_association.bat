@echo off
assoc .py=Python.File
ftype Python.File="C:\Python310\python.exe" "%%1" %%* 
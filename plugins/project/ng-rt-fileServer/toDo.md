Encryption based on Parameter from clients
Progress (bar)

upload of object of 4 GB

Test multipart and bulk upload

Download of Ascii files working

BLOBs not working yet
  RegRid Get works but not via getFile(Buffer)
  Simple Fileserver


  curl http://localhost:8000/file.txt
  File not found

  curl -X PUT -d hello http://localhost:8000/file.txt
  curl http://localhost:8000/file.txt
  hello

  curl -X DELETE http://localhost:8000/file.txt
  curl http://localhost:8000/file.txt
  File not found

  curl -i -F name=test -F filedata=@test.txt http://localhost:3333/da/uploa

  curl -X PUT --form "file=@someFile.jpg" http://localhost:8888/up

  server.plugin_manager

  manager.configs.data(plugin_name).path.absolute
  manager.configs.data(plugin_name).path.relative

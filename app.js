//importing required packages
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');


//for executing linux commands
var exec = require('child_process').exec;
var command = "php /home/adarsh/hash.php stream1.stream";



var port = 8090;

var app = express();

app.use(bodyParser.json());
/*
app.use(function(req, res, next){
	console.log('Time: ', Date.now());
	next();
});

app.use(bodyParser.urlencoded({extended: false}));
*/


//for checking archived files - only names
var names=null;
var a;

/*
var traverseFileSystem = function (currentPath) {
		var files = fs.readdirSync(currentPath);
		for (var i in files) {
			var currentFile = currentPath + '/' + files[i];
			var stats = fs.statSync(currentFile);
			if (stats.isFile()) {
				if(names == null){
					names = currentFile;
				}
				else
					names = names + '\n' + currentFile;
			}
			else if (stats.isDirectory()) {
				traverseFileSystem(currentFile);
			}
		}
};
*/


var results = [];

function findFilesInDir(startPath,filter){

    results = [];
    if (!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }

    var files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()){
            results = results.concat(findFilesInDir(filename,filter)); //recurse
        }
        else if (filename.indexOf(filter)>=0) {
            //console.log('-- found: ',filename);
		if(filename.indexOf('.mp4')>=0)
	        {
                        console.log(files[i]);
            		//results.push(filename);
            		results.push(files[i]);
        	}
    	}
    }
    //return results;
}

//commands route
app.get('/commands', function(req, res){
	//res.send('commands page');
	if(req.query.cmd == "ON"){
		command = 'curl -X PUT --header' + " 'Accept:application/json; charset=utf-8' --header 'Content-type:application/json; charset=utf-8' " + '"http://localhost:8087/v2/servers/_defaultServer_/vhosts/_defaultVHost_/streamfiles/"' + req.query.streamname + '"/actions/connect?connectAppName=live&appInstance=_definst_&mediaCasterType=rtp"';
		exec(command, function (err, stdout, stderr) {
			//response.writeHead(200, {"Content-Type": "text/plain"});
    			//response.write(stdout);
    			//response.end();
			res.write(stdout);
			res.send();
		});
	}
	else if(req.query.cmd == "OFF"){
		command = "curl -X PUT --header 'Accept:application/json; charset=utf-8' http://localhost:8087/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/live/instances/_definst_/incomingstreams/" + req.query.streamname + ".stream/actions/disconnectStream";
		exec(command, function (err, stdout, stderr) {
			//response.writeHead(200, {"Content-Type": "text/plain"});
    			//response.write(stdout);
    			//response.end();
			res.write(stdout);
			res.send();
		});
	}
		
}); 


//archives route
app.get('/archive', function(req, res){
	var filepath = req.query.base_dir;		//concatenating stream name to the path
	//traverseFileSystem(filepath);
	
	/*
	fs.readdir(filepath, function(err, items) {
    
    		for (var i=0; i<items.length; i++) {
    			if(names == null) {
				names = items[i];
			}
			else {
				names = names + '\n' + items[i];
			}
    		}
	});
	*/
	
	//res.send(names.split("\n"));						//this wont print a newline character
	//res.write("List of files in the path - "+filepath+"\n\n");
	if (req.query.streamname == null || req.query.base_dir == null){
           res.write("ERROR \n \n");
           
	   res.write("URI Template: http://ip_addr:8090/archive?base_dir=base_dir_name&streamname=stream_name \n");
           res.send();
           return;
        }
        else {
	   res.write("List of Archived files for the given stream: "+req.query.streamname+"\n\n");
        }
		
	findFilesInDir(filepath,req.query.streamname);
	//a = results;
	for (i in results) {
		res.write(results[i]+"\n");	
	}	

	res.write("\nTo play the stream, use ffplay --> ffplay rtmp://[wowza_ip_addr]:1935/vod/<filename> (listed above)\n");
	res.send();
	names=null;


	
	console.log('traversed file system\n');
});

// to query the archive using curl -->  curl -X GET -s -H "Content-Type: application/json" "http://127.0.0.1:3000/archive?streamname=stream1"




//security route
app.get('/security', function(req, res){
	res.write('Authentication and Security Page \n\n');
	if(req.query.appname="live" && req.query.username == "rbccps" && req.query.passwd == "rbccps") {
		if(req.query.streamname == "stream1") {
			command = "php /home/adarsh/Scripts/hash.php stream1.stream";		
			exec(command, function (err, stdout, stderr) {
				res.write(stdout+"\n");
				res.send();
			});
		}
		else {
			res.send("invalid stream name\n");
		}
	}
	else if(req.query.appname="vod" && req.query.username == "rbccps" && req.query.passwd == "rbccps") {
		if(req.query.streamname == "stream1") {
			command = "php /home/adarsh/Scripts/hash_vod.php stream1.stream_0.mp4";		
			exec(command, function (err, stdout, stderr) {
				res.write(stdout+"\n");
				res.send();
			});
		}
		else {
			res.send("invalid stream name\n");
		}
	}
	else {
		res.send("incorrect login credentials or application name\n");
	}
	//res.send();
});


app.listen(port);
console.log('server started on port: '+port);

module.exports = app;



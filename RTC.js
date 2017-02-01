// CONVERT LIDAR DATASET TO CESIUM PNTS 3D-TILES

var fs = require('fs');
var bParser = require('binary-parser').Parser;
 
var pointFile=process.argv[2];
var colorFile=process.argv[3];
var outFile=process.argv[4];
var heightAdjust=process.argv[5];

console.log('processing points '+pointFile);
console.log('processing colors '+colorFile);
console.log('writing to '+outFile);

// convert lidar using lastools

// read a list of LLA lidar points
console.log('reading points file')
var points = fs.readFileSync(pointFile, 'utf8').split("\n");
var colors = fs.readFileSync(colorFile, 'utf8').split("\n");

// convert LLA list to XYZ coordinates
console.log('converting lla list to xyz coordinates')
var pts = [];
var ptsxyz = [];
for (var i = 0; i < points.length; i++) {
//for (var i = 0; i < 100; i++) {
    var pt = points[i].split(",");
    if (!isNaN(parseFloat(pt[0]))) {
        pts.push([parseFloat(pt[1]), parseFloat(pt[0]), parseFloat(pt[2])]);
        ptsxyz.push(geo_to_xyz(parseFloat(pt[1]), parseFloat(pt[0]), parseFloat(pt[2])));
    }
}

// find center of XYZ coordinates (for RTC center)
console.log('finding the center of the xyz coordinates')
var centerlla = center_geolocation(pts);
var centerxyz = geo_to_xyz(centerlla[0], centerlla[1], 0)


// calculate the RTC coordinates
console.log('calculating the RTC coordinates')
var ptsRTC = [];
var heights = [];
var sum = 0;
for (var i = 0; i < ptsxyz.length; i++) {
    ptsRTC.push(ptsxyz[i][0] - centerxyz[0]);
    ptsRTC.push(ptsxyz[i][1] - centerxyz[1]);
    ptsRTC.push(ptsxyz[i][2] - centerxyz[2]);
    sum += (ptsxyz[i][2] - centerxyz[2]);
}
var avg = sum / ptsxyz.length;

// correct for height input - could also use the avg height reduction calculated above
var centerxyz = geo_to_xyz(centerlla[0], centerlla[1], parseFloat(heightAdjust)); //-avg+parseFloat(heightAdjust));

// create the colors array
var colorbin=[]
for (var i = 0; i < ptsxyz.length; i++) {
    var color = colors[i].split(",");
    if (!isNaN(parseInt(color[0]))) {
        colorbin.push((color[0]));
        colorbin.push((color[1]));
        colorbin.push((color[2]));
    }
}

// generate the tileset.json
console.log('generating tileset.json');
//console.log(centerxyz)

var template='{'+'\n'+
  '"asset": {'+'\n'+
    '"version": "0.0"'+'\n'+
  '},'+'\n'+
  '"geometricError": 10000,'+'\n'+
  '"refine": "add",'+'\n'+
  '"root":'+'\n'+
	'{'+'\n'+
    '"boundingVolume": {'+'\n'+
      '"sphere": ['+centerxyz.join(",")+','+
        '100'+
      ']'+'\n'+
    '},'+'\n'+
    '"geometricError": 0,'+'\n'+
    '"content": {'+'\n'+
      '"url": "'+outFile.split("/")[outFile.split("/").length-1]+'.pnts"'+'\n'+
    '},'+'\n'+
    '"children": []'+'\n'+
  '}'+'\n'+
'}'+'\n'

var tmpwrite = fs.writeFileSync(outFile+".json", template);

// write the binary pnts file

var binfile = outFile+".bin";

// delete the bin file if it exists
try {
    fs.unlink(binfile, writeBuffer);
}
catch (e) {
    writeBuffer()
}

function writeBuffer() {

    console.log('writing the binary file')

    var outStream = fs.createWriteStream(binfile)

    var version = 1;
    var pointsLength = ptsxyz.length;
    var byteLength = pointsLength*15 + 16;

    var b = new Buffer(byteLength);

    b.write('pnts', 0); // magic
    b.writeUInt32LE(version, 4); // version
    b.writeUInt32LE(byteLength, 8); // byteLength
    b.writeUInt32LE(pointsLength, 12); // pointsLength

    var base = 16;
    var offset = 0;
    for (var i = 0; i < ptsRTC.length; i++) { // positions
        offset = base + i * 4;
        b.writeFloatLE(ptsRTC[i], offset);
    }

    var base = offset + 4;
    var offset = 0;
    for (var i = 0; i < colorbin.length; i++) { // colors
        offset = base + i;
        b.writeUInt8(colorbin[i], offset);
    }

    outStream.write(b)
    outStream.end()

    outStream.on('close', function() {
        gzipFile();
        //readBuffer() // QAQC the bin file
    });

}


// HELPER FUNCTIONS

function center_geolocation(geolocations) {
    var x = 0;
    var y = 0;
    var z = 0;
    for (var i = 0; i < geolocations.length; i++) {
        var lat = parseFloat(geolocations[i][0]) * (Math.PI / 180); // convert to radians
        var lon = parseFloat(geolocations[i][1]) * (Math.PI / 180);
        x += Math.cos(lat) * Math.cos(lon);
        y += Math.cos(lat) * Math.sin(lon);
        z += Math.sin(lat);
    }
    x = parseFloat(x / (geolocations.length))
    y = parseFloat(y / (geolocations.length))
    z = parseFloat(z / (geolocations.length))
    return [Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI), Math.atan2(y, x) * (180 / Math.PI)]
}

function geo_to_xyz(lat, lon, elev) {
    // HELPER VARIABLES (from wgs84)
    var a = 6378137; // equitorial radius (semi-major axis)
    var f = 0.0033528106647474805; // flattening
    var e2 = (2 - f) * f; // first eccentricity squared
    var h = elev === undefined ? 0 : elev;
    var rlat = lat / 180 * Math.PI;
    var rlon = lon / 180 * Math.PI;
    var slat = Math.sin(rlat);
    var clat = Math.cos(rlat);
    var N = a / Math.sqrt(1 - e2 * slat * slat);
    var x = (N + h) * clat * Math.cos(rlon);
    var y = (N + h) * clat * Math.sin(rlon);
    var z = (N * (1 - e2) + h) * slat;
    return [x, y, z];
};

// read the buffer file as a QAQC check
function readBuffer() {
    var pointsHeader = new bParser()
        .string('magic', {
            length: 4
        })
        .int32le('version', {})
        .int32le('byteLength', {}) // pointsLength * 15 + 16
        .int32le('pointsLength', {})
        .array('positions', {
            type: 'floatle',
            length: function() {
                //return 3;
                return this.pointsLength / 3;
            }
        })
        .array('colors', {
            type: 'uint8',
            length: function() {
                //return 6;
                return this.pointsLength / 3;
            }
        });
    fs.readFile(binfile, function(err, data) {
        console.log(pointsHeader.parse(data).colors);
    });
}

// gzip the file and rename as .pnts extension
function gzipFile() {

    console.log('gzipping the binary file')
    var exec = require('child_process').exec;
    var basename = binfile.split(".")[0];

    // remove the gz file if it exists
    try {
        fs.unlink(binfile + ".gz", moveOn);
    }
    catch (e) {
        moveOn()
    }

    function moveOn() {
        var cmd = 'gzip ' + binfile + ";mv " + binfile + ".gz " + basename + ".pnts;";
        exec(cmd, function(error, stdout, stderr) {
            console.log(basename + ".pnts file written")
            console.log("process complete")
        });
    }

}

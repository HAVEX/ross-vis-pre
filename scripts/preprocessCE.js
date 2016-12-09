var fs = require("fs"),
    csv = require("../../i2v/p4/src/io/node-dsv.js"),
    dataStruct = require('../../i2v/p4/src/core/datastruct'),
    parser = require('../../i2v/p4/src/io/parser'),
    pipeline = require('../../i2v/p4/src/core/pipeline'),
    scale = require('../../i2v/src/metric');

var CHUNK_SIZE = 5000000;
var DATA_DIR = "/home/kelvin/Workspace/CODES/data/ross/",
    // DATASET = "df5k_N16_batch2_gvt256_kps256";
    DATASET = "df5k_N64_batch8_gvt128_kps16";
// var DATA_DIR = "/storage/datasets/ross/best/";
var result = [];
var VTI = 512;
var maxVT = 164854.640625;
var minVT = 0;

var numPE = 64,
    numKP = 4096,
    numLP = 11388;

var LPperPE = numLP / numPE,
    KPperPE = numLP / numKP;

maxVT = 165011.453125; //worst case last VT

var vtScale = scale({
    domain: [minVT, maxVT],
    range: [0, VTI-1]
});

var parsers = {
    'int': parseInt,
    'float': parseFloat,
    'string': function(s) { return s; }
};

var rowTotal = 0,
    count = 0,
    chunk = CHUNK_SIZE;

var lpMappingCSV = parser(fs.readFileSync(DATA_DIR + DATASET + '/lp-mapping.txt', "utf8"), ",");

var lpMapping = dataStruct({
    array: lpMappingCSV,
    header: [ 'PE', 'KP', 'LP', 'LP_type' ],
    types: ['int', 'int', 'int', 'string'],
    skip: 1
}).objectArray();


function init() {
    result = [];
    for(var t = 0; t <= VTI; t++) {
        result[t] = {};
        result[t].PE = [];
        result[t].GVT = vtScale.invert(t);
        for(var i = 0; i<numPE; i++) {
            result[t].PE[i] = {};
            ['server', 'terminal', 'router'].forEach(function(lpti){
                result[t].PE[i][lpti] = {};
                ['server', 'terminal', 'router', 'total'].forEach(function(lptj){
                    result[t].PE[i][lpti][lptj] = new Array(numPE).fill(0);
                })
            })
        }
    };

}

function processLine(data) {
    data.forEach(function(d){
        var gvt = Math.floor(vtScale(d[2]));

        if(gvt <= VTI && gvt >=0){
            var srcPE = lpMapping[parseInt(d[0])].PE,
                destPE = lpMapping[parseInt(d[1])].PE,
                srcLPType = lpMapping[parseInt(d[0])].LP_type,
                destLPType = lpMapping[parseInt(d[1])].LP_type;

            result[gvt].PE[srcPE][srcLPType]['total'][destPE]++;
            result[gvt].PE[srcPE][srcLPType][destLPType][destPE]++;
        }

    });
    count += data.length;
    if(count > chunk) {
        process.stdout.write(count +"/" + rowTotal + "\r");
        chunk += CHUNK_SIZE;
    }
}

function processLine2(data) {
    data.forEach(function(d){
        var gvt = Math.floor(vtScale(d[2]));

        if(gvt <= VTI && gvt >=0){
            var srcPE = lpMapping[parseInt(d[0])].PE,
                destPE = lpMapping[parseInt(d[1])].PE;

            result[gvt].PE[srcPE][destPE]++;

        }

    });
    count += data.length;
    if(count > chunk) {
        process.stdout.write(count +"/" + rowTotal + "\r");
        chunk += CHUNK_SIZE;
    }
}

function processComDataLP() {
    var headers = [
            'SRC_LP', 'DEST_LP', 'GVT', 'RT', 'event_type'
        ],
        dataTypes = [
            'int', 'int', 'float',  'float', 'int'
        ];

    init();

    csv.read({
        filepath  : DATA_DIR + DATASET + '/ross-stats-evrb-pes.csv',
        skip: 1,
        delimiter : ",",
        // bufferSize: 8 * 1024 * 1024,
        open: function(total) { rowTotal = total; CHUNK_SIZE = 0.01 * total;},
        onload    : processLine,
        oncomplete: function() {

            fs.writeFile('./data/' +  DATASET +'/ross-stats-evrb-lp-type.json', JSON.stringify(result), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });
};

function processComDataPE() {
    var headers = [
            'SRC_LP', 'DEST_LP', 'GVT', 'RT', 'event_type'
        ],
        dataTypes = [
            'int', 'int', 'float',  'float', 'int'
        ];

    result = [];
    for(var t = 0; t <= VTI; t++) {
        result[t] = {};
        result[t].PE = [];
        result[t].GVT = vtScale.invert(t);
        for(var i = 0; i<numPE; i++) {
            result[t].PE[i] = new Array(numPE).fill(0);
        }
    };

    csv.read({
        filepath  : DATA_DIR + DATASET + '/ross-stats-evrb-pes.csv',
        skip: 1,
        delimiter : ",",
        // bufferSize: 8 * 1024 * 1024,
        open: function(total) { rowTotal = total; CHUNK_SIZE = 0.01 * total;},
        onload    : processLine2,
        oncomplete: function() {

            fs.writeFile('./data/' +  DATASET +'/ross-stats-evrb-pes.json', JSON.stringify(result), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });
};

processComDataPE();

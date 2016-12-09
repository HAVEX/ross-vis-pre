var fs = require("fs"),
    csv = require("../../i2v/p4/src/io/node-dsv.js"),
    dataStruct = require('../../i2v/p4/src/core/datastruct'),
    pipeline = require('../../i2v/p4/src/core/pipeline'),
    scale = require('../../i2v/src/metric');

var CHUNK_SIZE = 50000;
var DATA_DIR = "/home/kelvin/Workspace/CODES/data/ross/",
    // DATASET = "df5k_N16_batch2_gvt256_kps256";
    DATASET = "df5k_N64_batch8_gvt128_kps16";
// var DATA_DIR = "/storage/datasets/ross/best/";
var result = [];
var VTI = 512;
var maxVT = 164854.640625;
var minVT = 0;

maxVT = 165011.453125;

var vtScale = scale({
    domain: [minVT, maxVT],
    range: [0, VTI-1]
});

var parsers = {
    'int': parseInt,
    'float': parseFloat,
    'string': function(s) { return s; }
};

function init(features) {
    result = [];
    for(var t = 0; t <= VTI; t++) {
        result[t] = {};
        result[t].GVT = vtScale.invert(t);
        result[t]['all'] = {};
        result[t].count = [];
        features.forEach(function(attr, ai){
            result[t][attr] = [];
            result[t]['all'][attr] = 0;

        });
    };
}


function processData(headers, dataTypes, features) {
    return function(data) {
        var gvtIndex = headers.indexOf("GVT"),
            attrIndex = features.map(function(f){return headers.indexOf(f);});

        data.forEach(function(d){
            var lp = parseInt(d[0]),
                gvt = Math.floor(vtScale(d[gvtIndex]))
                avgC = 1 / data.length;

            if(gvt <= VTI && gvt >=0){
                var values = features.map(function(attr, ai){
                    return parsers[dataTypes[attrIndex[ai]]](d[attrIndex[ai]]);
                })

                if(typeof(result[gvt][features[0]][lp]) !== "undefined") {
                    features.forEach(function(attr, ai){
                        if(attr == "efficiency") {
                            result[gvt][attr][lp] = (result[gvt][attr][lp] + values[ai]) / 2;
                            result[gvt]['all'][attr] = (result[gvt]['all'][attr] + values[ai]) / 2;
                        } else {
                            result[gvt][attr][lp] += values[ai];
                            result[gvt]['all'][attr] += values[ai];
                        }
                    });
                    result[gvt].count[lp]++;
                } else {
                    features.forEach(function(attr, ai){
                        result[gvt][attr][lp] = values[ai];

                    });
                    result[gvt].count[lp] = 1;
                }
            }

        });
    };
}


function groupByLP() {
    var headers = [
        'LP_ID', 'KP_ID', 'PE_ID', 'GVT',
        'events_processed', 'events_rolled_back',
        'remote_sends',  'remote_recvs', 'remote_events'
        ],
        dataTypes = [
            'int', 'int', 'int', 'float',
            'int', 'int', 'int', 'int', 'int'
        ];

    var features = ['events_processed', 'events_rolled_back',  'remote_events'];

    init(features);

    csv.read({
        filepath  :DATA_DIR + DATASET  + '/ross-stats-gvt-lps.csv',
        // skip: 0,
        delimiter : ",",
        // bufferSize: 8 * 1024 * 1024,
        onload    : processData(headers, dataTypes, features),
        oncomplete: function() {

            fs.writeFile('./data/' +  DATASET +'/ros-stats-gvt-lps.json', JSON.stringify(result), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });
}

function groupByKP() {
    var headers = [
            'KP_ID', 'PE_ID',  'GVT', 'total_rollbacks', 'secondary_rollbacks'
        ],
        dataTypes = [
            'int', 'int', 'float',  'int', 'int'
        ];

    var features = ['total_rollbacks', 'secondary_rollbacks'];

    init(features);

    csv.read({
        filepath  : DATA_DIR + DATASET + '/ross-stats-gvt-kps.csv',
        skip: 1,
        delimiter : ",",
        // bufferSize: 8 * 1024 * 1024,
        onload    : processData(headers, dataTypes, features),
        oncomplete: function() {

            fs.writeFile('./data/' +  DATASET +'/ross-stats-gvt-kps.json', JSON.stringify(result), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });
}

function groupByPE() {
    var headers = 'PE_ID,GVT,all_reduce_count,events_aborted,event_ties,fossil_collects,net_events,efficiency'.split(","),
        dataTypes = ['int', 'float', 'int', 'int', 'int', 'int', 'int', 'float'];

    var features = ['all_reduce_count', 'events_aborted', 'event_ties', 'fossil_collects', 'net_events', 'efficiency'];

    init(features);

    csv.read({
        filepath  : DATA_DIR + DATASET + '/ross-stats-gvt-pes.csv',
        skip: 1,
        delimiter : ",",
        // bufferSize: 8 * 1024 * 1024,
        onload    : processData(headers, dataTypes, features),
        oncomplete: function() {
            console.log(result.length);
            fs.writeFile('./data/' +  DATASET +'/ross-stats-gvt-pes.json', JSON.stringify(result), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });
}

groupByLP();

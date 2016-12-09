var fs = require("fs"),
    csv = require("../../i2v/p4/src/io/node-dsv.js"),
    dataStruct = require('../../i2v/p4/src/core/datastruct'),
    pipeline = require('../../i2v/p4/src/core/pipeline'),
    scale = require('../../i2v/src/metric');

var CHUNK_SIZE = 50000;
var DATA_DIR = "/home/kelvin/Workspace/CODES/data/ross/",
    DATASET = "df5k_N64_batch8_gvt128_kps16";
    // DATASET = "df5k_N16_batch2_gvt256_kps256";
// var DATA_DIR = "/storage/datasets/ross/best/";
var result = [];
var RTI = 127;
var minRT = 2865732.500000;  //worst case RT start
var maxRT = 2865834.500000;  //wrost caset RT end

// var minRT = 2865238.750000; //best cast RT start
// var maxRT = 2865341.250000; //best case RT end
var rtScale = scale({
    domain: [minRT, maxRT],
    range: [0, RTI]
});

var parsers = {
    'int': parseInt,
    'float': parseFloat,
    'string': function(s) { return s; }
};

function init(features) {
    result = [];
    for(var t = 0; t <= RTI; t++) {
        result[t] = {};
        result[t].RT = rtScale.invert(t) - minRT;
        result[t].GVT = Number.POSITIVE_INFINITY;
        result[t]['all'] = {};
        features.forEach(function(attr, ai){
            result[t][attr] = [];
            result[t]['all'][attr] = 0;
        });
    };
}

function processData(headers, dataTypes, features) {
    return function(data) {
        var rtIndex = headers.indexOf("RT"),
            gvtIndex = headers.indexOf("GVT"),
            attrIndex = features.map(function(f){return headers.indexOf(f);});


        data.forEach(function(d){
            var lp = parseInt(d[0]),
                rt = Math.floor(rtScale(d[rtIndex])),
                gvt = parseFloat(d[gvtIndex]);

            if(rt <= RTI && rt >=0){
                var values = features.map(function(attr, ai){
                    return parsers[dataTypes[attrIndex[ai]]](d[attrIndex[ai]]);
                })

                if(typeof(result[rt][features[0]][lp]) !== "undefined") {

                    features.forEach(function(attr, ai){
                        result[rt][attr][lp] += values[ai];
                        result[rt]['all'][attr] += values[ai];
                    });
                    if(gvt < result[rt].GVT ) result[rt].GVT = gvt;
                } else {

                    features.forEach(function(attr, ai){
                        result[rt][attr][lp] = values[ai];
                        result[rt]['all'][attr] += values[ai];
                    });
                }
            };
        });

    };
}


function groupLpByRt() {
    var headers = [
        'LP_ID', 'KP_ID', 'PE_ID', 'RT', 'GVT',
        'events_processed', 'events_rolled_back',
        'remote_sends',  'remote_recvs', 'remote_events'
        ],
        dataTypes = [
            'int', 'int', 'int', 'float', 'float',
            'int', 'int', 'int', 'int', 'int'
        ];

    var features = ['events_processed', 'events_rolled_back',  'remote_events'];

    init(features);

    csv.read({
        filepath  :  DATA_DIR + DATASET  + '/ross-stats-rt-lps.csv',
        skip: 1,
        delimiter : ",",
        // bufferSize: 8 * 1024 * 1024,
        onload    : processData(headers, dataTypes, features),
        oncomplete: function() {

            fs.writeFile('./data/' +  DATASET +'/ross-stats-rt-lps.json', JSON.stringify(result), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });
}

function groupKpByRt() {
    var headers = [
            'KP_ID', 'PE_ID', 'RT', 'GVT', 'time_ahead_GVT', 'total_rollbacks', 'secondary_roll'
        ],
        dataTypes = [
            'int', 'int', 'float', 'float', 'float', 'int', 'int'
        ];

    var features = ['total_rollbacks', 'secondary_roll'];

    init(features);

    csv.read({
        filepath  : DATA_DIR + DATASET + '/ross-stats-rt-kps.csv',
        skip: 1,
        delimiter : ",",
        // bufferSize: 8 * 1024 * 1024,
        onload    : processData(headers, dataTypes, features),
        oncomplete: function() {

            fs.writeFile('./data/' +  DATASET +'/ross-stats-rt-kps.json', JSON.stringify(result), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });
}

function groupPeByRt() {
    var headers = [
        'PE_ID','RT', 'GVT',
        'network_read_CC', 'gvt_CC', 'fossil_collect_CC', 'event_abort_CC', 'event_process_CC', 'pq_CC', 'rollback_CC', 'cancelq_CC', 'avl_CC', 'buddy_CC', 'lz4_CC', 'events_aborted', 'pq_size', 'event_ties', 'fossil_collect_attempts', 'num_GVT_comps'

        ],
        dataTypes = [
            'int', 'float', 'float',
            'int', 'int', 'int', 'int', 'int',
            'int', 'int', 'int', 'int', 'int', 'int', 'int',
            'int', 'int', 'int', 'int'
        ];

    var features = ['events_aborted', 'event_ties', 'fossil_collect_attempts', 'num_GVT_comps'];

    init(features);

    csv.read({
        filepath  : DATA_DIR + DATASET + '/ross-stats-rt-kps.csv',
        skip: 1,
        delimiter : ",",
        // bufferSize: 8 * 1024 * 1024,
        onload    : processData(headers, dataTypes, features),
        oncomplete: function() {
            // console.log(result.length);
            fs.writeFile('./data/' +  DATASET +'/ross-stats-rt-pes.json', JSON.stringify(result), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });
}

groupLpByRt();

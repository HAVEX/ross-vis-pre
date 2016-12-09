var fs = require("fs"),
    csv = require("../../i2v/p4/src/io/node-dsv.js"),
    dataStruct = require('../../i2v/p4/src/core/datastruct'),
    pipeline = require('../../i2v/p4/src/core/pipeline'),
    scale = require('../../i2v/src/metric');

var CHUNK_SIZE = 50000;
var DATA_DIR = "/home/kelvin/Workspace/CODES/data/ross/df5k_N16_batch2_gvt256_kps256/";
// var DATA_DIR = "/storage/datasets/ross/best/";
var result = [];
var RTI = 127;
var maxRT = 1809309.625000;
var minRT = 1809146.125000;

var rtScale = scale({
    domain: [minRT, maxRT],
    range: [0, RTI]
});


function createProcessFunction(headers, dataTypes, dataProcess) {
    var count = 0,
        register = CHUNK_SIZE;

    return function(rawData) {
        var data = dataStruct({
            array: rawData,
            header: headers,
            types: dataTypes,
            skip: 1,
        }).objectArray();

        result = result.concat(data);
        // result =  result.concat(dataProcess(data));
        count += rawData.length;
        // console.log(count, result.length);

        var rt = rtScale
        result[data[0]]

        if(count > register) {
            result =  dataProcess(result);
            register += CHUNK_SIZE;
            console.log(count, result.length);
        }
    }

}

var groupLpByGvt = function() {

    var dataProcess = pipeline().group({
        $by: "GVT",
        events_processed: "$sum",
        events_rolled_back: "$sum",
        remote_sends: "$sum",
        remote_recvs: "$sum",
        remote_events: "$sum"
    });

    var headers = [
        'LP_ID', 'KP_ID', 'PE_ID', 'GVT',
        'events_processed', 'events_rolled_back',
        'remote_sends',  'remote_recvs', 'remote_events'
        ],
        dataTypes = [
            'int', 'int','int', 'float',
            'int', 'int', 'int', 'int', 'int'
        ],
        lpData = {};


    csv.read({
        filepath  : DATA_DIR + 'ross-stats-gvt-lps.csv',
        delimiter : ",",
        onload    : createProcessFunction(headers, dataTypes, dataProcess),
        oncomplete: function() {
            dataProcess.sortBy({GVT: 1});
            result = dataProcess(result);

            var maxGVT = result[result.length-1].GVT;

            var gvtScale = scale({
                domain: [0, maxGVT],
                range: [0, 480]
            });

            lpData = pipeline().derive(function(d){
                d.ts = Math.floor(d.GVT / (maxGVT/480));
            })
            .group({
                $by: "ts",
                GVT: "$min",
                maxGVT: "$max",
                events_processed: "$sum",
                events_rolled_back: "$sum",
                remote_sends: "$sum",
                remote_recvs: "$sum",
                remote_events: "$sum"
            })
            .sortBy({GVT: 1})
            (result)

            // console.log(lpData);
            // console.log(lpData.length);
            fs.writeFile("./data/ross-stats-gvt-lps-aggr.json", JSON.stringify(lpData), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });

}


var groupLpByRt = function() {
    var dataProcess = pipeline()
    .derive(function(d){
        d.RT = Math.floor(rtScale(d.RT));
    })
    .group({
        $by: ["RT", "LP_ID"],
        GVT: "$min",
        events_processed: "$sum",
        events_rolled_back: "$sum",
        remote_sends: "$sum",
        remote_recvs: "$sum",
        remote_events: "$sum"
    });

    var headers = [
        'LP_ID', 'KP_ID', 'PE_ID', 'RT', 'GVT',
        'events_processed', 'events_rolled_back',
        'remote_sends',  'remote_recvs', 'remote_events'
        ],
        dataTypes = [
            'int', 'int', 'int', 'float', 'float',
            'int', 'int', 'int', 'int', 'int'
        ],
        lpData = {};

    csv.read({
        filepath  : DATA_DIR + 'ross-stats-rt-lps.csv',
        delimiter : ",",
        onload    : createProcessFunction(headers, dataTypes, dataProcess),
        oncomplete: function() {
            dataProcess.sortBy({RT: 1});
            lpData = dataProcess(result);
            // console.log(lpData, lpData.length );
            //
            // lpData = pipeline().derive(function(d){
            //     d.RT = Math.floor(rtScale(d.RT));
            // })
            // .group({
            //     $by: "RT",
            //     // RT: "$min",
            //     GVT: "$min",
            //     events_processed: "$sum",
            //     events_rolled_back: "$sum",
            //     remote_sends: "$sum",
            //     remote_recvs: "$sum",
            //     remote_events: "$sum"
            // })
            // .sortBy({ts: 1})
            // (result)

            console.log(lpData);
            console.log(lpData.length);
            fs.writeFile("./aggr/ross-stats-rt-lps.json", JSON.stringify(lpData), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });

}

var adHocGroupLpByRt = function() {

    var headers = [
        'LP_ID', 'KP_ID', 'PE_ID', 'RT', 'GVT',
        'events_processed', 'events_rolled_back',
        'remote_sends',  'remote_recvs', 'remote_events'
        ],
        dataTypes = [
            'int', 'int', 'int', 'float', 'float',
            'int', 'int', 'int', 'int', 'int'
        ],
        lpData = [];

    var attributes = ['events_processed', 'events_rolled_back',  'remote_events'];

    for(var t = 0; t <= RTI; t++) {
        lpData[t] = {};
        lpData[t].GVT = Number.POSITIVE_INFINITY;
        attributes.forEach(function(attr, ai){
            lpData[t][attr] = [];
        });
    };
    var count = 0;
    // console.log(lpData);

    function processData(data) {

        data.forEach(function(d){
            var lp = parseInt(d[0]),
                rt = Math.floor(rtScale(d[3])),
                gvt = parseFloat(d[4]);

            // console.log(rt, lpData[rt]);
            if(rt <= RTI && rt >=0){

                // console.log(rt);
                var values = attributes.map(function(attr, ai){
                    return parseInt(d[headers.indexOf(attr)]);
                })

                if(typeof(lpData[rt]['events_processed'][lp]) !== "undefined") {
                    attributes.forEach(function(attr, ai){
                        lpData[rt][attr][lp] += values[ai];
                    });
                    if(lpData[rt].GVT > gvt) lpData[rt].GVT = gvt;
                } else {
                    attributes.forEach(function(attr, ai){
                        lpData[rt][attr][lp] = values[ai];
                    });
                }
            };

        });
        count += lpData.length;
        console.log(count);
    }

    csv.read({
        filepath  : DATA_DIR + 'ross-stats-rt-lps.csv',
        delimiter : ",",
        onload    : processData,
        oncomplete: function() {
            // console.log(lpData);
            console.log(lpData.length);
            fs.writeFile("./data/df5k-best/ross-stats-rt-lps.json", JSON.stringify(lpData), function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
        }
    });

}

adHocGroupLpByRt();

// csv.read({
//     filepath  : '/storage/datasets/ross/ross-stats-rt-kps.csv',
//     delimiter : ",",
//     onopen    : function() {
//         dataProcess = procKP;
//         headers = [
//             'KP_ID', 'PE_ID', 'rt', 'GVT', 'time_ahead_GVT',
//             'total_rollbacks', 'secondary_rollbacks',
//         ];
//         dataTypes = ['int', 'int', 'float', 'float', 'float', 'int', 'int']
//     },
//     onload    : loadData,
//     oncomplete: function() {
//         procKP.sortBy({ts: 1});
//         data = procKP(data);
//         console.log(data);
//         fs.writeFile("./timeStatsKP.json", JSON.stringify(data), function(err) {
//             if(err) {return console.log(err);}
//             console.log("The file was saved!");
//         });
//
//     }
// });
//

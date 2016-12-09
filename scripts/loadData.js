var fs = require("fs"),
    csv = require("../../i2v/p4/src/io/node-dsv.js"),
    dataStruct = require('../../i2v/p4/src/core/datastruct'),
    pipeline = require('../../i2v/p4/src/core/pipeline'),
    scale = require('../../i2v/src/metric');

var count = 0,
    chunk = 50000,
    register = chunk,
    headers = [],
    dataTypes = [],
    data = [];

var rtStart = 1809146.125000,
    rtEnd = 1809309.625000;

var timeScale = scale({
    domain: [rtStart, rtEnd],
    range: [0, 200]
})

var procKP = pipeline().derive(function(d, i){
        d.ts = Math.floor(timeScale(d.rt));
    })
    .group({
        $by: "ts",
        rt: "$min",
        GVT: "$min",
        total_rollbacks: "$sum",
        secondary_rollbacks: "$sum"
    });

var procLP = pipeline().derive(function(d, i){
        d.ts = Math.floor(timeScale(d.rt));
    })
    .group({
        $by: "ts",
        rt: "$min",
        GVT: "$min",
        events_processed: "$sum",
        events_rolled_back: "$sum",
        remote_sends: "$sum",
        remote_recvs: "$sum",
        remote_events: "$sum"
    });

var dataProcess;

function loadData(text) {
    var newData = dataStruct({
        array: text,
        header: headers,
        types: dataTypes,
        skip: 0,
    }).objectArray();

    data = data.concat(newData);
    count += text.length;


    if(count > register) {
        data =  dataProcess(data);
        register += chunk;
        console.log(count, data.length);
    }
}


csv.read({
    filepath  : '/storage/datasets/ross/ross-stats-rt-kps.csv',
    delimiter : ",",
    onopen    : function() {
        dataProcess = procKP;
        headers = [
            'KP_ID', 'PE_ID', 'rt', 'GVT', 'time_ahead_GVT',
            'total_rollbacks', 'secondary_rollbacks',
        ];
        dataTypes = ['int', 'int', 'float', 'float', 'float', 'int', 'int']
    },
    onload    : loadData,
    oncomplete: function() {
        procKP.sortBy({ts: 1});
        data = procKP(data);
        console.log(data);
        fs.writeFile("./timeStatsKP.json", JSON.stringify(data), function(err) {
            if(err) {return console.log(err);}
            console.log("The file was saved!");
        });

    }
});


csv.read({
    filepath  : '/storage/datasets/ross/ross-stats-rt-lps.csv',
    delimiter : ",",
    onopen    : function() {
        dataProcess = procLP;
        headers = [
            'LP_ID', 'PE_ID', 'rt', 'GVT',
            'events_processed', 'events_rolled_back',
            'remote_sends',  'remote_recvs', 'remote_events'
        ];

        dataTypes = [
            'int', 'int', 'float', 'float',
            'int', 'int', 'int', 'int', 'int']
    },
    onload    : loadData,
    oncomplete: function() {
        procLP.sortBy({ts: 1});
        data = procLP(data);
        fs.writeFile("./timeStatsLP.json", JSON.stringify(data), function(err) {
            if(err) {return console.log(err);}
            console.log("The file was saved!");
        });
    }
});

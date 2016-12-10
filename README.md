# ROSS-VIS
Visual analytics for the ROSS parallel discrete-event simulation engine.

## Software Installation
Installation requires the [ivastack](https://sphere.cs.ucdavis.edu/kelli/ivastack) framework. Please clone and install ivastack first.
Installing the software requires setting up the server and configuring the UI.
The server requires a server-side JavaScript environment which is commonly available in Linux systems. For other OS, please download and install ([NodeJS](https://nodejs.org/en/)).

To install all the dependencies, go to the project folder after cloning the project, and enter the follwing command:
```
npm install
```


## Data Preprocessing
Please use the scripts in the 'scripts' folder for preprocessing data. Note: the minimum and maximum real time or GVT values are needed.

```
node preprocessRT.js [RT_data_file] [RT_min] [RT_max]

node preprocessGVT.js [GVT_data_file] [GVT_min] [GVT_max]

node prepocessCE.js [Comm_event_data_file] [GVT_min] [GVT_max] [num_PE] [num_KP] [num_LP]

```

The scripts will generate multiple JSON files which contain the preprocessed data. Please put all the JSON files in a same folder to be used with the UI.


## Configuring the UI
Setup the data folder path and other parameters in the 'ui/config.js' file.


```
return {
    dataset: 'data/df5k_N64_batch8_gvt128_kps16',
    numKP: 16,
    numPE: 64
};
```


## Starting the server
```
PORT=8000 node server.js
```

Access the UI at http://localhost:8000

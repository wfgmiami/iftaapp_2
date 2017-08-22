const pg = require('pg');
const connectionString = ("postgres://iftauser:iftapass@iftadb.c5kmjpgo0lyp.us-east-1.rds.amazonaws.com/ifta")
const client = new pg.Client(connectionString);
const getDistance = require('request');

let _client;
const connect = (cb) => {
	if(_client)
		return cb(null, _client);
	client.connect(err => {
		if(!err){
			_client = client;
			return cb(null, _client);
		}
	})
}


const decodePoints = (body, cb) => {

 	let result = JSON.parse(body);
	let startState = result.routes[0].legs[0].start_address.split(", ")[1].trim();
 	let endState = result.routes[0].legs[0].end_address.split(", ")[1].trim();
 	let numSteps = result.routes[0].legs[0].steps.length;
 	let legs = result.routes[0].legs[0];
	let startPoint = result.routes[0].legs[0].start_location;
	let endPoint = result.routes[0].legs[0].end_location;
	let checkPoint = [];
	let stateMiles = [];
	let coordinates = [];

	connect( (err, client) => {
		if(err) cb(err);

		for( let step = 0; step < numSteps; step++ ){
			let str = legs.steps[step].polyline.points
			let index = 0,
				lat = 0,
				lng = 0,
				shift = 0,
				result = 0,
				byte = null,
				latitude_change,
				longitude_change,
				factor = Math.pow(10, 5)

			while (index < str.length){
				byte = null;
				shift = 0;
				result = 0;
				checkPoint[step] = [];

				do {
					byte = str.charCodeAt(index++) - 63;
					result |= (byte & 0x1f) << shift;
					shift += 5;
				} while ( byte >= 0x20 );

				latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
				shift = result = 0;

				do {
					byte = str.charCodeAt(index++) - 63;
					result |= (byte & 0x1f) << shift;
					shift += 5;
				} while (byte >= 0x20);

				longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
				lat += latitude_change;
				lng += longitude_change;
				coordinates.push({ lat: lat/factor, lng: lng/factor });

			}
		}

		let arraySize = 100;
		let loopCount = Math.floor(coordinates.length / arraySize);
		let remainder = coordinates.length % arraySize;
		if ( remainder ) loopCount++;
		let startCount = 0;
		let adjustedCoordinates = [];
		let newArray = [];


		for (let i = 0; i < loopCount; i++){

			newArray.push(coordinates.slice(startCount, arraySize + startCount));

			startCount += arraySize;
			if(i == loopCount - 1 && remainder) startCount += remainder;
		}

		newArray.forEach( array => {
			let arrayElement = array.reduce( (arr, points) => {
				if( typeof(arr) === 'object' ){
					arr = (`${ points.lng } ${ points.lat },`);
				}else{
					arr = arr + ' ' + (`${ points.lng } ${ points.lat },`);
				}
				return arr;
			},{}).slice(0,-1);

			adjustedCoordinates.push(arrayElement);

		});

		getAllStates(adjustedCoordinates, endState, { state: [], arrayPosition: [] }, 0, (err, statesBorderPoints) => {
			if(!err){
				let routeStatesPoints = produceStatesAndPoints( statesBorderPoints );
				cb(null, routeStatesPoints);
			}else{
				cb(err);
			}
		})
		
		const produceStatesAndPoints = ( statesAndPoints ) => {
	
			let stateMiles = [];

			for (let i = 0; i < statesAndPoints.states.length; i++){
				let separateStates = [];
				let separatePoints = statesAndPoints.points[i].split(' ');

				stateMiles.push( { state: startState, coordinates: [ startPoint, { lng: separatePoints[0], lat: separatePoints[1] } ] })
				separateStates.push(statesAndPoints.states[i].slice(0,2))
				separateStates.push(statesAndPoints.states[i].slice(2));

				startState = separateStates.filter( state => state != startState );
				startPoint = { lng: separatePoints[0], lat: separatePoints[1] };

				if (startState == endState){
					  stateMiles.push({ state: endState, coordinates: [ startPoint, endPoint ] })
				}
			}
			return stateMiles;

		}

  })
}

const  getAllStates = (coordinates, endState, allStates, i, cb) => {
		
		var flag = false;
		let queryString = `SELECT DISTINCT name FROM ogrgeojson WHERE ST_Intersects(wkb_geometry, ST_GeomFromText('LINESTRING( ${ coordinates[i] })', 4326))`;
			
		client.query(queryString, (err,result) => {
			if(err)
				return cb(err);
			if( result.rows.length ){
				
				for( let j = 0; j < result.rows.length; j++ ){

					let state = result.rows[j].name;
		
					if( allStates.state.indexOf( state ) === -1 ){
						allStates.state.push( result.rows[j].name );
						allStates.arrayPosition.push( i );

						if( allStates.state[allStates.state.length - 1] === endState ){
							flag = true;
							let statesBorderPoints = { states: [], points: [] };

							for( k = 0; k < allStates.state.length - 1 ; k++){
								statesBorderPoints.states.push( allStates.state[k] + allStates.state[k + 1] )
							}

							let index = 1;

							(function statesPoints(coordinates, statesBorderPoints, allStates, index, cb){

								let i = allStates.arrayPosition[index];

								binarySearch( coordinates[i].split(', '), false, function( err, borderPoints ){
									if(err) {
										return cb(err);
									}else{
										statesBorderPoints.points.push( borderPoints )
									}
									if( statesBorderPoints.points.length === statesBorderPoints.states.length ) cb( null, statesBorderPoints )
									else statesPoints( coordinates, statesBorderPoints, allStates, ++index, cb);
								});
									
							})(coordinates, statesBorderPoints, allStates, index, cb)
												
							
						}
					}
				}
				if( !flag ) getAllStates(coordinates, endState, allStates, ++i, cb);
			}
		})
}	
		
	
const binarySearch = ( coordinates, flag, cb ) => {
	if (coordinates.length === 2 || coordinates.length === 3)
		return cb(null, coordinates[0] );
	let half = Math.floor(coordinates.length / 2);
	let firstHalf = coordinates.slice( 0, half );
	let secondHalf = coordinates.slice( half );

	let queryString = `SELECT DISTINCT name FROM ogrgeojson WHERE ST_Intersects(wkb_geometry, ST_GeomFromText('LINESTRING( ${ firstHalf })', 4326))`;

	client.query(queryString, (err,result) => {
		if(err)
			return cb(err);

		if(result.rows.length){
			if( result.rows.length === 1 && !flag ){
				return cb(null, coordinates[0] );
			}else if( result.rows.length === 1 && flag ){
				return (null, binarySearch( secondHalf, true, cb ));
			}
			return (null, binarySearch( firstHalf, true, cb ));
		}
	})	
}

const getStateMiles = (data, cb) => {
	let milesByState = [];
	let tempArray = [];
	let statesInOrder = [];
	let state;
	let cnt = data.length;
	let track = 0;
  	 
	for(let i = 0; i < cnt; i++){
		statesInOrder.push( data[i].state );

		let lat = data[i].coordinates[0].lat;
		let lng = data[i].coordinates[0].lng;
		let endLat = data[i].coordinates[1].lat;
		let endLng = data[i].coordinates[1].lng;
		
		let url = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + lat + "," + lng + "&destinations=" + endLat + "," + endLng + "&mode=driving&key=AIzaSyBQ9sJrwFDMV8eMfMsO9gXS75XTNqhq43g";
		getDistance(url, i, (error, response, body) => {
			state = data[i].state;
			
			if (!error && response.statusCode == 200){
				let result = JSON.parse(body);
				let miles = result.rows[0].elements[0].distance.text;
				tempArray.push({ state: state, miles: miles });
				track++;

				if( track === cnt ){
					statesInOrder.forEach( state => {
						milesByState = milesByState.concat( tempArray.filter( obj => {
							return	obj.state === state;
						}))
					})
					cb(null, milesByState);
				}
			}

		})

	}
}

module.exports = {
	decodePoints,
	getStateMiles
}




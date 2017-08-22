import React, { Component } from 'react';
import InputComponent from './InputComponent';
import TaxTable from './TaxTable';

import axios from 'axios';

class MapElement extends Component {

	constructor(props){
		super();
		this.state = {
			bounds: {},
			map: {},
			markers: [],	
			mapOptions: {
				center: new google.maps.LatLng(38.87234, -95.96919),
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				zoom: 4

			},
			mapDiv: {},
			milesTable: [],
			request: [],
			directionRenderers: [],
			url: [],
			totalMiles: []
		}

		this.renderRoute = this.renderRoute.bind(this);
		this.removeRoute = this.removeRoute.bind(this);
		this.addMarker = this.addMarker.bind(this);
		this.showMarker = this.showMarker.bind(this);
		this.removeMarker = this.removeMarker.bind(this);
		this.hideMarker = this.hideMarker.bind(this);
		this.changeMarker = this.changeMarker.bind(this);
		this.generateRoute = this.generateRoute.bind(this);
		this.generateMileage = this.generateMileage.bind(this);
	}


	componentDidMount(){
		const mapDiv = document.getElementById("mapDiv");
		const bounds = new google.maps.LatLngBounds();
		bounds.extend(this.state.mapOptions.center);
		this.setState( { map: new google.maps.Map(mapDiv, this.state.mapOptions) });
		this.setState( { bounds } );
		this.setState( { mapDiv } );
    }
	
	addMarker({ address, position }, index){
		this.state.bounds.extend(position);
		this.state.map.fitBounds(this.state.bounds);
		let marker = new google.maps.Marker( { position: position } );
		if( index === 0 ){
			this.state.markers.unshift(marker);
		}else{
			this.state.markers.push(marker);
		}
		marker.setMap(this.state.map);
	}
 	
	showMarker( marker ){
		if(marker)
			marker.setMap(this.state.map);
	}

	removeMarker( index ){
		this.state.markers.forEach( (marker, _index) => {
			if(_index === index )
				marker.setMap(null);
		})
		this.state.markers.splice(index,1);
	}

	hideMarker( index ){
		this.state.markers.forEach( (marker, _index) => {
			if(_index === index )
				marker.setMap(null);
		})
	}

	changeMarker({ address, position }, index, flag ){
		let marker = new google.maps.Marker( { position: position } );
		this.state.markers.forEach( (mrk, _index) => {
			if(_index === index ){
				if( (index === 0 || index === 1) && flag ){
					this.removeMarker( _index );
					this.addMarker( marker, index )
				}else{
					this.state.markers.splice(_index, 1, marker);
				}			
						}				
		})
	}

	renderRoute(request, url){
		this.setState( { request } )
		this.setState( { url } )
	}

	generateRoute(){
		let request = this.state.request;
		let map = this.state.map;
		let dirRenderers = [];
		let dirRenderersOrdered = [];

		for(let i = 0; i < request.length; i++){
			let req = request[i];
			let directionsService = new google.maps.DirectionsService();
		
			directionsService.route(req, function(result, status){
				if(status === 'OK'){
					let directionDisplay = new google.maps.DirectionsRenderer({
						suppressMarkers: true
//						draggable: true	
					});
					directionDisplay.addListener('directions_changed', function(){
				//	directionDisplay.setMap(map);
				//	directionDisplay.setDirections(result);
					})
				
					directionDisplay.setDirections(result);
					dirRenderers.push(directionDisplay);
									
					
					if(dirRenderers.length === request.length){
						let index = 0;
						for(let j = 0; j < dirRenderers.length; j++){
							dirRenderers[j].setMap(map);
							while( dirRenderers[j].directions.request.origin.query != request[index].origin ){
								index++;
							}
							dirRenderersOrdered[index] = dirRenderers[j];
							index = 0;
						}
					}	
					
				}
			})	

		}
		this.state.directionRenderers = dirRenderersOrdered;
	}

	removeRoute(){
		var len = this.state.directionRenderers.length - 1;

		if(len > -1){
			this.state.directionRenderers[len].setMap(null);
			this.state.directionRenderers.splice(len, 1);
		}

	}

	generateMileage(){
		let urls = this.state.url;
		let tmpTotal = 0;
		let tmpMiles = [];
		let resultState = '';
		let resultMiles = 0;
		let found = false;

		for( let i = 0; i < urls.length; i++ ){
			axios.get('/api', { params: urls[i] })
			.then( result => {
					let stateMiles = [];
					let totalMiles = result.data.reduce( (memo, obj) => {
						let endPosition = obj.miles.indexOf('mi');
						let miles = Number(obj.miles.substring(0, endPosition));
						stateMiles.push({ state: obj.state, miles: miles });
						return memo += miles;	
					},0);

					totalMiles = Math.round( totalMiles * 100 ) / 100;	
					tmpTotal += totalMiles;
		
					for(let j = 0; j < stateMiles.length; j++){	
						if( Array.isArray( stateMiles[j].state) ){
							resultState = stateMiles[j].state[0]
						}else{
							resultState = stateMiles[j].state;
						}
						resultMiles = Math.round( stateMiles[j].miles * 100 ) / 100;				

						for( let k = 0; k < tmpMiles.length; k++){
							if( tmpMiles[k].state === resultState ){
								tmpMiles[k].miles += resultMiles;
								tmpMiles[k].miles = Math.round( tmpMiles[k].miles * 100 ) / 100;	
								found = true;
								break;
							}
						}

						if(!found || tmpMiles.length == 0){
							tmpMiles.push( { state: resultState, miles: resultMiles } );	
						}else{
							found = false;
						}
					}	

					if( i == urls.length - 1 ){
					   	this.setState( { totalMiles: tmpTotal } );
						this.setState( { milesTable: tmpMiles } );
					}
			})
		}
	}

	render(){
		return (
		  <div className="row">
			<div id="mapDiv" className="col-xs-12" style={{ height: "350px", marginBottom: '20px' }}>
			</div>
			<InputComponent updateMainState = { this.updateMainState } renderRoute = { this.renderRoute } removeRoute = { this.removeRoute } markers = { this.state.markers } addMarker = { this.addMarker } showMarker = { this.showMarker } removeMarker = { this.removeMarker }  hideMarker={ this.hideMarker } changeMarker = { this.changeMarker }  milesTable = { this.state.milesTable } generateMileage = { this.generateMileage} generateRoute = { this.generateRoute } totalMiles = { this.state.totalMiles }/>
			<TaxTable milesTable = { this.state.milesTable } />	
   	      </div>

		)
	}

}

export default MapElement;

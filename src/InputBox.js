import React,{ Component } from 'react';
import axios from 'axios';

class InputBox extends Component{

	constructor(){
		super();
		this.state = {};
		this.autoCompleteInput = this.autoCompleteInput.bind(this);
	}

	autoCompleteInput(newState){
		let offset = 0;
		
		if(newState){						
			let len = Object.keys(newState).length;
			offset = 1
			let requests = [];
			let startDestination = '';
			let nextDestination = '';

			for(var i = 0; i < len - 1; i++) {
				if(!newState[i].formatted_address) startDestination = newState[i];		
				else startDestination = newState[i].formatted_address;
		
				if(!newState[i + 1].formatted_address) nextDestination = newState[i + 1];		
				else nextDestination = newState[i + 1].formatted_address;

				var url = "https://maps.googleapis.com/maps/api/directions/json?origin=" + startDestination  + "&destination=" + nextDestination + "&key=AIzaSyBQ9sJrwFDMV8eMfMsO9gXS75XTNqhq43g"
					
				let request = {
					origin: startDestination,
					destination: nextDestination,
					travelMode: 'DRIVING'
				}
				requests.push(request);
			}
			this.props.renderRoute(requests, url);
		}
		
		let autocomplete =[];
		let inputs = document.getElementsByClassName('form-control destin');
		let inputCount = document.getElementsByClassName('form-control destin').length - offset;
		

		const autocompleteOptions = {
			types: ['(cities)'],
 		    componentRestrictions: { country: "us" }
		}

		for(let i = 0; i < inputCount; i++){
			let googleAutoComplete = new google.maps.places.Autocomplete(inputs[i], autocompleteOptions);
			autocomplete.push(googleAutoComplete);
			for( let j = 0; j < inputCount; j++){
				let obj = this.state;	
				obj[`${ i }`] = inputs[i].value
			}		
		
			function wrapper(i, newState){
				let inputNum = i;
				let updatedState = null;
				if(newState){
					updatedState = newState;
				}
				googleAutoComplete.addListener('place_changed', ( ) => {
				
					const place = googleAutoComplete.getPlace();
					let stateObj = this.state
					let keysArray = Object.keys(this.state).length;

					if(updatedState){
				   		keysArray = Object.keys(updatedState).length;
						stateObj = updatedState;
					}				   	

					stateObj[`${ inputNum }`] = place;
					this.setState(stateObj);						
					let requests = [];
					let urls = [];
					let startDestination = '';
					let nextDestination = '';

					for(var i = 0; i < keysArray - 1; i++) {
						if(!stateObj[i].formatted_address) startDestination = stateObj[i];		
						else startDestination = stateObj[i].formatted_address;
				
						if(!stateObj[i + 1].formatted_address) nextDestination = stateObj[i + 1];		
						else nextDestination = stateObj[i + 1].formatted_address;

						var url = "https://maps.googleapis.com/maps/api/directions/json?origin=" + startDestination  + "&destination=" + nextDestination + "&key=AIzaSyBQ9sJrwFDMV8eMfMsO9gXS75XTNqhq43g"
					
						let request = {
							origin: startDestination,
							destination: nextDestination,
							travelMode: 'DRIVING'
						}
						requests.push(request);
						urls.push(url);						
					}
					
					this.props.renderRoute(requests, urls);

					let position;
					let address;
					
					if(this.props.markers.length === 0 || this.props.markers.length === 1){
						let index = 0;
						if(stateObj[1]) index = 1;
						
						position = new google.maps.LatLng(stateObj[index].geometry.location.lat(), stateObj[index].geometry.location.lng());				 
						address = stateObj[index].formatted_address
							
						if(this.props.markers.length === 0 || this.props.markers.length === 1 && index === 1){
							this.props.addMarker({ address, position });
						}else if(this.props.markers.length === 1 && index == 0){	
							flag = true;								
							this.props.changeMarker({ address, position }, 0, flag );
						}
					}else{
				
						if(inputNum < keysArray - 1 || (inputNum === 0 || inputNum === 1)){
							var flag = false;
							position = new google.maps.LatLng(stateObj[inputNum].geometry.location.lat(), stateObj[inputNum].geometry.location.lng());
							address = stateObj[inputNum].formatted_address;
					
										
							if( inputNum === 0 || keysArray <= 2 ){
								flag = true;								
								this.props.changeMarker({ address, position }, inputNum, flag );
								this.props.removeRoute();
							}else{
								this.props.changeMarker({ address, position }, inputNum, flag );
							}			
						
						}else{
							this.props.hideMarker(this.props.markers.length - 1);
							position = new google.maps.LatLng(stateObj[keysArray - 1].geometry.location.lat(), stateObj[keysArray - 1].geometry.location.lng());
							address = stateObj[keysArray - 1].formatted_address
							this.props.addMarker({ address, position });
						}
					}
			
				})
		   	}
			wrapper.call(this, i, newState)
		}

	}

	componentDidMount(){
		this.autoCompleteInput(null);
	}


	componentWillUnmount(){

		var newState = Object.assign({}, this.state);
		var last = Object.keys(newState)[Object.keys(newState).length - 1];		
		let inputCount = document.getElementsByClassName('form-control destin').length;

		if(inputCount === this.props.markers.length){
			this.props.removeMarker(this.props.markers.length - 1);
			this.props.showMarker(this.props.markers[this.props.markers.length - 1]);
		}
	
		delete newState[last];
		this.setState( { newState } )
		this.autoCompleteInput( newState );
		this.props.removeRoute();
		
	}

	render(){	    
		return (
			<div>
				<b>Destination { this.props.numDestination > 1 ? this.props.index : null }</b>
				<input className="form-control destin" id = { this.props.numDestination } >
				</input>
				<br />
			</div>
		)
	}
}

export default InputBox;

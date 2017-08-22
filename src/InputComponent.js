import React,{ Component } from 'react';
import InputBox from './InputBox';
import InputForm from './InputForm';


class InputComponent extends Component{
	constructor(){
		super();

		this.state = {
			numChildren: 1 
		};

		this.removeDestination = this.removeDestination.bind(this);
		this.addDestination = this.addDestination.bind(this);
	}	


	addDestination(e){
		e.preventDefault();
		this.setState({ numChildren: this.state.numChildren + 1 });	
	}

	removeDestination(e){
		e.preventDefault();
		this.setState({ numChildren: this.state.numChildren - 1 });
	}

	render(){
		const children = [];
		for(let i = 0; i < this.state.numChildren; i++){			
			children.push(<InputBox key = { i } index = { i + 1  } numDestination = { this.state.numChildren } addMarker={ this.props.addMarker } showMarker={ this.props.showMarker } hideMarker={ this.props.hideMarker }  removeMarker = { this.props.removeMarker } changeMarker = { this.props.changeMarker } markers = { this.props.markers } renderRoute = { this.props.renderRoute } removeRoute = { this.props.removeRoute }  />)
		}

		return (
			<InputForm numDestination={ this.state.numChildren } addDestination = { this.addDestination } removeDestination = { this.removeDestination } milesTable = { this.props.milesTable } generateRoute = { this.props.generateRoute } generateMileage = { this.props.generateMileage } totalMiles = { this.props.totalMiles } >
				{ children }
			</ InputForm>
		)
	}
}

export default InputComponent;

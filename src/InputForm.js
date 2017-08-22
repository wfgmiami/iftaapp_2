import React, { Component } from 'react';


class InputForm extends Component{
	constructor(props){
		super();
		this.inputBoxCheck = this.inputBoxCheck.bind(this); 
	}	

	inputBoxCheck(e){
		let inputBoxes = document.getElementsByClassName('form-control destin');
		let countBoxes = document.getElementsByClassName('form-control destin').length;
		
		if(inputBoxes[countBoxes - 1].value == ''){
			alert('Fill in the previous destination box !');
		}else{
			this.props.addDestination(e)
		}
	}

	render(){
		//console.log(this.props);	
		return (	
			
		  <div className="form-group">	
			<div className="col-xs-3">
				<b>Starting Location</b> { ' ' }
				<input className="form-control destin" />		
				<br />
				
				{ this.props.children }
				
				<button className="btn btn-default" onClick={ this.inputBoxCheck }>Add Destination</button>{ ' ' }
				{ this.props.numDestination > 1 ? <button className="btn btn-default" onClick={ this.props.removeDestination }> Remove Destination</button> : null }
			</div> 	
		   <div className="col-xs-2">
		   		<div style={{ marginBottom: '10px' }}>
				<button className="btn btn-default" onClick={ this.props.generateRoute }>Generate Route</button>{ ' ' }
				<button className="btn btn-default" onClick={ this.props.generateMileage }>State Mileage</button>
				</div>
		   { this.props.milesTable.length ? 
   		   		<div className="panel panel-default">	
					<div className="panel-heading">		   
						<span className="col-xs-6">STATE</span>
						<span className="col-xs-6">MILES</span>
						<br style={{ clear:"both" }} />
					</div>
				
			
				{ this.props.milesTable.map( (stateMiles,index) => {
				
					return(
						 <div key = { index } className="panel-body">
							 <span className="col-xs-6">{ stateMiles.state }</span>
							 <span className="col-xs-6">{ stateMiles.miles }</span>
						 </div>						
						)
				 })
				}
					<div className="panel-footer">
						<span className="col-xs-6">TOTAL: </span>
						<span className="col-xs-6">{ this.props.totalMiles } </span>
						<br style={{ clear:"both" }} />
					</div>
				</div>
			: null }		
   		   </div>
		 </div> 
	

		)
	}	
}	

export default InputForm;


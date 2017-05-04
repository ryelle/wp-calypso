/**
 * External dependencies
 */
import ReactDom from 'react-dom';
import React, { Component } from 'react';
import axe from 'axe-core';

/**
 * Internal dependencies
 */
import Gridicon from 'gridicons';
import ButtonGroup from 'components/button-group';
import Button from 'components/button';

const axeContext = {
	include: [ [ '#primary' ] ],
};

const axeOptions = {
	runOnly: {
		type: 'tag',
		values: [ 'wcag2a', 'cat.color' ]
	}
};

class AxeButton extends Component {
	constructor() {
		super();
		this.state = {
			results: {
				violations: [],
				passes: []
			}
		};
		this.onClick = this.onClick.bind( this );
		this.highlightItems = this.highlightItems.bind( this );
	}

	onClick() {
		this.setState( {
			results: {
				violations: [],
				passes: []
			}
		} );

		axe.run( axeContext, axeOptions, ( err, results ) => {
			if ( err ) {
				throw err;
			}

			this.setState( { results } );
		} );
	}

	highlightItems( nodes ) {
		return () => {
			nodes.map( ( item ) => {
				const target = item.target.slice( 0, 1 );
				const el = document.querySelector( target );
				el.style.outline = '3px solid red';
			} );
		};
	}

	unhighlightItems( nodes ) {
		return () => {
			nodes.map( ( item ) => {
				const target = item.target.slice( 0, 1 );
				const el = document.querySelector( target );
				el.style.outline = '';
			} );
		};
	}

	renderResults() {
		if ( this.state.results.violations.length ) {
			return this.state.results.violations.map( ( item, i ) => {
				return (
					<div key={ i } className="a11y-helper__violation">
						<ButtonGroup>
							<Button onClick={ this.highlightItems( item.nodes ) } compact>
								<Gridicon icon="visible" />
							</Button>
							<Button onClick={ this.unhighlightItems( item.nodes ) } compact>
								<Gridicon icon="not-visible" />
							</Button>
						</ButtonGroup>
						<h5>
							<span className={ `a11y-helper__violation-level is-${ item.impact }` }>{ item.impact }</span>
							<span>{ `${ item.id } (${ item.nodes.length })` }</span>
						</h5>
						<p>{ item.description }</p>
					</div>
				);
			} );
		}

		if ( this.state.results.passes.length ) {
			return (
				<p>Good job, no accessibility violations on screen!</p>
			);
		}

		return (
			<p>Click AXE to run accessibility tests</p>
		);
	}

	render() {
		return (
			<div>
				<span style={ { cursor: 'pointer' } } onClick={ this.onClick }>aXe</span>
				<div className="a11y-helper__test-results card">
					{ this.renderResults() }
				</div>
			</div>
		);
	}
}

export default function injectHelper( element ) {
	ReactDom.render(
		React.createElement( AxeButton ),
		element
	);
}

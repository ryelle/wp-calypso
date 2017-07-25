/**
 * External dependencies
 */
import React, { PropTypes, Component } from 'react';
import { localize } from 'i18n-calypso';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';

/**
 * Internal dependencies
 */
import BulkSelect from 'woocommerce/components/bulk-select';
import Button from 'components/button';
import Card from 'components/card';
import ExtendedHeader from 'woocommerce/components/extended-header';
import FoldableCard from 'components/foldable-card';
import PackagesList from './packages-list';
import AddPackageDialog from './add-package';
import * as PackagesActions from '../../state/packages/actions';
import { getSelectedSiteId } from 'state/ui/selectors';
import { getPackagesForm } from '../../state/packages/selectors';

class Packages extends Component {
	componentWillMount() {
		if ( this.props.siteId ) {
			this.props.fetchSettings( this.props.siteId );
		}
	}

	componentWillReceiveProps( props ) {
		if ( props.siteId !== this.props.siteId ) {
			this.props.fetchSettings( props.siteId );
		}
	}

	predefSummary = ( serviceSelected, groupDefinitions ) => {
		const groupPackageIds = groupDefinitions.map( ( def ) => def.id );
		const diffLen = _.difference( groupPackageIds, serviceSelected ).length;
		const { translate } = this.props;

		if ( 0 >= diffLen ) {
			return translate( 'All packages selected' );
		}

		const selectedCount = groupPackageIds.length - diffLen;
		return translate( '%(selectedCount)d package selected', '%(selectedCount)d packages selected', {
			count: selectedCount,
			args: { selectedCount },
		} );
	};

	renderPredefHeader = ( isPlaceholder, title, selected, packages, serviceId, groupId ) => {
		if ( isPlaceholder ) {
			return (
				<div className="packages__group-header" >
					<BulkSelect
						totalElements={ 0 }
						selectedElements={ 1 }
						className="packages__group-header-checkbox" />
					<p /><p /><p />
				</div>
			);
		}

		if ( ! selected ) {
			return null;
		}

		const onToggle = ( state, event ) => {
			event.stopPropagation();
			this.props.toggleAll( this.props.siteId, serviceId, groupId, event.target.checked );
		};

		return (
			<div className="packages__group-header" >
				<BulkSelect
					totalElements={ packages.length }
					selectedElements={ selected.length }
					onToggle={ onToggle }
					className="packages__group-header-checkbox" />
				{ title }
			</div>
		);
	};

	renderPredefinedPackages = () => {
		const elements = [];
		const { siteId, isFetching, translate, form } = this.props;

		if ( isFetching ) {
			return [ {}, {} ].map( ( o, i ) => (
				<FoldableCard
					className="packages__predefined-packages placeholder"
					key={ i }
					header={ this.renderPredefHeader( true ) }
					summary={ <p /> }
					clickableHeader={ true }
					expanded={ false }
					icon="chevron-down"
				/>
			) );
		}

		_.forEach( form.predefinedSchema, ( servicePackages, serviceId ) => {
			const serviceSelected = form.packages.predefined[ serviceId ] || [];

			_.forEach( servicePackages, ( predefGroup, groupId ) => {
				const groupPackages = predefGroup.definitions;
				const nonFlatRates = _.reject( groupPackages, 'is_flat_rate' );
				if ( ! nonFlatRates.length ) {
					return;
				}

				const groupSelected = _.filter( serviceSelected, selectedId => _.some( groupPackages, pckg => pckg.id === selectedId ) );
				const summary = this.predefSummary( groupSelected, nonFlatRates );

				elements.push( <FoldableCard
					className="packages__predefined-packages"
					key={ `${ serviceId }_${ groupId }` }
					header={ this.renderPredefHeader( false, predefGroup.title, groupSelected, nonFlatRates, serviceId, groupId ) }
					summary={ summary }
					expandedSummary={ summary }
					clickableHeader={ true }
					expanded={ false }
					screenReaderText={ translate( 'Expand Services' ) }
					icon="chevron-down"
				>
					<PackagesList
						siteId={ siteId }
						packages={ groupPackages }
						selected={ groupSelected }
						serviceId={ serviceId }
						groupId={ groupId }
						toggleAll={ this.props.toggleAll }
						togglePackage={ this.props.togglePackage }
						dimensionUnit={ form.dimensionUnit }
						editable={ false } />
				</FoldableCard> );
			} );
		} );

		return elements;
	};

	render() {
		const { isFetching, siteId, form, translate } = this.props;

		const addPackage = () => ( this.props.addPackage( siteId ) );

		return (
			<div>
				<ExtendedHeader
					label={ translate( 'Packages' ) }
					description={ translate( 'Add boxes, envelopes, and other packages you use most frequently.' ) }>
					<Button onClick={ addPackage } disabled={ isFetching }>{ translate( 'Add package' ) }</Button>
				</ExtendedHeader>
				<Card className="packages__packages">
					<PackagesList
						siteId={ this.props.siteId }
						isFetching={ isFetching }
						packages={ ( form.packages || {} ).custom }
						dimensionUnit={ form.dimensionUnit }
						editable={ true }
						removePackage={ this.props.removePackage }
						editPackage={ this.props.editPackage } />
					{ ( ! isFetching ) && <AddPackageDialog { ...this.props } /> }
				</Card>
				<ExtendedHeader
					label={ translate( 'Service Packages' ) }
					description={ translate( 'Select packages provided by the shipping services that you use.' ) } />
				<Card className="packages__packages">
					{ this.renderPredefinedPackages() }
				</Card>
			</div>
		);
	}
}

Packages.propTypes = {
	addPackage: PropTypes.func.isRequired,
	removePackage: PropTypes.func.isRequired,
	editPackage: PropTypes.func.isRequired,
	dismissModal: PropTypes.func.isRequired,
	setSelectedPreset: PropTypes.func.isRequired,
	savePackage: PropTypes.func.isRequired,
	updatePackagesField: PropTypes.func.isRequired,
	toggleOuterDimensions: PropTypes.func.isRequired,
	setModalErrors: PropTypes.func.isRequired,
	showModal: PropTypes.bool,
	form: PropTypes.object,
};

export default connect(
	( state ) => {
		const siteId = getSelectedSiteId( state );
		const form = getPackagesForm( state, siteId );
		return {
			siteId,
			isFetching: ! form || ! form.packages || form.isFetching,
			form,
		};
	},
	( dispatch ) => (
		{
			...bindActionCreators( PackagesActions, dispatch ),
		} )
)( localize( Packages ) );
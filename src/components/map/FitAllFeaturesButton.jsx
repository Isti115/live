/**
 * @file React Component to display and adjust the rotation of the map view.
 */

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { showSnackbarMessage } from '../../actions/snackbar'

import ol from 'openlayers'

import { mapReferenceRequestSignal, fitAllFeaturesSignal } from '../../signals'

import IconButton from 'material-ui/IconButton'
import DeviceGpsFixed from 'material-ui/svg-icons/device/gps-fixed'

/**
 * React Component to adjust the view so that it fits all of the current features.
 *
 * @param {Object} props properties of the react component
 * @property {number} margin amount of margin to leave between the features
 * and the border of the view
 * @property {number} duration the amount of time the transition should take (in ms)
 *
 * @emits {mapReferenceRequestSignal} requests map reference.
 */
class FitAllFeaturesButton extends React.Component {
  /**
   * Constructor that binds context to functions,
   * and requests map reference with callback.
   *
   * @param {Object} props properties of the react component
   * @property {number} margin amount of margin to leave between the features
   * and the border of the view
   * @property {number} duration the amount of time the transition should take (in ms)
   *
   * @emits {mapReferenceRequestSignal} requests map reference.
   */
  constructor (props) {
    super(props)

    this.onMapReferenceReceived_ = this.onMapReferenceReceived_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)
    this.geolocationReceived_ = this.geolocationReceived_.bind(this)

    fitAllFeaturesSignal.add(this.handleClick_)

    mapReferenceRequestSignal.dispatch(this.onMapReferenceReceived_)
  }

  render () {
    return (
      <IconButton onClick={this.handleClick_} tooltip={'Fit all features'}>
        <DeviceGpsFixed />
      </IconButton>
    )
  }

  /**
  * Callback for receiving the map reference and saving it.
  *
  * @param {ol.Map} map the map to attach the event handlers to
  */
  onMapReferenceReceived_ (map) {
    this.map = map
  }

  /**
  * Event handler that calculates the target extent and fits it into the view.
  *
  * @param {Event} e the event fired from the IconButton component
  */
  handleClick_ (e) {
    const view = this.map.getView()

    let feasibleLayers = this.map.getLayers().getArray().filter(this.isLayerFeasible_)
    let featureArrays = feasibleLayers.map(l => l.getSource().getFeatures())
    let features = [].concat.apply([], featureArrays)
    let featureExtents = features.map(f => {
      const geometry = f.getGeometry()
      return geometry ? geometry.getExtent() : undefined
    }).filter(e => e !== undefined)

    if (featureExtents.length === 0) {
      this.props.dispatch(showSnackbarMessage(
        'No valid feature extents avaiable, trying to get geolocation instead'
      ))

      // This only works on secure origins
      if ('geolocation' in window.navigator) {
        window.navigator.geolocation.getCurrentPosition(this.geolocationReceived_)
      }

      return
    }

    const mergedExtent = featureExtents.reduce(
      (bigExtent, currentExtent) => ol.extent.extend(bigExtent, currentExtent),
      ol.extent.createEmpty()
    )

    const bufferedExtent = ol.extent.buffer(mergedExtent, this.props.margin)

    this.map.beforeRender(ol.animation.zoom({
      resolution: view.getResolution(),
      duration: this.props.duration,
      easing: ol.easing.easeOut
    }))

    this.map.beforeRender(ol.animation.pan({
      source: view.getCenter(),
      duration: this.props.duration,
      easing: ol.easing.easeOut
    }))

    // this.map.beforeRender(ol.animation.rotate({
    //   rotation: view.getRotation(),
    //   duration: this.props.duration,
    //   easing: ol.easing.easeOut
    // }))
    //
    // view.setRotation(0)

    view.fit(bufferedExtent, this.map.getSize())
  }

  /**
   * Returns whether a given layer is visible and has an associated vector
   * source.
   *
   * @param {ol.layer.Layer} layer  the layer to test
   * @return {boolean} whether the layer is visible and has an associated
   *         vector source
   */
  isLayerFeasible_ (layer) {
    return layer && layer.getVisible() && layer instanceof ol.layer.Vector
  }

  /**
  * Event handler that centers the map to the received position.
  *
  * @param {Object} position the position object provided by the geolocation service
  */
  geolocationReceived_ (position) {
    const view = this.map.getView()

    this.map.beforeRender(ol.animation.pan({
      source: view.getCenter(),
      duration: this.props.duration,
      easing: ol.easing.easeOut
    }))

    let center = ol.proj.fromLonLat(
      [position.coords.longitude, position.coords.latitude],
      'EPSG:3857'
    )

    view.setCenter(center)
  }
}

FitAllFeaturesButton.propTypes = {
  duration: PropTypes.number,
  margin: PropTypes.number,
  dispatch: PropTypes.func
}

export default connect()(FitAllFeaturesButton)

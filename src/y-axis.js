import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { StyleSheet, Text, View } from 'react-native'
import * as scale from 'd3-scale'
import * as array from 'd3-array'

class YAxis extends PureComponent {

    state = {
        height: 0,
        textHeight: 0,
    }

    _onLayout(event) {
        const { nativeEvent: { layout: { height } } } = event
        this.setState({ height })
    }

    _onTextLayout(event) {
        const { nativeEvent: { layout: { height } } } = event
        if (height === this.state.textHeight) {
            return
        }
        this.setState({ textHeight: height })
    }

    render() {

        const {
                  style,
                  dataPoints,
                  pointsText,
                  bgColors,
                  labelHeight,
                  numberOfTicks,
                  labelStyle,
                  formatLabel,
                  isFill,
                  contentInset: {
                      top    = 0,
                      bottom = 0,
                  },
              }                      = this.props
        const { height, textHeight } = this.state

        if (dataPoints.length === 0) {
            return <View style={ style }/>
        }

        const extent = array.extent([ ...dataPoints, Math.min(...dataPoints) ])
        const ticks  = dataPoints//array.ticks(extent[ 0 ], extent[ 1 ], numberOfTicks)

        const y = scale.scaleLinear()
            .domain(extent)
            .range([ bottom, height - top ])

        const longestValue = ticks
            .map(value => formatLabel(value))
            .reduce((prev, curr) => prev.toString().length > curr.toString().length ? prev : curr, 0)

        return (
            <View style={[ style ]}>
                <View
                    style={{ flex: 1 }}
                    onLayout={event => this._onLayout(event)}
                >
                    {/*This invisible component allows for parent sizing*/}
                    <Text style={[ styles.text, labelStyle, styles.invisibleText ]}>
                        {pointsText.length > 0 ? pointsText[pointsText.length - 1] : longestValue}
                    </Text>
                    {dataPoints.map((value, index) => {
                        return (
                            <Text
                                key={index}
                                numberOfLines={1}
                                pointerEvents="none"
                                //'clip' not supported on android
                                // ellipsizeMode={'clip'}
                                onLayout={event => this._onTextLayout(event)}
                                style={[
                                    styles.text,
                                    labelStyle,
                                    {
                                        bottom: y(value),    // Need to change in future use
                                        transform: [ { translateY: textHeight / 2 } ],
                                        backgroundColor: 'transparent',   //bgColors.length == 0 ? 'transparent' : bgColors[index],
                                        height:labelHeight,
                                        left: isFill ? 5 : 0,
                                        textAlign: isFill ? 'left' : 'center',
                                        lineHeight: labelHeight,
                                    },
                                ]}
                            >
                                {pointsText.length > 0 ? pointsText[index] : formatLabel(value)}
                            </Text>
                        )
                    })}
                </View>
            </View>
        )
    }
}

YAxis.propTypes = {
    dataPoints: PropTypes.arrayOf(PropTypes.number).isRequired,
    pointsText: PropTypes.arrayOf(PropTypes.string),
    bgColors: PropTypes.arrayOf(PropTypes.string),
    labelHeight: PropTypes.number,
    style: PropTypes.any,
    labelStyle: PropTypes.any,
    numberOfTicks: PropTypes.number,
    formatLabel: PropTypes.func,
    isFill: PropTypes.bool,
    contentInset: PropTypes.shape({
        top: PropTypes.number,
        bottom: PropTypes.number,
    }),
}

YAxis.defaultProps = {
    numberOfTicks: 10,
    contentInset: {},
    formatLabel: value => value && value.toString(),
    isFill: false,
}

const styles = StyleSheet.create({
    text: {
        // borderWidth: 1,
        // borderColor: 'red',
        minHeight: 14,
        fontSize: 10,
        textAlign: 'center',
        backgroundColor: 'transparent',
        // backgroundColor: 'red',
        position: 'absolute',
        left: 0,
        right: 0,
    },
    invisibleText: {
        paddingHorizontal: 2,
        color: 'transparent',
        position: 'relative',
    },
})

export default YAxis

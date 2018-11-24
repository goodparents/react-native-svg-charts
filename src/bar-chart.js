import * as array from 'd3-array'
import * as scale from 'd3-scale'
import * as shape from 'd3-shape'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { View } from 'react-native'
import Svg, { Defs, G, ClipPath, Rect } from 'react-native-svg'
import Path from './animated-path'
import Grid from './grid'

class BarChart extends PureComponent {

    state = {
        width: 0,
        height: 0,
    }

    _onLayout(event) {
        const { nativeEvent: { layout: { height, width } } } = event
        this.setState({ height, width })
    }

    _getBar(value, x, y, barIndex, valueIndex, barWidth, color) {
        return {
            value,
            color,
            area: shape.area()
            // place the bar on the x-axis based on valueIndex + its index among the other bars in its group
                .x((point, _index) =>
                    _index === 0 ?
                        x(valueIndex) + (barWidth * barIndex) :
                        x(valueIndex) + barWidth + (barWidth * barIndex),
                )
                .y0(y(0))
                .y1(point => y(point))
                .defined(value => value)
                ([ value, value ]),
        }
    }

    render() {
        const {
            data,
            yAxisValues,
            dataPoints,
            spacing,
            animate,
            animationDuration,
            style,
            showGrid,
            renderGradient,
            numberOfTicks,
            tickHeight,
            ticksColor,
            contentInset: {
                top    = 0,
                bottom = 0,
                left   = 0,
                right  = 0,
            },
            gridMax,
            gridMin,
            gridProps,
            extras,
            renderExtra,
            renderDecorator,
            isFillTop,
            maximumValue,
            maximumColor,
        } = this.props

        if (!data && dataPoints) {
            throw `"dataPoints" have been renamed to "data" to better reflect the fact that it's an array of  objects`
        }

        const { height, width } = this.state

        if (data.length === 0 || data[ 0 ].values.length === 0) {
            return <View style={ style }/>
        }

        if (data.length > 0 && typeof data[ 0 ] === 'object') {
            const lengths = Object.values(data).map(obj => obj.values.length)
            const extent  = array.extent(lengths)
            if (extent[ 0 ] - extent[ 1 ] !== 0) {
                throw new Error(`value arrays must be of equal length. Lengths are [${lengths}]`)
            }
        }

        const values = array.merge(Object.values(data).map(obj => obj.values))

        const extent = [ Math.min(...yAxisValues), Math.max(...yAxisValues) ]  //array.extent([ ...values, gridMax, gridMin ])
        const ticks  = yAxisValues   //array.ticks(extent[ 0 ], extent[ 1 ], numberOfTicks)

        //invert range to support svg coordinate system
        const y = scale.scaleLinear()
            .domain(extent)
            .range([ height - bottom, top ])

        // use index as domain identifier instead of value since
        // same value can occur at several places in data
        const x = scale.scaleBand()
            .domain(data[ 0 ].values.map((_, index) => index))
            .range([ left, width - right ])
            .paddingInner([ spacing ])
            .paddingOuter([ spacing ])

        const numberOfDifferentBars = Object.keys(data).length
        const barWidth              = x.bandwidth() / numberOfDifferentBars
        const dataLength            = data[ 0 ].values.length

        let areas = []
        for (let i = 0; i < dataLength; i++) {

            //pick up the value from each "bar collection"
            const currentValues = Object.values(data)
                .map(obj => obj.values[ i ])

            const currentColors = Object.values(data)
                .map(obj => obj.colors[ i ])

            //for each value calculate the bar area. The object index plays a big role
            currentValues.forEach((value, barIndex) => {

                // eslint-disable-next-line no-unused-vars
                const { values, positive, negative, ...other } = data[ barIndex ]

                const bar = this._getBar(value, x, y, barIndex, i, barWidth, currentColors[barIndex])

                areas.push({
                    ...bar,
                    positive,
                    negative,
                    ...other,
                })
            })
        }

        return (
            <View style={style}>
                <View
                    style={{ flex: 1 }}
                    onLayout={event => this._onLayout(event)}
                >
                    <Svg style={{ flex: 1 }}>
                        {
                            areas.map((bar, index) => {
                                if (!bar.area) {
                                    return null
                                }

                                const props = bar.value < 0 ? bar.negative : bar.positive

                                return (
                                    <G key={index}>
                                        <Defs>
                                            {
                                                renderGradient && renderGradient({
                                                    id: `gradient-${index}`,
                                                    ...props,
                                                    value: bar.value,
                                                })
                                            }
                                        </Defs>
                                        {
                                            isFillTop && <Defs key={ 'clips' }>
                                                            <ClipPath id={ 'clip-path-top' }>
                                                                <Rect x={ '0' } y={ `${-(this.state.height-y(maximumValue))}` } width={ this.state.width } height={ '100%' }/>
                                                            </ClipPath>
                                                        </Defs>
                                        }
                                        <Path
                                            { ...props }
                                            fill={ renderGradient ? `url(#gradient-${index})` : bar.color }
                                            d={bar.area || null}
                                            animate={animate}
                                            animationDuration={animationDuration}
                                        />
                                        {
                                            isFillTop && <Path
                                                            { ...props }
                                                            d={bar.area || null}
                                                            fill={ maximumColor }
                                                            animate={animate}
                                                            animationDuration={animationDuration}
                                                            clipPath={'url(#clip-path-top)'}
                                                        />
                                        }
                                    </G>
                                )
                            })
                        }
                        {
                            showGrid &&
                            <Grid
                                y={ y }
                                ticks={ ticks }
                                height={ tickHeight }
                                ticksColor={ ticksColor }
                                gridProps={ gridProps }
                            />
                        }
                        { data[ 0 ].values.map((value, index) => renderDecorator(
                            {
                                value,
                                x,
                                y,
                                index,
                                bandwidth: x.bandwidth(),
                            }
                        )) }
                        { extras.map((item, index) => renderExtra({ item, x, y, index, width, height })) }
                    </Svg>
                </View>
            </View>
        )
    }
}

BarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        fillColor: PropTypes.string,
        strokeColor: PropTypes.string,
        strokeColorNegative: PropTypes.string,
        fillColorNegative: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number).isRequired,
        colors: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    yAxisValues: PropTypes.arrayOf(PropTypes.number).isRequired,
    style: PropTypes.any,
    renderGradient: PropTypes.func,
    spacing: PropTypes.number,
    animate: PropTypes.bool,
    animationDuration: PropTypes.number,
    contentInset: PropTypes.shape({
        top: PropTypes.number,
        left: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
    }),
    numberOfTicks: PropTypes.number,
    tickHeight: PropTypes.number,
    ticksColor: PropTypes.arrayOf(PropTypes.string),
    showGrid: PropTypes.bool,
    gridMin: PropTypes.number,
    gridMax: PropTypes.number,
    gridProps: PropTypes.object,
    temp: PropTypes.string,
    extras: PropTypes.array,
    renderExtra: PropTypes.func,
    renderDecorator: PropTypes.func,
    isFillTop: PropTypes.bool,
    maximumValue: PropTypes.number,
    maximumColor: PropTypes.string,
}

BarChart.defaultProps = {
    spacing: 0.05,
    width: 100,
    height: 100,
    contentInset: {},
    numberOfTicks: 10,
    showGrid: true,
    gridMin: 0,
    gridMax: 0,
    extras: [],
    renderDecorator: () => {
    },
    renderExtra: () => {
    },
}

export default BarChart
